// =============================================
// FILE: backend/models/Reel.js
// =============================================

import mongoose from "mongoose";

const reelSchema = new mongoose.Schema({
  anonymousName: { type: String, required: true },
  type: {
    type: String,
    enum: ["avatar", "voice", "text_to_reel"],
    default: "avatar"
  },
  emotion: {
    type: String,
    required: true,
    enum: ["happy","sad","lonely","anxious","angry","neutral","excited","grateful","overwhelmed","hopeful","heartbroken","funny","calm"]
  },
  caption:      { type: String, maxlength: 300, default: "" },
  poeticCaption:{ type: String, default: "" },
  mediaUrl:     { type: String, default: null },
  mediaType:    { type: String, enum: ["video","audio",null], default: null },
  avatarStyle:  { type: String, default: "adventurer" },
  voiceStyle:   { type: String, enum: ["original","calm","robot","whisper","deep","anime"], default: "original" },
  bgTheme:      { type: String, default: "none" },
  duration:     { type: Number, default: 0 },
  reactions: {
    felt_this:        [{ type: String }],
    not_alone:        [{ type: String }],
    same_here:        [{ type: String }],
    sending_strength: [{ type: String }],
    tell_more:        [{ type: String }]
  },
  views:   [{ type: String }],
  duetOf:  { type: mongoose.Schema.Types.ObjectId, ref: "Reel", default: null },
  isDuet:  { type: Boolean, default: false }
}, { timestamps: true });

reelSchema.index({ createdAt: -1 });
reelSchema.index({ anonymousName: 1 });

export default mongoose.model("Reel", reelSchema);