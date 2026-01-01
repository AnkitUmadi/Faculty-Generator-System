const mongoose = require("mongoose");

const timetableSchema = new mongoose.Schema(
  {
    // ✅ MUST be ObjectId (NOT string)
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    timetable: {
      type: Object,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Timetable", timetableSchema);
