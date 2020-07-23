const express = require("express");
const router = express();
const auth = require("../../middleware/auth");
const User = require("../../models/user.model");
const Post = require("../../models/post.model");
const { check, validationResult } = require("express-validator");
const { text } = require("express");

//CREATE NEW POST
//POST ROUTE
router.post("/", auth, async (req, res) => {
  const { text, media } = req.body;
  try {
    const user = await User.findById(req.user.id).select("-password");
    const post = new Post({
      text,
      media,
      postedBy: user,
    });
    await post.save();
    res.json(post);
  } catch (err) {
    console.error(err);
    return res.status(500).send("server error");
  }
});
//GET ALL POSTS BY USERID
//GET ROUTE
router.get("/:id", auth, async (req, res) => {
  const userId = req.params.id;
  try {
    const posts = await Post.find({ postedBy: userId })
      .populate("comments", "text created")
      .populate("comments.postedBy", "id name")
      .populate("postedBy", "id name")
      .sort("-created");
    res.json(posts);
  } catch (err) {
    console.error(err);
    return res.status(500).send("server error");
  }
});
//GET POST BY ID
//GET ROUTE
router.get("/post/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("postedBy", "id name")
      .populate("comments", "text created");
    if (!post) {
      return res.status(404).json("Post by that id not found");
    }
    res.json(post);
  } catch (err) {
    console.error(err);
    return res.status(500).send("server error");
  }
});
//GET ALL POSTS OF LOGGED IN USER
//GET ROUTE
router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find({ postedBy: req.user.id })
      .populate("comments", "text created")
      .populate("comments.postedBy", "id name")
      .populate("postedBy", "id name")
      .sort("-created");
    res.json(posts);
  } catch (err) {
    console.error(err);
    return res.status(500).send("server error");
  }
});
//DELETE POST
//DELETE ROUTE
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/) || !post) {
      return res.status(404).send("Post not Found");
    }
    if (post.postedBy.toString() !== req.user.id) {
      return res.status(401).json({
        msg: "User not authorized",
      });
    }
    await post.remove();
    res.json("Post deleted");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("server error");
  }
});
//LIKE POST
//PUT ROUTE
router.put("/like/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    //check if user has liked a post
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ msg: "Post can only be liked once" });
    }
    post.likes.unshift({ user: req.user.id });
    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err);
    return res.status(500).send("server error");
  }
});
//UNLIKE POST
//PUT ROUTE
router.put("/like/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    //check if user has liked a post
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ msg: "Post not yet liked" });
    }
    //get remove index
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);
    post.likes.splice(removeIndex, 1);

    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err);
    return res.status(500).send("server error");
  }
});
//COMMENT ON A POST
//POST ROUTE
router.post("/comment/:id", auth, async (req, res) => {
  const id = req.params.id;
  const posterId = req.user.id;
  try {
    const user = await User.findById(posterId).select("-password");
    const post = await Post.findById(id);
    const comment = {
      text: req.body.text,
      postedBy: user.name,
      userId: posterId,
      avatar: user.avatar,
    };
    post.comments.unshift(comment);
    await post.save();
    res.json(post.comments);
  } catch (err) {
    console.error(err);
    return res.status(500).send("server error");
  }
});
//DELETE COMMENT
//DELETE ROUTE
router.delete("/post/:pid/comment/:cid", auth, async (req, res) => {
  const postId = req.params.pid;
  const commentId = req.params.cid;
  try {
    const post = await Post.findById(postId);
    const comment = post.comments.find((comment) => comment.id === commentId);
    //comment exists
    if (!comment) {
      return res.status(404).json({ msg: "Comment not Found" });
    }
    const removeIndex = post.comments
      .map((comment) => comment.userId.toString())
      .indexOf(req.user.id);
    post.comments.splice(removeIndex, 1);

    await post.save();
    res.json(post.comments);
  } catch (err) {
    console.error(err);
    return res.status(500).send("server error");
  }
});
module.exports = router;
