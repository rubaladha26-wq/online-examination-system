const path = require('path');
const fs = require('fs');
const Subject = require('../models/Subject');
const Syllabus = require('../models/Syllabus');
const Question = require('../models/Question');
const Examination = require('../models/Examination');
const ExaminationAttempt = require('../models/ExaminationAttempt');
const Result = require('../models/Result');
const AuditLog = require('../models/AuditLog');
const { extractTextFromFile, parseSyllabusStructure } = require('../services/syllabusService');
const { generateQuestionsForSyllabus } = require('../services/questionGenerationService');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * @route   GET /api/teacher/dashboard
 * @desc    Metrics and summaries for teacher dashboard
 */
const getTeacherDashboard = async (req, res, next) => {
  try {
    const teacherId = req.user._id;

    // Fetch subjects assigned to teacher or created by teacher
    const assignedSubjects = await Subject.find({ assignedTeachers: teacherId });
    const subjectIds = assignedSubjects.map((s) => s._id);

    const [
      syllabusesCount,
      totalQuestions,
      draftQuestions,
      approvedQuestions,
      examsCount,
      pendingDescriptiveCount,
      recentAttempts,
    ] = await Promise.all([
      Syllabus.countDocuments({ uploadedBy: teacherId }),
      Question.countDocuments({ createdBy: teacherId }),
      Question.countDocuments({ createdBy: teacherId, status: 'draft' }),
      Question.countDocuments({ createdBy: teacherId, status: 'approved' }),
      Examination.countDocuments({ createdBy: teacherId }),
      ExaminationAttempt.countDocuments({
        status: 'submitted',
        pendingDescriptiveCount: { $gt: 0 },
      }),
      ExaminationAttempt.find({ status: { $in: ['submitted', 'evaluated'] } })
        .sort({ submittedAt: -1 })
        .limit(6)
        .populate('exam', 'title code totalMarks')
        .populate('student', 'name email'),
    ]);

    return successResponse(res, 200, 'Teacher dashboard data retrieved', {
      assignedSubjects,
      counts: {
        subjects: assignedSubjects.length,
        syllabuses: syllabusesCount,
        totalQuestions,
        draftQuestions,
        approvedQuestions,
        exams: examsCount,
        pendingDescriptiveReviews: pendingDescriptiveCount,
      },
      recentAttempts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/teacher/syllabuses
 * @desc    Upload syllabus file and parse text into units/topics
 */
const uploadSyllabus = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 400, 'No syllabus file uploaded.');
    }

    const { title, subjectId, courseId, semester, academicYear } = req.body;

    if (!title || !subjectId) {
      // Clean up uploaded file if missing required metadata
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return errorResponse(res, 400, 'Title and subject are required fields.');
    }

    const fileExt = path.extname(req.file.originalname).replace('.', '').toLowerCase();

    // 1. Extract raw text from file
    let rawText = '';
    try {
      rawText = await extractTextFromFile(req.file.path, fileExt);
    } catch (parseErr) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return errorResponse(res, 422, `File processing error: ${parseErr.message}`);
    }

    // 2. Parse syllabus structure into units, topics, and learning objectives
    const units = parseSyllabusStructure(rawText);

    // 3. Save Syllabus document
    const syllabus = await Syllabus.create({
      title,
      subject: subjectId,
      course: courseId || null,
      semester: parseInt(semester, 10) || 1,
      academicYear: academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      uploadedBy: req.user._id,
      fileName: req.file.filename,
      originalFileName: req.file.originalname,
      fileType: fileExt,
      fileSize: req.file.size,
      filePath: req.file.path,
      rawText,
      units,
      status: 'processed',
    });

    await AuditLog.create({
      user: req.user._id,
      action: 'SYLLABUS_UPLOADED',
      entity: 'Syllabus',
      entityId: syllabus._id.toString(),
      details: { title, subjectId, unitsCount: units.length },
      ipAddress: req.ip || '',
    });

    return successResponse(res, 201, 'Syllabus uploaded and parsed successfully', syllabus);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/teacher/syllabuses
 * @desc    Get all syllabuses for current teacher
 */
const getSyllabuses = async (req, res, next) => {
  try {
    const syllabuses = await Syllabus.find({ uploadedBy: req.user._id })
      .populate('subject', 'name code')
      .populate('course', 'name code')
      .sort({ createdAt: -1 });

    return successResponse(res, 200, 'Syllabuses retrieved', syllabuses);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/teacher/syllabuses/:id
 * @desc    Get specific syllabus details and units
 */
const getSyllabusById = async (req, res, next) => {
  try {
    const syllabus = await Syllabus.findById(req.params.id)
      .populate('subject', 'name code')
      .populate('course', 'name code');

    if (!syllabus) {
      return errorResponse(res, 404, 'Syllabus not found.');
    }

    return successResponse(res, 200, 'Syllabus retrieved', syllabus);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/teacher/syllabuses/:id/units
 * @desc    Update units/topics of a syllabus
 */
const updateSyllabusUnits = async (req, res, next) => {
  try {
    const { units } = req.body;
    const syllabus = await Syllabus.findById(req.params.id);
    if (!syllabus) return errorResponse(res, 404, 'Syllabus not found.');

    syllabus.units = units;
    await syllabus.save();

    return successResponse(res, 200, 'Syllabus units updated successfully', syllabus);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/teacher/syllabuses/:id/generate-questions
 * @desc    AI Question Generation Engine endpoint
 */
const generateQuestions = async (req, res, next) => {
  try {
    const syllabusId = req.params.id;
    const {
      unitNumbers,
      questionTypes,
      count = 10,
      difficultyDistribution,
      cognitiveLevels,
      language = 'English',
      includeExplanations = true,
    } = req.body;

    const result = await generateQuestionsForSyllabus({
      syllabusId,
      unitNumbers,
      questionTypes,
      count,
      difficultyDistribution,
      cognitiveLevels,
      language,
      includeExplanations,
      userId: req.user._id,
    });

    await AuditLog.create({
      user: req.user._id,
      action: 'AI_QUESTIONS_GENERATED',
      entity: 'Syllabus',
      entityId: syllabusId,
      details: {
        count: result.totalGenerated,
        questionTypes,
      },
      ipAddress: req.ip || '',
    });

    return successResponse(
      res,
      201,
      `Successfully generated ${result.totalGenerated} questions in draft status.`,
      result
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/teacher/questions
 * @desc    Get questions for question bank with filters
 */
const getQuestions = async (req, res, next) => {
  try {
    const { subjectId, syllabusId, status, difficulty, questionType, search } = req.query;
    const query = {};

    if (subjectId) query.subject = subjectId;
    if (syllabusId) query.syllabus = syllabusId;
    if (status && status !== 'all') query.status = status;
    if (difficulty && difficulty !== 'all') query.difficulty = difficulty;
    if (questionType && questionType !== 'all') query.questionType = questionType;

    if (search) {
      query.$or = [
        { questionText: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
      ];
    }

    const questions = await Question.find(query)
      .populate('subject', 'name code')
      .sort({ createdAt: -1 });

    return successResponse(res, 200, 'Questions retrieved', questions);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/teacher/questions
 * @desc    Manually create a question in the bank
 */
const createQuestion = async (req, res, next) => {
  try {
    const question = await Question.create({
      ...req.body,
      createdBy: req.user._id,
      status: req.body.status || 'approved',
      aiGenerated: false,
    });

    return successResponse(res, 201, 'Question created successfully', question);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/teacher/questions/:id
 * @desc    Update question details
 */
const updateQuestion = async (req, res, next) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!question) return errorResponse(res, 404, 'Question not found');

    return successResponse(res, 200, 'Question updated successfully', question);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/teacher/questions/:id/approve
 * @desc    Approve a draft question for the bank
 */
const approveQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return errorResponse(res, 404, 'Question not found');

    question.status = 'approved';
    question.approvedBy = req.user._id;
    await question.save();

    return successResponse(res, 200, 'Question approved successfully', question);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/teacher/questions/:id/reject
 * @desc    Reject a draft question
 */
const rejectQuestion = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const question = await Question.findById(req.params.id);
    if (!question) return errorResponse(res, 404, 'Question not found');

    question.status = 'rejected';
    question.rejectionReason = reason || 'Does not align with curriculum standards';
    await question.save();

    return successResponse(res, 200, 'Question rejected', question);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/teacher/questions/:id
 * @desc    Delete a question
 */
const deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) return errorResponse(res, 404, 'Question not found');

    return successResponse(res, 200, 'Question deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Examination Controllers
 */
const getExams = async (req, res, next) => {
  try {
    const exams = await Examination.find({ createdBy: req.user._id })
      .populate('subject', 'name code')
      .populate('questions')
      .sort({ createdAt: -1 });

    return successResponse(res, 200, 'Teacher examinations retrieved', exams);
  } catch (error) {
    next(error);
  }
};

const createExam = async (req, res, next) => {
  try {
    const {
      title,
      code,
      description,
      instructions,
      subject,
      syllabus,
      startDate,
      endDate,
      durationMinutes,
      totalMarks,
      passingMarks,
      maxAttempts,
      questionSelectionMethod = 'manual',
      randomCriteria,
      questions = [],
      enableNegativeMarking,
      negativeMarkingPenalty,
      releaseResultsImmediately,
      allowDescriptiveAIGrading,
    } = req.body;

    let selectedQuestions = [...questions];

    // If random selection from bank was requested:
    if (questionSelectionMethod === 'random_from_bank' && (!questions || questions.length === 0)) {
      const qQuery = { subject, status: 'approved' };
      const pool = await Question.find(qQuery);
      if (pool.length === 0) {
        return errorResponse(
          res,
          400,
          'No approved questions found in the question bank for this subject.'
        );
      }
      // Shuffle and pick required count
      const desiredCount = Math.min(pool.length, Math.round((totalMarks || 20) / 2) || 10);
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      selectedQuestions = shuffled.slice(0, desiredCount).map((q) => q._id);
    }

    const exam = await Examination.create({
      title,
      code: code || `EX-${Date.now().toString().slice(-6)}`,
      description,
      instructions,
      subject,
      syllabus: syllabus || null,
      createdBy: req.user._id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      durationMinutes: parseInt(durationMinutes, 10) || 60,
      totalMarks: parseFloat(totalMarks) || 50,
      passingMarks: parseFloat(passingMarks) || 20,
      maxAttempts: parseInt(maxAttempts, 10) || 1,
      questionSelectionMethod,
      randomCriteria,
      questions: selectedQuestions,
      enableNegativeMarking: Boolean(enableNegativeMarking),
      negativeMarkingPenalty: parseFloat(negativeMarkingPenalty) || 0.25,
      releaseResultsImmediately: Boolean(releaseResultsImmediately),
      allowDescriptiveAIGrading: allowDescriptiveAIGrading !== false,
      status: 'draft',
    });

    await AuditLog.create({
      user: req.user._id,
      action: 'EXAM_CREATED',
      entity: 'Examination',
      entityId: exam._id.toString(),
      details: { title, totalMarks, questionCount: selectedQuestions.length },
      ipAddress: req.ip || '',
    });

    return successResponse(res, 201, 'Examination created successfully', exam);
  } catch (error) {
    next(error);
  }
};

const getExamById = async (req, res, next) => {
  try {
    const exam = await Examination.findById(req.params.id)
      .populate('subject', 'name code')
      .populate('questions');

    if (!exam) return errorResponse(res, 404, 'Examination not found');
    return successResponse(res, 200, 'Examination retrieved', exam);
  } catch (error) {
    next(error);
  }
};

const publishExam = async (req, res, next) => {
  try {
    const exam = await Examination.findById(req.params.id);
    if (!exam) return errorResponse(res, 404, 'Examination not found');

    if (!exam.questions || exam.questions.length === 0) {
      return errorResponse(res, 400, 'Cannot publish an examination without any questions.');
    }

    exam.status = 'published';
    await exam.save();

    await AuditLog.create({
      user: req.user._id,
      action: 'EXAM_PUBLISHED',
      entity: 'Examination',
      entityId: exam._id.toString(),
      details: { title: exam.title },
      ipAddress: req.ip || '',
    });

    return successResponse(res, 200, 'Examination published successfully', exam);
  } catch (error) {
    next(error);
  }
};

/**
 * Results & Grading Review Controllers
 */
const getExamAttempts = async (req, res, next) => {
  try {
    const examId = req.params.id;
    const attempts = await ExaminationAttempt.find({ exam: examId })
      .populate('student', 'name email')
      .populate('answers.question')
      .sort({ submittedAt: -1 });

    const results = await Result.find({ exam: examId });

    return successResponse(res, 200, 'Exam attempts and results retrieved', {
      attempts,
      results,
    });
  } catch (error) {
    next(error);
  }
};

const getAttemptDetails = async (req, res, next) => {
  try {
    const attempt = await ExaminationAttempt.findById(req.params.attemptId)
      .populate('exam')
      .populate('student', 'name email')
      .populate('answers.question');

    if (!attempt) return errorResponse(res, 404, 'Attempt not found');

    const result = await Result.findOne({ attempt: attempt._id });

    return successResponse(res, 200, 'Attempt details retrieved', {
      attempt,
      result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/teacher/attempts/:attemptId/override-grading
 * @desc    Teacher reviews AI grading recommendation and confirms or overrides score
 */
const overrideGrading = async (req, res, next) => {
  try {
    const { questionId, newScore, feedback, reason } = req.body;
    const attempt = await ExaminationAttempt.findById(req.params.attemptId).populate('exam');

    if (!attempt) return errorResponse(res, 404, 'Attempt not found');

    const answerItem = attempt.answers.find(
      (a) => a.question.toString() === questionId.toString()
    );

    if (!answerItem) {
      return errorResponse(res, 404, 'Question not found in this attempt.');
    }

    const previousScore = answerItem.scoreAwarded || 0;
    const scoreVal = Math.max(0, Math.min(answerItem.maxMarks || 10, parseFloat(newScore) || 0));

    answerItem.scoreAwarded = scoreVal;
    answerItem.isEvaluated = true;
    answerItem.needsManualGrading = false;
    answerItem.evaluationFeedback = feedback || answerItem.evaluationFeedback;
    answerItem.teacherOverride = {
      originalScore: previousScore,
      newScore: scoreVal,
      reason: reason || 'Teacher manual review',
      overriddenBy: req.user._id,
      overriddenAt: new Date(),
    };

    // Recalculate total score
    let newTotal = 0;
    let pendingCount = 0;
    attempt.answers.forEach((ans) => {
      newTotal += ans.scoreAwarded || 0;
      if (ans.needsManualGrading && !ans.isEvaluated) {
        pendingCount++;
      }
    });

    const totalMarks = attempt.exam.totalMarks || 50;
    attempt.totalScore = Math.max(0, Math.round(newTotal * 100) / 100);
    attempt.percentage = Math.round((attempt.totalScore / totalMarks) * 10000) / 100;
    attempt.isPassed = attempt.totalScore >= (attempt.exam.passingMarks || 0);
    attempt.pendingDescriptiveCount = pendingCount;
    if (pendingCount === 0) {
      attempt.status = 'evaluated';
    }

    await attempt.save();

    // Update Result document
    await Result.findOneAndUpdate(
      { attempt: attempt._id },
      {
        obtainedMarks: attempt.totalScore,
        percentage: attempt.percentage,
        isPassed: attempt.isPassed,
      }
    );

    await AuditLog.create({
      user: req.user._id,
      action: 'TEACHER_GRADING_OVERRIDE',
      entity: 'ExaminationAttempt',
      entityId: attempt._id.toString(),
      details: { questionId, previousScore, newScore: scoreVal, reason },
      ipAddress: req.ip || '',
    });

    return successResponse(res, 200, 'Grade updated successfully', {
      attempt,
      updatedQuestion: answerItem,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/teacher/exams/:id/release-results
 * @desc    Release exam results so students can view scores and explanations
 */
const releaseExamResults = async (req, res, next) => {
  try {
    const examId = req.params.id;
    const exam = await Examination.findById(examId);
    if (!exam) return errorResponse(res, 404, 'Examination not found');

    exam.resultsReleaseDate = new Date();
    await exam.save();

    await Result.updateMany(
      { exam: examId },
      { $set: { isReleased: true, releasedAt: new Date() } }
    );

    await AuditLog.create({
      user: req.user._id,
      action: 'EXAM_RESULTS_RELEASED',
      entity: 'Examination',
      entityId: examId,
      details: { title: exam.title },
      ipAddress: req.ip || '',
    });

    return successResponse(res, 200, 'Examination results released to students successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/teacher/exams/:id/export-csv
 * @desc    Export exam results to CSV format
 */
const exportResultsCSV = async (req, res, next) => {
  try {
    const examId = req.params.id;
    const exam = await Examination.findById(examId).populate('subject');
    if (!exam) return errorResponse(res, 404, 'Exam not found');

    const results = await Result.find({ exam: examId }).populate('student', 'name email');

    let csvContent = 'Student Name,Email,Total Marks,Obtained Marks,Percentage,Pass Status,Release Date\n';
    results.forEach((r) => {
      const name = r.student ? `"${r.student.name}"` : 'Unknown';
      const email = r.student ? r.student.email : '';
      csvContent += `${name},${email},${r.totalMarks},${r.obtainedMarks},${r.percentage}%,${r.isPassed ? 'PASS' : 'FAIL'},${r.releasedAt ? r.releasedAt.toISOString() : 'Unreleased'}\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment(`${exam.title.replace(/\s+/g, '_')}_results.csv`);
    return res.send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
