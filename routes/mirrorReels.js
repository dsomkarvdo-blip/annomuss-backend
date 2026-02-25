// import express from "express";
// import multer from "multer";
// import path from "path";
// import { authMiddleware } from "../middleware/auth.js";
// import MirrorReel from "../models/MirrorReel.js";

// const router = express.Router();

// const storage = multer.diskStorage({
//   destination: "uploads/mirror/",
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   }
// });

// const upload = multer({ storage });

// /**
//  * 🎭 CREATE MIRROR REEL
//  */
// router.post(
//   "/",
//   authMiddleware,
//   upload.single("audio"),
//   async (req, res) => {
//     try {
//       const { emotion } = req.body;

//       if (!req.file) {
//         return res.status(400).json({ message: "Audio required" });
//       }

//       // TEMP AI LOGIC (replace later)
//       const fakeTranscript = "I feel tired of pretending everything is okay.";
//       const poeticText = "Smiling feels heavy when the heart is loud.";

//       const reel = await MirrorReel.create({
//         anonymousName: req.user.anonymousName,
//         emotion,
//         transcript: fakeTranscript,
//         poeticText,
//         audioUrl: `/uploads/mirror/${req.file.filename}`
//       });

//       res.status(201).json(reel);
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ message: "Mirror reel failed" });
//     }
//   }
// );

// /**
//  * 🎭 GET ALL MIRROR REELS
//  */
// router.get("/", authMiddleware, async (req, res) => {
//   const reels = await MirrorReel.find().sort({ createdAt: -1 });
//   res.json(reels);
// });

// export default router;



// // NEWWW COMPLETE CHATGPT