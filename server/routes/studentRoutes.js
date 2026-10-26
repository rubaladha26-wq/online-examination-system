const express = require('express');
const router = express.Router();
const {
  getStudentDashboard,
  getStudentExams,
  getExamInstructions,
  startExam,
  getAttempt,
  saveAnswer,
  submitExam,
  getStudentResults,
  getResultDetails,
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

// All student routes require student role (or admin)
router.use(protect, authorize('student', 'admin'));

router.get('/dashboard', getStudentDashboard);
router.get('/exams', getStudentExams);
router.get('/exams/:id/instructions', getExamInstructions);
router.post('/exams/:examId/start', startExam);
router.get('/attempts/:attemptId', getAttempt);
router.put('/attempts/:attemptId/answers/:questionId', saveAnswer);
router.post('/attempts/:attemptId/submit', submitExam);
router.get('/results', getStudentResults);
router.get('/results/:resultId', getResultDetails);

module.exports = router;
