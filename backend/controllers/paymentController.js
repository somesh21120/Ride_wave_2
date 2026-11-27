const Razorpay = require("razorpay");
const crypto = require("crypto");

// Lazy init — read keys fresh each time so dotenv is always loaded first
let _razorpay = null;
const getRazorpay = () => {
  if (_razorpay) return _razorpay;
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set in .env");
  }
  _razorpay = new Razorpay({ key_id, key_secret });
  return _razorpay;
};

// Create a Razorpay order for the given amount (in rupees → paise)
const createOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }
    const rzp = getRazorpay();
    const amountPaise = Math.round(amount * 100);
    const options = {
      amount: amountPaise,
      currency: "INR",
      receipt: "rcpt_" + Date.now(),
    };
    const order = await rzp.orders.create(options);
    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    // Log the full Razorpay error for debugging
    const rzpError = error.error || {};
    console.error("=== RAZORPAY ORDER ERROR ===");
    console.error("message:", error.message);
    console.error("statusCode:", error.statusCode || rzpError.statusCode);
    console.error("code:", rzpError.code);
    console.error("description:", rzpError.description);
    console.error("field:", rzpError.field);
    console.error("full:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error("==============================");

    if (error.statusCode === 400) {
      return res.status(400).json({ message: `Payment gateway error: ${rzpError.description || error.message}` });
    }
    if (error.message && error.message.includes("RAZORPAY_KEY")) {
      return res.status(500).json({ message: "Payment gateway not configured — contact support" });
    }
    res.status(500).json({ message: `Could not create payment order: ${error.message}` });
  }
};

// Verify Razorpay payment signature
const verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      return res.status(500).json({ message: "Payment gateway not configured" });
    }
    const expected = crypto
      .createHmac("sha256", key_secret)
      .update(orderId + "|" + paymentId)
      .digest("hex");
    if (expected === signature) {
      res.json({ verified: true, paymentId });
    } else {
      res.status(400).json({ message: "Payment verification failed — signature mismatch" });
    }
  } catch (error) {
    console.error("Payment verify error:", error.message);
    res.status(500).json({ message: "Payment verification error" });
  }
};

module.exports = { createOrder, verifyPayment };