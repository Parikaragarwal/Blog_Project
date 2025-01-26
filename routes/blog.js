const { Router } = require("express");
const multer = require('multer');
const path = require("path");
const validator = require('validator');
const xss = require('xss'); // To sanitize input and prevent XSS attacks
const { body, validationResult } = require('express-validator');
const router = Router();

const Blog = require("../models/blog");
const Comment = require("../models/comment");

const storage = multer.diskStorage({
   destination: function (req, file, cb) {
     cb(null, path.resolve(`./public/uploads`));
   },
   filename: function (req, file, cb) {
     const filename = `${Date.now()}-${file.originalname}`;
     cb(null, filename);
   }
});

const upload = multer({ 
   storage: storage,
   fileFilter: (req, file, cb) => {
      const filetypes = /jpeg|jpg|png|gif/;
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = filetypes.test(file.mimetype);
      if (mimetype && extname) {
         return cb(null, true);
      }
      cb("Error: Only image files are allowed!");
   },
   limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

router.get("/add-new", (req, res) => {
    const dp = req.cookies.dp;
    return res.render("addBlog", {
        dp,
        user: req.user,
    });
});

router.post("/:id/like", async (req, res) => {
   try {
       const blogId = req.params.id;
       const userId = req.user._id;  // From token in cookies

       // Fetch the blog by ID
       const blog = await Blog.findById(blogId);
       if (!blog) {
           return res.status(404).json({ error: "Blog not found" });
       }

       // Check if the user already liked the blog
       if (blog.likes.includes(userId)) {
           // User already liked, so toggle off the like
           blog.likes.pull(userId);
       } else {
           // Add the user to the likes list
           blog.likes.addToSet(userId);

           // Remove user from dislikes if present
           if (blog.dislikes.includes(userId)) {
               blog.dislikes.pull(userId);
           }
       }

       // Save the blog
       await blog.save();
     return res.status(200).json({
           message: "Like status updated.",
           likes: blog.likes.length,  // return the updated count
           dislikes: blog.dislikes.length,
       });

   } catch (error) {
       console.error(error);
       return res.status(500).json({ error: "Internal server error" });
   }
});

router.post("/:id/delete", async (req, res) => {
   try {
       const blogId = req.params.id;

       // Find the blog by ID
       const blog = await Blog.findById(blogId);
       if (!blog) {
           return res.status(404).json({ error: "Blog not found" });
       }

       // Check if the user is authorized to delete the blog
       if (!req.user.role==="ADMIN") 
       {
           return res.status(403).json({ error: "Unauthorized to delete this blog" });
       }

       // Delete the blog
       await Blog.findByIdAndDelete(blogId);

       // Delete all associated comments
       await Comment.deleteMany({ blogId });

       return res.status(200).redirect("/");
   } catch (error)
   {
       console.error(error);
       return res.status(500).json({ error: "Internal server error" });
   }
});



router.post("/:id/dislike", async (req, res) => {
   try {
       const blogId = req.params.id;
       const userId = req.user._id;  // From token in cookies

       // Fetch the blog by ID
       const blog = await Blog.findById(blogId);
       if (!blog) {
           return res.status(404).json({ error: "Blog not found" });
       }

       // Check if the user already disliked the blog
       if (blog.dislikes.includes(userId)) {
           // User already disliked, so toggle off the dislike
           blog.dislikes.pull(userId);
       } else {
           // Add the user to the dislikes list
           blog.dislikes.addToSet(userId);

           // Remove user from likes if present
           if (blog.likes.includes(userId)) {
               blog.likes.pull(userId);
           }
       }

       // Save the blog
       await blog.save();

       return res.status(200).json({
           message: "Dislike status updated.",
           likes: blog.likes.length,  // return the updated count
           dislikes: blog.dislikes.length,
       });
   } catch (error) {
       console.error(error);
       return res.status(500).json({ error: "Internal server error" });
   }
});


router.get("/:id", async (req, res) => {
   try {
       const blog = await Blog.findById(req.params.id).populate("createdBy");
       const comments = await Comment.find({ blogId: req.params.id }).populate("createdBy");
       const dp = req.cookies.dp;
       return res.render("blog", {
           dp,
           user: req.user,
           blog,
           comments,
       });
   } catch (error) {
       console.error(error);
       return res.status(500).json({ error: "Internal server error" });
   }
});
// Post a new blog
router.post("/", upload.single("coverImg"), 
   body('title').trim().isLength({ min: 3 }).withMessage('Title should be at least 3 characters long').escape(),
   body('body').trim().isLength({ min: 10 }).withMessage('Body should be at least 10 characters long').escape(),
   async (req, res) => {

      // Handle validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         return res.status(400).json({ errors: errors.array() });
      }

      const { title, body } = req.body;

      // Sanitize the inputs to prevent XSS
      const sanitizedTitle = xss(title);
      const sanitizedBody = xss(body);

      try {
         const blog = await Blog.create({
            title: sanitizedTitle,
            body: sanitizedBody,
            coverImgUrl: req.file ? `/uploads/${req.file.filename}` : "/uploads/default.png",
            createdBy: req.user._id,
         });

         return res.redirect(`/blog/${blog._id}`);
      } catch (error) {
         console.error(error);
         return res.status(500).json({ error: "Internal server error" });
      }
   }
);

// Post a new comment
router.post("/comment/:blogId", 
   body('content').trim().isLength({ min: 1 }).withMessage('Comment content is required').escape(),
   async (req, res) => {

      // Handle validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         return res.status(400).json({ errors: errors.array() });
      }

      // Sanitize content to prevent XSS
      const sanitizedContent = xss(req.body.content);

      try {
         await Comment.create({
            content: sanitizedContent,
            blogId: req.params.blogId,
            createdBy: req.user._id,
         });

         return res.redirect(`/blog/${req.params.blogId}`);
      } catch (error) {
         console.error(error);
         return res.status(500).json({ error: "Internal server error" });
      }
   }
);

