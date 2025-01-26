const fs = require("fs"); // To delete files
const { Router, response } = require("express");
const multer = require('multer');
const path = require("path");
const methodOverride = require("method-override");
const validator = require("validator"); // For sanitizing inputs
const User = require("../models/user");

const router = Router();

const storage = multer.diskStorage({
   destination: function (req, file, cb) {
     cb(null, path.resolve(`./public/images`));
   },
   filename: function (req, file, cb) {
     const filename = `${Date.now()}-${file.originalname}`;
     cb(null, filename);
   }
});

const upload = multer({ storage: storage });

router.get("/signIn", (req, res) => {
    return res.render("signIn");
});

router.get("/signUp", (req, res) => {
    return res.render("signUp");
});

router.get("/account", async (req, res) => {
    const user = await User.findOne({ profileImgURL: req.cookies.dp });
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

        const user = await User.findOne({ profileImgURL: req.cookies.dp });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const updates = {};
        let { fullname, password } = req.body;

        // Sanitize and validate inputs
        if (fullname) {
            fullname = validator.escape(fullname); // Escape potential harmful characters
            updates.fullname = fullname;
        }
        if (password) {
            password = validator.escape(password); // Escape potential harmful characters
            updates.password = password;
        }

        // Handle profile image update
        if (req.file) {
            const oldProfileImg = user.profileImgURL.split("/").pop(); // Extract old file name
            if (oldProfileImg !== "default.png") {
                const oldImagePath = path.resolve(`./public/images/${oldProfileImg}`);
                fs.unlinkSync(oldImagePath); // Delete the old image
            }
            updates.profileImgURL = `/images/${req.file.filename}`;
        }

        // Update user in the database
        await User.updateOne({ profileImgURL: req.cookies.dp }, updates);

        // Update cookies if necessary
        if (updates.fullname) res.cookie("fullName", updates.fullname);
        if (updates.profileImgURL) res.cookie("dp", updates.profileImgURL);

        return res.status(200).redirect("/");
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/account/delete", async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user = await User.findOne({ profileImgURL: req.cookies.dp });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Delete profile image if it exists and isn't default.png
        const profileImg = user.profileImgURL.split("/").pop();
        if (profileImg !== "default.png") {
            const imagePath = path.resolve(`./public/images/${profileImg}`);
            fs.unlinkSync(imagePath); // Delete the file
        }

        // Delete the user from the database
        await User.deleteOne({ profileImgURL: req.cookies.dp });

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

    // Sanitize and validate inputs
    const sanitizedFullname = validator.escape(fullname);
    const sanitizedEmail = validator.normalizeEmail(email);
    const sanitizedPassword = validator.escape(password);

    var roleU="USER";
    if(sanitizedEmail==="parikaragarwal@gmail.com")
    {
        roleU="ADMIN";
    }
    var  dp="/images/default.png";

    try{
        dp=`/images/${req.user.filename}`;
    }
    catch(error)
    {
       console.log("Applying default image");
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
