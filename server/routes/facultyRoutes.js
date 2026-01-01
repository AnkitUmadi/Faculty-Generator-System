const express = require('express');
const router = express.Router();
const { addFaculty, getAllFaculty, updateFaculty, deleteFaculty, getFacultyByDepartment } = require('../controllers/facultyController');

// GET /api/faculty - Get all faculty
router.get('/', getAllFaculty);

router.get("/by-department", getFacultyByDepartment);


// POST /api/faculty - Add new faculty
router.post('/', addFaculty);

// PUT /api/faculty/:id - Update faculty
router.put('/:id', updateFaculty);

// DELETE /api/faculty/:id - Delete faculty
router.delete('/:id', deleteFaculty);

module.exports = router;