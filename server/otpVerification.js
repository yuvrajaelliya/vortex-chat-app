const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const express = require("express");
const router = express.Router();

// --- MongoDB OTP Schema ---
const otpSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    otp: { type: String, required: true }, // hashed
    expiresAt: { type: Date, required: true },
    resendCount: { type: Number, default: 0 },
    verified: { type: Boolean, default: false }
});
const OTP = mongoose.models.OTP || mongoose.model("OTP", otpSchema);

// --- Nodemailer Transport (Ethereal for dev, Gmail for prod) ---
async function createTransport() {
    if (process.env.NODE_ENV === "production") {
        return nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS
            }
        });
    } else {
        const testAccount = await nodemailer.createTestAccount();
        return nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            auth: testAccount
        });
    }
}

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(email, otp) {
    const transporter = await createTransport();
    const mailOptions = {
        from: '"Neonverse Chat" <no-reply@neonverse.com>',
        to: email,
        subject: "Your One-Time Verification Code",
        html: `
      <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:24px;border-radius:12px;background:#181824;color:#fff;">
        <h2 style="color:#00ffee;">Neonverse Chat</h2>
        <p>Hi,</p>
        <p>Your One-Time Password (OTP) is:</p>
        <div style="font-size:2rem;letter-spacing:8px;font-weight:bold;background:#23232b;padding:12px 0;border-radius:8px;color:#00ffee;text-align:center;">${otp}</div>
        <p>This code is valid for <b>5 minutes</b>.</p>
        <p>If you did not request this, please ignore this email.</p>
        <hr style="border:none;border-top:1px solid #333;margin:16px 0;">
        <small>Need help? Contact support@neonverse.com</small>
      </div>
    `
    };
    const info = await transporter.sendMail(mailOptions);
    return process.env.NODE_ENV === "production" ? null : nodemailer.getTestMessageUrl(info);
}

async function cleanExpiredOTPs() {
    await OTP.deleteMany({ expiresAt: { $lt: new Date() }, verified: false });
}

const resendLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    keyGenerator: req => req.body.email || req.query.email,
    message: "Too many OTP resends, please try again after 1 hour."
});

// --- Request OTP ---
router.post("/request-otp", async(req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });
    await cleanExpiredOTPs();
    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await OTP.findOneAndUpdate({ email }, { otp: hashedOTP, expiresAt, resendCount: 0, verified: false }, { upsert: true });
    const previewUrl = await sendOTPEmail(email, otp);
    res.json({
        message: "OTP sent to email.",
        ...(previewUrl ? { previewUrl } : {})
    });
});

// --- Verify OTP ---
router.post("/verify-otp", async(req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: "Email and OTP required" });
    await cleanExpiredOTPs();
    const record = await OTP.findOne({ email });
    if (!record) return res.status(400).json({ error: "No OTP found for this email." });
    if (record.verified) return res.status(400).json({ error: "Email already verified." });
    if (record.expiresAt < new Date()) return res.status(400).json({ error: "OTP expired." });
    const match = await bcrypt.compare(otp, record.otp);
    if (!match) return res.status(400).json({ error: "Invalid OTP." });
    record.verified = true;
    await record.save();
    res.json({ message: "Email verified successfully." });
});

// --- Resend OTP ---
router.post("/resend-otp", resendLimiter, async(req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });
    await cleanExpiredOTPs();
    const record = await OTP.findOne({ email });
    if (record && record.verified) return res.status(400).json({ error: "Email already verified." });
    let resendCount = (record && record.resendCount) || 0;
    if (resendCount >= 3) return res.status(429).json({ error: "Resend limit reached. Try again later." });
    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await OTP.findOneAndUpdate({ email }, { otp: hashedOTP, expiresAt, $inc: { resendCount: 1 }, verified: false }, { upsert: true });
    const previewUrl = await sendOTPEmail(email, otp);
    res.json({
        message: "OTP resent to email.",
        ...(previewUrl ? { previewUrl } : {})
    });
});

module.exports = {
    otpRouter: router,
    OTPModel: OTP
};