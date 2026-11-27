const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { sendOtpEmail } = require("../services/mailer");
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// In-memory OTP store (email -> { code, expiresAt }). Development/demo only.
// No paid email/SMS service required; the OTP is returned in the response and logged.
const otpStore = new Map();

const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
    const code = String(Math.floor(100000 + Math.random() * 900000));
    otpStore.set(email, { code, expiresAt: Date.now() + 5 * 60 * 1000 });
    await sendOtpEmail(email, code);
    res.json({ message: "OTP sent", otp: code });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, role, otp, vehicleType, vehicleModel, vehicleNumber, carSubtype, seatingCapacity, idProof } = req.body;

    // Block admin registration from the public signup endpoint
    if (role === "admin") return res.status(403).json({ message: "Admin accounts cannot be created through public signup." });

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    // OTP verification (email). Phone OTP skipped: would require a paid SMS provider.
    const entry = otpStore.get(email);
    if (!entry) return res.status(400).json({ message: "Please request an OTP for your email first" });
    if (Date.now() > entry.expiresAt) { otpStore.delete(email); return res.status(400).json({ message: "OTP expired, request a new one" }); }
    if (entry.code !== String(otp)) return res.status(400).json({ message: "Invalid OTP" });
    otpStore.delete(email);

    const safeRole = role === "driver" ? "driver" : "passenger";
    const userData = { name, email, password, phone, role: safeRole, isVerified: true };
    if (safeRole === "driver") {
      userData.vehicle = {
        type: vehicleType || "",
        model: vehicleModel || "",
        number: vehicleNumber || "",
        carSubtype: carSubtype || "",
        seatingCapacity: Number(seatingCapacity) || (vehicleType === "auto" ? 4 : vehicleType === "car" ? 5 : 2),
      };
      userData.idProof = idProof || "";
    }
    const user = await User.create(userData);
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, vehicle: user.vehicle, isVerified: user.isVerified, createdAt: user.createdAt, token: generateToken(user._id) });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "No account found with this email" });
    if (!(await user.matchPassword(password))) return res.status(401).json({ message: "Incorrect password" });
    if (user.isActive === false) return res.status(403).json({ message: "Your account has been deactivated. Contact support." });
    // Block admin login from the public login endpoint
    if (user.role === "admin") return res.status(403).json({ message: "Admins must sign in at /admin/login." });
    res.json({ _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, vehicle: user.vehicle, createdAt: user.createdAt, token: generateToken(user._id) });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (req.body.name) user.name = req.body.name;
    if (req.body.phone) user.phone = req.body.phone;
    // Vehicle fields (driver only)
    if (req.body.vehicleType) user.vehicle.type = req.body.vehicleType;
    if (req.body.vehicleModel) user.vehicle.model = req.body.vehicleModel;
    if (req.body.vehicleNumber) user.vehicle.number = req.body.vehicleNumber;
    if (req.body.carSubtype) user.vehicle.carSubtype = req.body.carSubtype;
    if (typeof req.body.seatingCapacity === "number") user.vehicle.seatingCapacity = req.body.seatingCapacity;
    const updated = await user.save();
    res.json({ _id: updated._id, name: updated.name, email: updated.email, phone: updated.phone, role: updated.role, vehicle: updated.vehicle, createdAt: updated.createdAt });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
// ── Saved Places ──
const getSavedPlaces = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("savedPlaces");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.savedPlaces);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const addSavedPlace = async (req, res) => {
  try {
    const { label, address, lat, lng } = req.body;
    if (!label || !address || lat == null || lng == null)
      return res.status(400).json({ message: "label, address, lat, and lng are required" });
    if (label.length < 1 || label.length > 30)
      return res.status(400).json({ message: "Label must be 1–30 characters" });
    if (lat < -90 || lat > 90) return res.status(400).json({ message: "Invalid latitude" });
    if (lng < -180 || lng > 180) return res.status(400).json({ message: "Invalid longitude" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.savedPlaces.length >= 5)
      return res.status(400).json({ message: "You can save up to 5 places only" });

    user.savedPlaces.push({ label, address, lat, lng });
    await user.save();
    res.status(201).json(user.savedPlaces);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateSavedPlace = async (req, res) => {
  try {
    const index = parseInt(req.params.index, 10);
    const { label, address, lat, lng } = req.body;
    if (label && (label.length < 1 || label.length > 30))
      return res.status(400).json({ message: "Label must be 1–30 characters" });
    if (lat != null && (lat < -90 || lat > 90)) return res.status(400).json({ message: "Invalid latitude" });
    if (lng != null && (lng < -180 || lng > 180)) return res.status(400).json({ message: "Invalid longitude" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (index < 0 || index >= user.savedPlaces.length)
      return res.status(404).json({ message: "Place not found" });

    const place = user.savedPlaces[index];
    if (label) place.label = label;
    if (address) place.address = address;
    if (lat != null) place.lat = lat;
    if (lng != null) place.lng = lng;
    await user.save();
    res.json(user.savedPlaces);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteSavedPlace = async (req, res) => {
  try {
    const index = parseInt(req.params.index, 10);
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (index < 0 || index >= user.savedPlaces.length)
      return res.status(404).json({ message: "Place not found" });

    user.savedPlaces.splice(index, 1);
    await user.save();
    res.json(user.savedPlaces);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { registerUser, loginUser, getUserProfile, updateUserProfile, sendOtp, getSavedPlaces, addSavedPlace, updateSavedPlace, deleteSavedPlace };
