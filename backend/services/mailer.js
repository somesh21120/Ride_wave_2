const nodemailer = require("nodemailer");
const config = require("../config");

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  if (!config.smtpUser || !config.smtpPass) return null;
  transporter = nodemailer.createTransport({
    host: config.smtpHost || "smtp.gmail.com",
    port: Number(config.smtpPort) || 587,
    secure: false,
    auth: { user: config.smtpUser, pass: config.smtpPass },
  });
  return transporter;
};

const sendOtpEmail = async (email, code) => {
  const t = getTransporter();
  if (!t) {
    console.log(`[OTP] ${email} -> ${code} (SMTP not configured, use this code)`);
    return true;
  }
  try {
    await t.sendMail({
      from: `"RideWave" <${config.smtpUser}>`,
      to: email,
      subject: "Your RideWave verification code",
      text: `Your RideWave verification code is: ${code}\n\nThis code expires in 5 minutes.\n\nIf you did not request this, you can safely ignore this email.`,
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#0F766E">RideWave</h2>
        <p style="font-size:16px;color:#333">Your verification code is:</p>
        <div style="font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;padding:16px;background:#F0FDFA;border-radius:8px;color:#0F766E;margin:16px 0">${code}</div>
        <p style="font-size:14px;color:#666">This code expires in 5 minutes.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
        <p style="font-size:12px;color:#999">If you did not request this, you can safely ignore this email.</p>
      </div>`,
    });
    console.log(`[OTP] Email sent to ${email}`);
    return true;
  } catch (err) {
    console.error(`[OTP] Failed to send email to ${email}: ${err.message}`);
    console.log(`[OTP] ${email} -> ${code} (email failed, use this code)`);
    return true; // Still return the code via response even if email fails
  }
};

module.exports = { sendOtpEmail };