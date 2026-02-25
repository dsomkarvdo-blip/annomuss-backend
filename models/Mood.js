import mongoose from "mongoose";

const moodSchema = new mongoose.Schema({
  anonymousName: { type: String, required: true },
  emotion: {
    type: String,
    required: true,
    enum: ["happy","sad","lonely","anxious","angry","neutral","excited","grateful","overwhelmed","hopeful"]
  },
  text: { type: String, maxlength: 500, default: "" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Mood", moodSchema);