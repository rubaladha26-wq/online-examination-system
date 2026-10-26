const Examination = require('../models/Examination');
const ExaminationAttempt = require('../models/ExaminationAttempt');
const Result = require('../models/Result');
const Subject = require('../models/Subject');
const AuditLog = require('../models/AuditLog');
const {
  startStudentExam,
  saveStudentAnswer,
  submitStudentExam,
} = require('../services/examinationService');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * @route   GET /api/student/dashboard
 * @desc    Metrics and active exams for student dashboard
 */
const getStudentDashboard = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const now = new Date();

    // 1. Fetch available & upcoming examinations
    const allExams = await Examination.find({
      status: { $in: ['published', 'scheduled'] },
    }).populate('subject', 'name code');

    const availableExams = allExams.filter((e) => now >= new Date(e.startDate) && now <= new Date(e.endDate));
    const upcomingExams = allExams.filter((e) => now < new Date(e.startDate));

    // 2. Fetch student's attempts
    const attempts = await ExaminationAttempt.find({ student: studentId })
      .populate('exam', 'title code durationMinutes totalMarks passingMarks')
      .sort({ createdAt: -1 });

    const activeAttempts = attempts.filter(
      (a) => a.status === 'in_progress' && now < new Date(a.endTimeDeadline)
    );
    const completedAttempts = attempts.filter((a) => ['submitted', 'evaluated', 'timed_out'].includes(a.status));

    // 3. Fetch released results
    const results = await Result.find({ student: studentId, isReleased: true })
      .populate('exam', 'title code totalMarks passingMarks')
      .populate('subject', 'name code')
      .sort({ createdAt: -1 });

    // Average score
    const avgScore =
      results.length > 0
        ? Math.round(results.reduce((acc, r) => acc + (r.percentage || 0), 0) / results.length)
        : 0;

    return successResponse(res, 200, 'Student dashboard retrieved', {
      counts: {
        availableExams: availableExams.length,
        upcomingExams: upcomingExams.length,
        activeAttempts: activeAttempts.length,
        completedExams: completedAttempts.length,
        averageScore: avgScore,
      },
      availableExams,
      upcomingExams,
      activeAttempts,
      recentResults: results.slice(0, 5),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/student/exams
 * @desc    Get all examinations viewable by student
 */
const getStudentExams = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const now = new Date();

    const exams = await Examination.find({
      status: { $in: ['published', 'scheduled'] },
    })
      .populate('subject', 'name code')
      .sort({ startDate: 1 });

    // Attach student attempt status for each exam
    const studentAttempts = await ExaminationAttempt.find({ student: studentId });

    const examsWithStatus = exams.map((exam) => {
      const attempts = studentAttempts.filter((a) => a.exam.toString() === exam._id.toString());
      const hasActive = attempts.some(
        (a) => a.status === 'in_progress' && now < new Date(a.endTimeDeadline)
      );
      const isConcluded = now > new Date(exam.endDate);
      const isUpcoming = now < new Date(exam.startDate);
      const isAvailable = !isUpcoming && !isConcluded;
      const canAttempt = isAvailable && attempts.length < (exam.maxAttempts || 1);

      return {
        ...exam.toObject(),
        attemptsCount: attempts.length,
        hasActiveAttempt: hasActive,
        canAttempt,
        isAvailable,
        isUpcoming,
        isConcluded,
      };
    });

    return successResponse(res, 200, 'Student examinations retrieved', examsWithStatus);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/student/exams/:id/instructions
 * @desc    Get exam instructions prior to starting
 */
const getExamInstructions = async (req, res, next) => {
  try {
    const exam = await Examination.findById(req.params.id)
      .populate('subject', 'name code')
      .select('-questions');

    if (!exam) return errorResponse(res, 404, 'Examination not found.');

    const attemptsCount = await ExaminationAttempt.countDocuments({
      exam: exam._id,
      student: req.user._id,
    });

    return successResponse(res, 200, 'Exam instructions retrieved', {
      exam,
      attemptsUsed: attemptsCount,
      attemptsRemaining: Math.max(0, (exam.maxAttempts || 1) - attemptsCount),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/student/exams/:examId/start
 * @desc    Start or resume exam attempt
 */
const startExam = async (req, res, next) => {
  try {
    const examId = req.params.examId;
    const studentId = req.user._id;

    const examData = await startStudentExam(examId, studentId, {
      ipAddress: req.ip || '',
      userAgent: req.get('User-Agent') || '',
    });

    await AuditLog.create({
      user: req.user._id,
      action: 'EXAM_ATTEMPT_STARTED',
      entity: 'ExaminationAttempt',
      entityId: examData.attemptId.toString(),
      details: { examId },
      ipAddress: req.ip || '',
    });

    return successResponse(res, 200, 'Examination started successfully', examData);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/student/attempts/:attemptId
 * @desc    Resume active exam attempt
 */
const getAttempt = async (req, res, next) => {
  try {
    const attempt = await ExaminationAttempt.findOne({
      _id: req.params.attemptId,
      student: req.user._id,
    });

    if (!attempt) return errorResponse(res, 404, 'Attempt not found or unauthorized');

    const exam = await Examination.findById(attempt.exam);
    const examData = await startStudentExam(attempt.exam, req.user._id, {});

    return successResponse(res, 200, 'Attempt resumed', examData);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/student/attempts/:attemptId/answers/:questionId
 * @desc    Autosave student answer
 */
const saveAnswer = async (req, res, next) => {
  try {
    const { attemptId, questionId } = req.params;
    const { answer, isMarkedForReview } = req.body;

    const result = await saveStudentAnswer(
      attemptId,
      req.user._id,
      questionId,
      answer,
      isMarkedForReview
    );

    return successResponse(res, 200, 'Answer autosaved', result);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/student/attempts/:attemptId/submit
 * @desc    Submit examination attempt
 */
const submitExam = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const result = await submitStudentExam(attemptId, req.user._id);

    await AuditLog.create({
      user: req.user._id,
      action: 'EXAM_ATTEMPT_SUBMITTED',
      entity: 'ExaminationAttempt',
      entityId: attemptId,
      details: {
        score: result.totalScore,
        percentage: result.percentage,
        isPassed: result.isPassed,
      },
      ipAddress: req.ip || '',
    });

    return successResponse(res, 200, 'Examination submitted successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/student/results
 * @desc    Get all released results for student
 */
const getStudentResults = async (req, res, next) => {
  try {
    const results = await Result.find({
      student: req.user._id,
      isReleased: true,
    })
      .populate('exam', 'title code totalMarks passingMarks')
      .populate('subject', 'name code')
      .sort({ releasedAt: -1 });

    return successResponse(res, 200, 'Student results retrieved', results);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/student/results/:resultId
 * @desc    Get detailed examination result with topic analytics and explanations
 */
const getResultDetails = async (req, res, next) => {
  try {
    const result = await Result.findOne({
      _id: req.params.resultId,
      student: req.user._id,
      isReleased: true,
    })
      .populate('exam')
      .populate('subject', 'name code');

    if (!result) {
      return errorResponse(res, 404, 'Result not found or not yet released by the instructor.');
    }

    const attempt = await ExaminationAttempt.findById(result.attempt).populate(
      'answers.question'
    );

    return successResponse(res, 200, 'Result details retrieved', {
      result,
      answers: attempt ? attempt.answers : [],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudentDashboard,
  getStudentExams,
  getExamInstructions,
  startExam,
  getAttempt,
  saveAnswer,
  submitExam,
  getStudentResults,
  getResultDetails,
};
