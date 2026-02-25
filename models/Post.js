import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  anonymousName: { type: String, required: true },
  type: { type: String, enum: ["post", "story"], required: true },
  emotion: { type: String, required: true },
  caption: { type: String, default: "" },
  mediaUrl: { type: String, default: null },
  mediaType: { type: String, enum: ["image", "video", null], default: null },
  likes: [{ type: String }],
  views: [{ type: String }],
  expiresAt: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model("Post", postSchema);
