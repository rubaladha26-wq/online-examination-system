const express = require('express');
const router = express.Router();
const {
  getTeacherDashboard,
  uploadSyllabus,
  getSyllabuses,
  getSyllabusById,
  updateSyllabusUnits,
  generateQuestions,
  getQuestions,
  createQuestion,
  updateQuestion,
  approveQuestion,
  rejectQuestion,
  deleteQuestion,
  getExams,
  createExam,
  getExamById,
  publishExam,
  getExamAttempts,
  getAttemptDetails,
  overrideGrading,
  releaseExamResults,
  exportResultsCSV,
} = require('../controllers/teacherController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All teacher routes require teacher role (or admin)
router.use(protect, authorize('teacher', 'admin'));

router.get('/dashboard', getTeacherDashboard);

// Syllabus Routes
router.post('/syllabuses', upload.single('file'), uploadSyllabus);
router.get('/syllabuses', getSyllabuses);
router.get('/syllabuses/:id', getSyllabusById);
router.put('/syllabuses/:id/units', updateSyllabusUnits);
router.post('/syllabuses/:id/generate-questions', generateQuestions);

// Question Bank Routes
router.get('/questions', getQuestions);
router.post('/questions', createQuestion);
router.put('/questions/:id', updateQuestion);
router.post('/questions/:id/approve', approveQuestion);
router.post('/questions/:id/reject', rejectQuestion);
router.delete('/questions/:id', deleteQuestion);

// Exam Routes
router.get('/exams', getExams);
router.post('/exams', createExam);
router.get('/exams/:id', getExamById);
router.post('/exams/:id/publish', publishExam);

// Results & Grading Review
router.get('/exams/:id/attempts', getExamAttempts);
router.get('/attempts/:attemptId', getAttemptDetails);
router.post('/attempts/:attemptId/override-grading', overrideGrading);
router.post('/exams/:id/release-results', releaseExamResults);
router.get('/exams/:id/export-csv', exportResultsCSV);

module.exports = router;
