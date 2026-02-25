import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import Mood from "../models/Mood.js";
import User from "../models/User.js";

const router = express.Router();

// ── All rewards definition ────────────────────────────────────────
const REWARDS = [
  { id: "badge_3",    days: 3,   label: "3 Day Starter",   emoji: "🌱", type: "badge" },
  { id: "glasses",    days: 5,   label: "Cool Glasses",    emoji: "😎", type: "accessory" },
  { id: "badge_7",    days: 7,   label: "Week Warrior",    emoji: "⚡", type: "badge" },
  { id: "crown",      days: 7,   label: "Crown",           emoji: "👑", type: "accessory" },
  { id: "hat",        days: 10,  label: "Top Hat",         emoji: "🎩", type: "accessory" },
  { id: "badge_14",   days: 14,  label: "2 Week Champion", emoji: "🏆", type: "badge" },
  { id: "halo",       days: 14,  label: "Halo",            emoji: "😇", type: "accessory" },
  { id: "badge_21",   days: 21,  label: "21 Day Legend",   emoji: "🔥", type: "badge" },
  { id: "sunglasses", days: 21,  label: "Sunglasses",      emoji: "🕶️", type: "accessory" },
  { id: "wings",      days: 30,  label: "Wings",           emoji: "🪽", type: "accessory" },
  { id: "badge_30",   days: 30,  label: "Monthly Master",  emoji: "💎", type: "badge" },
  { id: "rainbow",    days: 60,  label: "Rainbow Aura",    emoji: "🌈", type: "accessory" },
  { id: "badge_100",  days: 100, label: "Century Club",    emoji: "🌟", type: "badge" },
];

// POST /api/moods — Log mood + update streak
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { emotion, text } = req.body;
    const validEmotions = ["happy","sad","lonely","anxious","angry","neutral","excited","grateful","overwhelmed","hopeful"];

    if (!emotion || !validEmotions.includes(emotion)) {
      return res.status(400).json({ message: "Valid emotion required ❌" });
    }

    // Save mood
    const mood = await Mood.create({
      anonymousName: req.user.anonymousName,
      emotion,
      text: text?.trim() || ""
    });

    // ── Update streak ─────────────────────────────────────────
    const user = await User.findById(req.user.id);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let streakUpdated = false;
    let newRewards = [];

    if (user.lastCheckIn) {
      const last = new Date(user.lastCheckIn);
      const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
      const diffDays = Math.floor((today - lastDay) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Already checked in today — no streak update
      } else if (diffDays === 1) {
        // Consecutive day — increase streak
        user.currentStreak += 1;
        user.totalCheckIns += 1;
        user.lastCheckIn = now;
        streakUpdated = true;
      } else {
        // Missed days — reset streak
        user.currentStreak = 1;
        user.totalCheckIns += 1;
        user.lastCheckIn = now;
        streakUpdated = true;
      }
    } else {
      // First ever check-in
      user.currentStreak = 1;
      user.totalCheckIns = 1;
      user.lastCheckIn = now;
      streakUpdated = true;
    }

    // Update longest streak
    if (user.currentStreak > user.longestStreak) {
      user.longestStreak = user.currentStreak;
    }

    // ── Check for new rewards ─────────────────────────────────
    if (streakUpdated) {
      for (const reward of REWARDS) {
        if (
          user.currentStreak >= reward.days &&
          !user.unlockedRewards.includes(reward.id)
        ) {
          user.unlockedRewards.push(reward.id);
          newRewards.push(reward);
        }
      }
    }

    await user.save();

    res.status(201).json({
      message: `Feeling logged ✅`,
      mood,
      streak: {
        current: user.currentStreak,
        longest: user.longestStreak,
        total: user.totalCheckIns,
        updated: streakUpdated
      },
      newRewards
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to log mood ❌" });
  }
});

// GET /api/moods/my
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const moods = await Mood.find({ anonymousName: req.user.anonymousName })
      .sort({ createdAt: -1 }).limit(50);
    res.json(moods);
  } catch {
    res.status(500).json({ message: "Failed ❌" });
  }
});

// GET /api/moods/community
router.get("/community", authMiddleware, async (req, res) => {
  try {
    const moods = await Mood.find()
      .sort({ createdAt: -1 }).limit(30)
      .select("-anonymousName");
    res.json(moods);
  } catch {
    res.status(500).json({ message: "Failed ❌" });
  }
});

// GET /api/moods/stats
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const stats = await Mood.aggregate([
      { $match: { anonymousName: req.user.anonymousName } },
      { $group: { _id: "$emotion", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json(stats);
  } catch {
    res.status(500).json({ message: "Failed ❌" });
  }
});

// GET /api/moods/streak — get current user streak + rewards
router.get("/streak", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      totalCheckIns: user.totalCheckIns,
      lastCheckIn: user.lastCheckIn,
      unlockedRewards: user.unlockedRewards,
      equippedAccessory: user.equippedAccessory,
      rewards: REWARDS
    });
  } catch {
    res.status(500).json({ message: "Failed ❌" });
  }
});

// POST /api/moods/equip — equip an accessory
router.post("/equip", authMiddleware, async (req, res) => {
  try {
    const { accessoryId } = req.body;
    const user = await User.findById(req.user.id);

    if (accessoryId !== "none" && !user.unlockedRewards.includes(accessoryId)) {
      return res.status(403).json({ message: "Not unlocked yet ❌" });
    }

    user.equippedAccessory = accessoryId;
    await user.save();
    res.json({ message: "Equipped ✅", equipped: accessoryId });
  } catch {
    res.status(500).json({ message: "Failed ❌" });
  }
});

export default router;