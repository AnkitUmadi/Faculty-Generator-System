const Timetable = require('../models/Timetable');
const { generateTimetable } = require('../utils/timetableGenerator');

/**
 * GENERATE TIMETABLE
 */
const generateTimetableForDepartment = async (req, res) => {
  try {
    const { departmentId } = req.query;

    console.log('\n🎯 Generate Timetable Request');
    console.log('Received departmentId:', departmentId);
    console.log('Type:', typeof departmentId);

    if (!departmentId) {
      console.log('❌ No department ID provided');
      return res.status(400).json({
        success: false,
        message: 'Department ID is required'
      });
    }

    // ✅ Extract the actual ID if an object was passed
    let actualDeptId = departmentId;
    if (typeof departmentId === 'string') {
      try {
        // Check if it's a stringified JSON object
        const parsed = JSON.parse(departmentId);
        if (parsed._id) {
          actualDeptId = parsed._id;
          console.log('📝 Extracted department ID from object:', actualDeptId);
        }
      } catch (e) {
        // It's just a plain string ID, which is correct
        actualDeptId = departmentId;
      }
    }

    console.log('✅ Using department ID:', actualDeptId);

    // Generate timetable using the utility function
    console.log('📊 Calling timetable generator...');
    const generatedTimetable = await generateTimetable(actualDeptId);

    if (!generatedTimetable) {
      console.log('❌ No timetable generated (no faculty found)');
      return res.status(404).json({
        success: false,
        message: 'No faculty found for this department. Please add faculty members first.'
      });
    }

    console.log('✅ Timetable generated successfully');

    // Save or update timetable in database
    let timetableDoc = await Timetable.findOne({ department: actualDeptId });

    if (timetableDoc) {
      console.log('📝 Updating existing timetable document');
      timetableDoc.timetable = generatedTimetable;
      await timetableDoc.save();
    } else {
      console.log('📝 Creating new timetable document');
      timetableDoc = await Timetable.create({
        department: actualDeptId,
        timetable: generatedTimetable
      });
    }

    console.log('✅ Timetable saved to database');

    return res.status(200).json({
      success: true,
      data: timetableDoc,
      message: 'Timetable generated successfully'
    });

  } catch (error) {
    console.error('❌ Error in generateTimetableForDepartment:', error);
    console.error('Stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * GET TIMETABLE FOR DEPARTMENT
 */
const getTimetableByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.query;

    console.log('\n📖 Get Timetable Request');
    console.log('Department ID:', departmentId);

    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: 'Department ID is required'
      });
    }

    const timetable = await Timetable.findOne({ department: departmentId })
      .populate('department');

    if (!timetable) {
      console.log('❌ No timetable found for this department');
      return res.status(404).json({
        success: false,
        message: 'No timetable found for this department. Please generate one first.'
      });
    }

    console.log('✅ Timetable retrieved');

    return res.status(200).json({
      success: true,
      data: timetable
    });

  } catch (error) {
    console.error('❌ Error in getTimetableByDepartment:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * DELETE TIMETABLE
 */
const deleteTimetable = async (req, res) => {
  try {
    const { departmentId } = req.query;

    console.log('\n🗑️ Delete Timetable Request');
    console.log('Department ID:', departmentId);

    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: 'Department ID is required'
      });
    }

    const result = await Timetable.deleteOne({ department: departmentId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No timetable found to delete'
      });
    }

    console.log('✅ Timetable deleted');

    return res.status(200).json({
      success: true,
      message: 'Timetable deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error in deleteTimetable:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  generateTimetableForDepartment,
  getTimetableByDepartment,
  deleteTimetable
};