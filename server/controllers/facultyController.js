const Faculty = require("../models/Faculty");
const Subject = require("../models/Subject");

/**
 * ADD FACULTY
 */
const addFaculty = async (req, res) => {
  try {
    const { name, subjectCode, availability } = req.body;

    console.log('📥 Received ADD request:', { name, subjectCode, availability });

    if (!name || !subjectCode || !availability || availability.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Name, subject and availability are required",
      });
    }

    // 🔑 FIND SUBJECT BY CODE
    const subjectDoc = await Subject.findOne({ code: subjectCode }).populate("department");

    if (!subjectDoc) {
      return res.status(400).json({
        success: false,
        message: `Invalid subject code: "${subjectCode}"`,
      });
    }

    const faculty = new Faculty({
      name,
      subject: subjectDoc._id,              // ObjectId ✅
      department: subjectDoc.department._id, // ObjectId ✅
      availability,
    });

    await faculty.save();

    // Return populated faculty
    const populatedFaculty = await Faculty.findById(faculty._id)
      .populate({
        path: 'subject',
        populate: { path: 'department' }
      })
      .populate('department');

    console.log('✅ Faculty added successfully:', populatedFaculty.name);

    res.status(201).json({
      success: true,
      data: populatedFaculty,
    });
  } catch (err) {
    console.error('❌ Error adding faculty:', err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

/**
 * GET ALL FACULTY
 */
const getAllFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.find()
      .populate({
        path: "subject",
        populate: { path: "department" },
      })
      .populate("department");

    console.log(`✅ Retrieved ${faculty.length} faculty members`);

    return res.status(200).json({
      success: true,
      count: faculty.length,
      data: faculty,
    });
  } catch (error) {
    console.error('❌ Error fetching faculty:', error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * UPDATE FACULTY (FIXED)
 */
const updateFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subjectCode, availability } = req.body;

    console.log('📥 Received UPDATE request:', { id, name, subjectCode, availability });

    // Validation
    if (!name || !subjectCode || !availability) {
      return res.status(400).json({
        success: false,
        message: "Name, subject and availability are required",
      });
    }

    if (!Array.isArray(availability) || availability.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Availability must be a non-empty array",
      });
    }

    // Find subject by code
    const subjectDoc = await Subject.findOne({ code: subjectCode }).populate('department');

    if (!subjectDoc) {
      return res.status(404).json({
        success: false,
        message: `Subject with code "${subjectCode}" not found`,
      });
    }

    // Update faculty
    const faculty = await Faculty.findByIdAndUpdate(
      id,
      {
        name,
        subject: subjectDoc._id,
        department: subjectDoc.department._id, // ✅ CRITICAL
        availability,
      },
      { new: true, runValidators: true }
    )
      .populate({
        path: 'subject',
        populate: { path: 'department' }
      })
      .populate('department');

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    console.log('✅ Faculty updated successfully:', faculty.name);

    return res.status(200).json({
      success: true,
      data: faculty,
    });
  } catch (error) {
    console.error('❌ Error updating faculty:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * DELETE FACULTY
 */
const deleteFaculty = async (req, res) => {
  try {
    const { id } = req.params;

    const faculty = await Faculty.findByIdAndDelete(id);

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    console.log('✅ Faculty deleted:', faculty.name);

    return res.status(200).json({
      success: true,
      message: "Faculty deleted successfully",
    });
  } catch (error) {
    console.error('❌ Error deleting faculty:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET FACULTY BY DEPARTMENT (FOR REPORTS / TIMETABLE)
 */
const getFacultyByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.query;

    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: "departmentId required",
      });
    }

    const faculty = await Faculty.find({ department: departmentId })
      .populate({
        path: "subject",
        populate: { path: "department" },
      });

    console.log(`✅ Retrieved ${faculty.length} faculty for department ${departmentId}`);

    return res.json({
      success: true,
      data: faculty,
    });
  } catch (error) {
    console.error('❌ Error fetching faculty by department:', error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  addFaculty,
  getAllFaculty,
  updateFaculty,
  deleteFaculty,
  getFacultyByDepartment,
};