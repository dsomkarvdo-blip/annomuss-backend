import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  message: { type: String, default: "", maxlength: 1000 },
  fileUrl: { type: String, default: null },
  fileName: { type: String, default: null },
  isImage: { type: Boolean, default: false },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

messageSchema.index({ from: 1, to: 1 });
messageSchema.index({ createdAt: -1 });

export default mongoose.model("Message", messageSchema);