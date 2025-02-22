const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const multer= require("multer");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const methodOverride = require("method-override");
require("dotenv").config();

const userRoute = require("./routes/user");
const blogRoute = require("./routes/blog");

const User = require("./models/user"); // Added User model
const Blog = require("./models/blog"); // Added Blog model

const { checkForAuthenticationCookie } = require("./middlewares/authentication");

const app = express();
const port = process.env.PORT || 600;

const mongoPort=process.env.MONGO_URL;
// MongoDB connection
mongoose
  .connect(mongoPort)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Set up EJS as the view engine and views directory
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

// Middleware for handling form submissions and cookies



app.use(express.urlencoded({ extended: false }));
app.use(methodOverride("_method"));
app.use(cookieParser());
app.use(checkForAuthenticationCookie("token"));
app.use(express.static(path.resolve("./public"))); // Serve static files from public directory

// Security Middleware
app.use(helmet());

// Content Security Policy (CSP) configuration
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",
      ],
      styleSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",
        "'unsafe-inline'",
      ],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com/", "blob:"], // ✅ Added 'blob:'
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);


// XSS and other sanitization-related headers
app.use(helmet.xssFilter());
app.use(helmet.noSniff());
app.use(helmet.referrerPolicy({ policy: "no-referrer" }));

app.get('/favicon.ico', (req, res) => res.status(204));

// Route for about page
app.get("/about", (req, res) => {
  const fullName = req.cookies.fullName;
  const dp = req.cookies.dp;
  res.render("about", {
    dp,
    user: req.user,
    name: fullName,
  });
});

// Route for donations page
app.get("/donations", (req, res) => {
  const fullName = req.cookies.fullName;
  const dp = req.cookies.dp;
  res.render("donations", {
    dp,
    user: req.user,
    name: fullName,
  });
});

// Route for home page
app.get("/", async (req, res) => {
  try {
    const allBlogs = await Blog.find({});
    const fullName = req.cookies.fullName;
    const dp = req.cookies.dp;
    res.render("home", {
      dp,
      user: req.user,
      name: fullName,
      blogs: allBlogs,
    });
  } catch (err) {
    console.error("Error fetching blogs:", err);
    res.status(500).send("Internal Server Error");
  }
});

// User and Blog routes
app.use("/user", userRoute);
app.use("/blog", blogRoute);

// Start the application on the specified port
app.listen(port, () => console.log(`Your application has started on port ${port}`));
