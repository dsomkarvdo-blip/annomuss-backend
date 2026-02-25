import express from "express";
import jwt from "jsonwebtoken";
import Otp from "../models/Otp.js";
import User from "../models/User.js";

const router = express.Router();

router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/^\S+@\S+\.\S+$/.test(email))
      return res.status(400).json({ message: "Valid email required ❌" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.deleteMany({ email });
    await Otp.create({ email, otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000) });

    // ✅ TEMP: Print OTP in terminal instead of email
    console.log("====================================");
    console.log(`📨 OTP for ${email} : ${otp}`);
    console.log("====================================");

    res.json({ message: "OTP sent ✅ (check your terminal)" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Failed ❌" });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp, anonymousName } = req.body;
    if (!email || !otp || !anonymousName)
      return res.status(400).json({ message: "All fields required ❌" });

    const record = await Otp.findOne({ email });
    if (!record) return res.status(400).json({ message: "No OTP found. Request a new one ❌" });
    if (record.attempts >= 5) {
      await Otp.deleteMany({ email });
      return res.status(400).json({ message: "Too many attempts ❌" });
    }
    if (record.expiresAt < new Date()) {
      await Otp.deleteMany({ email });
      return res.status(400).json({ message: "OTP expired ❌" });
    }
    if (record.otp !== otp) {
      await Otp.findByIdAndUpdate(record._id, { $inc: { attempts: 1 } });
      return res.status(400).json({ message: `Wrong OTP ❌ (${5 - record.attempts - 1} left)` });
    }

    await Otp.deleteMany({ email });

    const nameExists = await User.findOne({ anonymousName });
    if (nameExists) return res.status(409).json({ message: "Name already taken 😅 Try another!" });

    let user = await User.findOne({ email });
    if (user) {
      const token = jwt.sign({ id: user._id, anonymousName: user.anonymousName }, process.env.JWT_SECRET, { expiresIn: "7d" });
      return res.json({ message: "Welcome back! 🎉", user: { id: user._id, anonymousName: user.anonymousName, email: user.email }, token });
    }

    user = await User.create({ email, anonymousName });
    const token = jwt.sign({ id: user._id, anonymousName: user.anonymousName }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      message: `Welcome, ${anonymousName}! 🎭`,
      user: { id: user._id, anonymousName: user.anonymousName, email: user.email },
      token
    });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "Already registered ❌" });
    res.status(500).json({ message: "Verification failed ❌" });
  }
});

export default router;