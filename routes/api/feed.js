const express = require("express");
const router = express();
const auth = require("../../middleware/auth");
const Post = require("../../models/post.model");
const User = require("../../models/user.model");

router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let following = user.following;
    const posts = await Post.find({ postedBy: { $in: following } })
      .populate("comments", "id name")
      .populate("comments.postedBy", "id name")
      .populate("postedBy", "id name")
      .sort("-created");
    res.json(posts);
  } catch (err) {
    console.error(err);
    return res.status(500).send("server error");
  }
});

module.exports = router;
