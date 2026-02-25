import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

router.get("/me", authMiddleware, (req, res) => {
  const { _id, anonymousName, email, friends, createdAt } = req.user;
  res.json({ id: _id, anonymousName, email, friends, createdAt });
});

router.get("/search", authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.status(400).json({ message: "Query too short ❌" });
    const users = await User.find({ anonymousName: { $regex: q, $options: "i" }, _id: { $ne: req.user._id } })
      .select("anonymousName createdAt").limit(10);
    res.json(users);
  } catch {
    res.status(500).json({ message: "Search failed ❌" });
  }
});

router.post("/friends/add", authMiddleware, async (req, res) => {
  try {
    const { anonymousName } = req.body;
    const friend = await User.findOne({ anonymousName });
    if (!friend) return res.status(404).json({ message: "User not found ❌" });
    if (friend._id.equals(req.user._id)) return res.status(400).json({ message: "Can't add yourself 😅" });
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { friends: friend._id } });
    res.json({ message: `${anonymousName} added ✅` });
  } catch {
    res.status(500).json({ message: "Failed ❌" });
  }
});

router.get("/friends", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("friends", "anonymousName createdAt");
    res.json(user.friends);
  } catch {
    res.status(500).json({ message: "Failed ❌" });
  }
});

export default router;