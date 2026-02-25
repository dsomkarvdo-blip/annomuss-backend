import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import Message from "../models/Message.js";

const router = express.Router();

router.post("/send", authMiddleware, async (req, res) => {
  try {
    const { to, message, fileUrl, fileName, isImage } = req.body;
    const from = req.user.anonymousName;

    if (!to) return res.status(400).json({ message: "Recipient required ❌" });
    if (!message?.trim() && !fileUrl) return res.status(400).json({ message: "Message or file required ❌" });

    const saved = await Message.create({
      from,
      to,
      message: message?.trim() || "",
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      isImage: isImage || false
    });

    res.status(201).json({ message: "Sent ✅", data: saved });
  } catch {
    res.status(500).json({ message: "Failed to send ❌" });
  }
});
router.get("/chat/:otherUser", authMiddleware, async (req, res) => {
  try {
    const me = req.user.anonymousName;
    const { otherUser } = req.params;
    const messages = await Message.find({
      $or: [{ from: me, to: otherUser }, { from: otherUser, to: me }]
    }).sort({ createdAt: 1 }).limit(50);

    await Message.updateMany({ from: otherUser, to: me, read: false }, { read: true });
    res.json(messages);
  } catch {
    res.status(500).json({ message: "Failed to load chat ❌" });
  }
});

router.get("/inbox", authMiddleware, async (req, res) => {
  try {
    const me = req.user.anonymousName;
    const conversations = await Message.aggregate([
      { $match: { $or: [{ from: me }, { to: me }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: { $cond: [{ $eq: ["$from", me] }, "$to", "$from"] },
          lastMessage: { $first: "$message" },
          lastTime: { $first: "$createdAt" },
          unread: { $sum: { $cond: [{ $and: [{ $eq: ["$to", me] }, { $eq: ["$read", false] }] }, 1, 0] } }
        }
      },
      { $sort: { lastTime: -1 } }
    ]);
    res.json(conversations);
  } catch {
    res.status(500).json({ message: "Failed ❌" });
  }
});

export default router;