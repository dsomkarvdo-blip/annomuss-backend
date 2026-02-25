import { exec } from "child_process";
import { generatePoeticText } from "../services/aiText.service.js";
import { textToSpeech } from "../services/tts.service.js";

export const createMirrorReel = async (req, res) => {
  try {
    const { emotion } = req.body;
    const audioPath = req.file.path;

    // 1. Generate poetic caption
    const caption = await generatePoeticText(emotion);

    // 2. Convert caption → AI voice
    const voicePath = `uploads/audio/voice-${Date.now()}.mp3`;
    await textToSpeech(caption, voicePath);

    // 3. Merge avatar video + voice
    const avatarVideo = `assets/avatars/${emotion}.mp4`; // pre-made loop
    const outputVideo = `uploads/reels/reel-${Date.now()}.mp4`;

    exec(
      `ffmpeg -stream_loop -1 -i ${avatarVideo} -i ${voicePath} -shortest -c:v copy -c:a aac ${outputVideo}`,
      (err) => {
        if (err) return res.status(500).json({ error: "Video failed" });

        res.json({
          message: "Mirror Reel created 🎭",
          caption,
          videoUrl: `http://localhost:3000/${outputVideo}`
        });
      }
    );

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Mirror Reel failed" });
  }
};