router.post("/:blogId/comments/:commentId/like", async (req, res) => {
   try {
     const { blogId, commentId } = req.params;  // Extract the blogId and commentId from the URL
     const userId = req.user._id;  // Extract the user ID from the authenticated user (via token)
 
     // Fetch the comment by ID
     const comment = await Comment.findById(commentId);
     if (!comment) {
       return res.status(404).json({ error: "Comment not found" });
     }
 
     // Toggle like on the comment
     if (comment.likes.includes(userId)) {
       comment.likes.pull(userId);  // If already liked, remove the like
     } else {
       comment.likes.addToSet(userId);  // Add user to likes
     }
 
     // Save the updated comment
     await comment.save();
 
     return res.status(200).json({
       message: "Comment like status updated.",
       likes: comment.likes.length,  // Return the updated like count
     });
   } catch (error) {
     console.error(error);
     return res.status(500).json({ error: "Internal server error" });
   }
 });
 
 router.post("/:blogId/comments/:commentId/delete", async (req, res) => {
   try {
       const { blogId, commentId } = req.params;

       // Find the comment by ID
       const comment = await Comment.findById(commentId);
       if (!comment) {
           return res.status(404).json({ error: "Comment not found" });
       }

       // Check if the comment belongs to the blog and the user is authorized to delete it
       if  (!(req.user.role==="ADMIN"))
       {
         console.log("Deletion UnAuthorized");
          return res.status(403).json({ error: "Unauthorized to delete this comment" });
       }

       // Delete the comment
       await Comment.findByIdAndDelete(commentId);

       return res.status(200).json({ message: "Comment deleted successfully" });
   } catch (error) {
       console.error(error);
       return res.status(500).json({ error: "Internal server error" });
   }
});

module.exports = router;
