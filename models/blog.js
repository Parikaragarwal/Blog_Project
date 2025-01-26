const { Schema, model } = require("mongoose");

const blogSchema = new Schema(
  {
    title:
    {
      type: String,
      required: true
    },
    body:
    {
      type: String,
      required: true
    },
    coverImgUrl: 
    { 
      type: String 
    },
    createdBy:
    {
       type: Schema.Types.ObjectId, ref: "user" 
    },
    likes:
    [{ 
      type: Schema.Types.ObjectId, ref: "user"
     }], // Users who liked the blog
    dislikes: 
   [{ 
      type: Schema.Types.ObjectId, ref: "user" 
    }], // Users who disliked the blog
  },
  { timestamps: true }
);


const Blog = model("blog", blogSchema);

module.exports = Blog;
