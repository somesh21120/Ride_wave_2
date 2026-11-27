const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, enum: ["passenger", "driver", "admin"], default: "passenger" },
    isActive: { type: Boolean, default: true },
    // Driver-specific fields
    vehicle: {
      type: { type: String, enum: ["bike", "auto", "car", ""], default: "" },
      model: { type: String, default: "" },
      number: { type: String, default: "" },
      carSubtype: { type: String, enum: ["Sedan", "SUV", "Hatchback", "Other", ""], default: "" },
      seatingCapacity: { type: Number, default: 0 }, // total seats including driver
    },
    idProof: { type: String, default: "" }, // reference path or filename of uploaded ID proof
    isVerified: { type: Boolean, default: false }, // email/phone verification flag
    savedPlaces: {
      type: [
        {
          label: { type: String, required: true, trim: true, minlength: 1, maxlength: 30 },
          address: { type: String, required: true },
          lat: { type: Number, required: true, min: -90, max: 90 },
          lng: { type: Number, required: true, min: -180, max: 180 },
        },
      ],
      validate: {
        validator: function (v) { return v.length <= 5; },
        message: "You can save up to 5 places only",
      },
      default: [],
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
