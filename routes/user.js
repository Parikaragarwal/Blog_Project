const fs = require("fs"); // To delete files
const { Router, response } = require("express");
const multer = require('multer');
const { userStorage } = require("../utils/cloudinary");
const { cloudinary } = require("../utils/cloudinary"); 
const path = require("path");
const methodOverride = require("method-override");
const validator = require("validator"); // For sanitizing inputs
const User = require("../models/user");

const router = Router();

const upload = multer({ storage: userStorage });

router.get("/signIn", (req, res) => {
    return res.render("signIn");
});

router.get("/signUp", (req, res) => {
    return res.render("signUp");
});

router.get("/account", async (req, res) => {
    const user = await User.findOne({ email: req.cookies.email });
    return res.render("account", {
        dp: req.cookies.dp,
        user,
    });
});

router.post("/account", upload.single("profileImg"), async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user = await User.findOne({ email: req.cookies.email });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const updates = {};
        let { fullname, password } = req.body;

        if (fullname) updates.fullname = validator.escape(fullname);
        if (password) updates.password = validator.escape(password);

        // Handle Profile Image Upload
        if (req.file) {
            // Delete old image from Cloudinary (if not default)
            if (!user.profileImgURL.includes("default.png")) {
                const publicId = user.profileImgURL.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(`user_profiles/${publicId}`);
            }
            updates.profileImgURL = req.file.path;
        }

        await User.updateOne({ email: req.cookies.email }, updates);

        if (updates.fullname) res.cookie("fullName", updates.fullname);
        if (updates.profileImgURL) res.cookie("dp", updates.profileImgURL);

        return res.status(200).redirect("/");
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
});


router.post("/account/delete", async (req, res) =>
     {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user = await User.findOne({ email: req.cookies.email });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Delete profile image from Cloudinary (if not default)
        if (!user.profileImgURL.includes("default.png")) {
            const publicId = user.profileImgURL.split("/").pop().split(".")[0]; // Extract Cloudinary public_id
            await cloudinary.uploader.destroy(`user_profiles/${publicId}`);
        }

        // Delete the user from the database
        await User.deleteOne({  email: req.cookies.email });

        // Clear cookies
        res.clearCookie("token");
        res.clearCookie("dp");
        res.clearCookie("fullName");

        return res.status(200).json({ message: "Account deleted successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/logout", (req, res) => {
    res.clearCookie("email");
    res.clearCookie("token");
    res.clearCookie("dp");
    res.clearCookie("fullName").redirect("/user/signIn");
});

router.post("/signIn", async (req, res) => {
    const { email, password } = req.body;

    // Sanitize email and password
    const sanitizedEmail = validator.normalizeEmail(email); // Normalize and sanitize email
    const sanitizedPassword = validator.escape(password); // Escape password

    try {
        const token = await User.matchPasswordAndGenerateToken(sanitizedEmail, sanitizedPassword);
        if (!token) {
            return res.render("signIn", { error: "Incorrect Email or Password" });
        }

        const user = await User.findOne({ email: sanitizedEmail });
        res.cookie("email",user.email);
        res.cookie("fullName", user.fullname);
        res.cookie("dp", user.profileImgURL);
        res.cookie("token", token).redirect("/");
    } catch (error) {
        return res.render("signIn", {
            error: "Incorrect Email or Password",
        });
    }
});

router.post("/signUp", upload.single("profileImg"), async (req, res) => {
    const { fullname, email, password } = req.body;

    const sanitizedFullname = validator.escape(fullname);
    const sanitizedEmail = validator.normalizeEmail(email);
    const sanitizedPassword = validator.escape(password);

    let roleU = "USER";
    if (sanitizedEmail === "parikaragarwal@gmail.com") {
        roleU = "ADMIN";
    }

    let dp = "/images/default.png"; // Default DP
    if (req.file) {
        dp = req.file.path; // Cloudinary URL
    }

    await User.create({
        profileImgURL: dp,
        fullname: sanitizedFullname,
        email: sanitizedEmail,
        password: sanitizedPassword,
        role: roleU,
    });

    return res.redirect("/user/signIn");
});
module.exports = router;
