const express = require("express");
const router = express();
const auth = require("../../middleware/auth");
const User = require("../../models/user.model");
const Post = require("../../models/post.model");

//GET LOGGED IN USER
//GET ROUTE
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("following", "id name")
      .populate("followers", "id name");
    if (!user) {
      return res.status(500).send("server error");
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).send("server error");
  }
});
//ADD PROFILE PHOTO
//POST ROUTE
router.post("/profile-pic", auth, async (req, res) => {
  const { avatar } = req.body;
  const userId = req.user.id;
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { avatar },
      { new: true }
    );
    await user.save();
    res.json(user.avatar);
  } catch (err) {
    console.error(err);
    return res.status(500).send("server error");
  }
});
//GET PROFILE PHOTO
//GET ROUTE
router.get("/profile-pic", auth, async (req, res) => {
  const userId = req.user.id;
  try {
    const user = await User.findById(userId);
    res.json(user.avatar);
  } catch (err) {
    console.error(err);
    return res.status(500).send("server error");
  }
});
//GET USER BY ID
//GET ROUTE
router.get("/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("following", "id name")
      .populate("followers", "id name");
    if (!user) {
      return res.status(404).json({ msg: "User not Found" });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).send("server error");
  }
});

//GET ALL USERS
//GET ROUTE
router.get("/", auth, async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("following", "id name")
      .populate("followers", "id name");
    if (!users) {
      return res.status(404).json({ msg: "No Users Found" });
    }
    res.json(users);
  } catch (err) {
    console.error(err);
    return res.status(500).send("server error");
  }
});
//UPDATE USER PROFILE
//PUT ROUTE
router.put("/me", auth, async (req, res) => {
  const userId = req.user.id;
  const { name, avatar, bio } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { name, avatar, bio },
      { new: true }
    );
    if (user.id !== userId) {
      return res.status(401).json({ msg: "User not Authorized" });
    }
    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).send("server error");
  }
});
//FOLLOW USER AND ADD FOLLOWING
//PUT ROUTE
router.put("/follow", auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user.id,
      { $push: { following: req.body.followId } },
      { new: true }
    );
    const result = await User.findByIdAndUpdate(
      req.body.followId,
      { $push: { followers: req.user.id } },
      { new: true }
    )
      .populate("following", "id, name")
      .populate("followers", "id, name")
      .select("-password");
    res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).send("server error");
  }
});
//UNFOLLOW USER
//PUT ROUTE
router.put("/unfollow", auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { following: req.body.followId } },
      { new: true }
    );
    const result = await User.findByIdAndUpdate(
      req.body.followId,
      { $pull: { followers: req.user.id } },
      { new: true }
    )
      .populate("following", "id, name")
      .populate("followers", "id, name")
      .select("-password");
    res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).send("server error");
  }
});

//DELETE USER
//DELETE ROUTE
router.delete("/", auth, async (req, res) => {
  try {
    await User.findOneAndRemove({ _id: req.user.id });
    await Post.findByIdAndDelete({ postedBy: req.user.id });
    res.json("User Deleted");
  } catch (err) {
    console.error(err);
    return res.status(500).send("server error");
  }
});

module.exports = router;
