import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  anonymousName: { type: String, required: true, unique: true },
  friends: [{ type: String }],

  // ── Streak & Rewards ──────────────────────────────────────────
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastCheckIn: { type: Date, default: null },
  totalCheckIns: { type: Number, default: 0 },
  unlockedRewards: [{ type: String }],
  equippedAccessory: { type: String, default: "none" }

}, { timestamps: true });

export default mongoose.model("User", userSchema);