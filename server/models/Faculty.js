const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
  },
  periods: {
    type: [Number],
    required: true,
  },
});

const facultySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    // ✅ THIS WAS MISSING — ABSOLUTELY REQUIRED
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    availability: {
      type: [availabilitySchema],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Faculty", facultySchema);
