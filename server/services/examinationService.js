const Examination = require('../models/Examination');
const ExaminationAttempt = require('../models/ExaminationAttempt');
const Question = require('../models/Question');
const Enrollment = require('../models/Enrollment');
const { gradeAttempt } = require('./gradingService');

/**
 * Start or resume an examination for a student
 */
const startStudentExam = async (examId, studentId, reqMeta = {}) => {
  const exam = await Examination.findById(examId).populate('questions');
  if (!exam) {
    throw new Error('Examination not found');
  }

  if (['draft', 'cancelled'].includes(exam.status)) {
    throw new Error('This examination is currently not available for taking.');
  }

  const now = new Date();
  if (now < new Date(exam.startDate)) {
    throw new Error(`This examination has not started yet. Starts at: ${exam.startDate.toLocaleString()}`);
  }

  if (now > new Date(exam.endDate)) {
    throw new Error(`This examination has already concluded. Concluded at: ${exam.endDate.toLocaleString()}`);
  }

  // Check existing attempts
  const existingAttempts = await ExaminationAttempt.find({
    exam: examId,
    student: studentId,
  }).sort({ attemptNumber: -1 });

  // If there is an in-progress attempt, check deadline
  const inProgress = existingAttempts.find((a) => a.status === 'in_progress');
  if (inProgress) {
    if (now > new Date(inProgress.endTimeDeadline)) {
      // Auto-submit expired attempt
      inProgress.status = 'timed_out';
      inProgress.submittedAt = now;
      await inProgress.save();
      await gradeAttempt(inProgress, exam);
    } else {
      // Resume existing in-progress attempt
      return sanitizeAttemptForStudent(inProgress, exam);
    }
  }

  // Check attempt limit
  const completedCount = existingAttempts.filter((a) => ['submitted', 'timed_out', 'evaluated'].includes(a.status)).length;
  if (completedCount >= (exam.maxAttempts || 1)) {
    throw new Error(`You have reached the maximum allowed attempts (${exam.maxAttempts || 1}) for this examination.`);
  }

  // Create new attempt
  const attemptNumber = completedCount + 1;
  const startTime = new Date();
  const durationMs = (exam.durationMinutes || 60) * 60 * 1000;
  // Authoritative deadline cannot exceed exam's global endDate
  const calculatedDeadline = new Date(startTime.getTime() + durationMs);
  const examEnd = new Date(exam.endDate);
  const endTimeDeadline = calculatedDeadline < examEnd ? calculatedDeadline : examEnd;

  // Prepare questions order
  let questionIds = exam.questions.map((q) => q._id || q);
  if (exam.randomizeQuestions) {
    questionIds = [...questionIds].sort(() => Math.random() - 0.5);
  }

  const initialAnswers = questionIds.map((qId) => ({
    question: qId,
    answer: null,
    isMarkedForReview: false,
    answeredAt: null,
  }));

  const newAttempt = new ExaminationAttempt({
    exam: examId,
    student: studentId,
    attemptNumber,
    startTime,
    endTimeDeadline,
    status: 'in_progress',
    questionsOrder: questionIds,
    answers: initialAnswers,
    ipAddress: reqMeta.ipAddress || '',
    userAgent: reqMeta.userAgent || '',
  });

  await newAttempt.save();
  return sanitizeAttemptForStudent(newAttempt, exam);
};

/**
 * Strips out sensitive fields (correctAnswer, isCorrect flags, explanations, rubrics)
 * before sending to student!
 */
const sanitizeAttemptForStudent = async (attempt, exam) => {
  await attempt.populate({
    path: 'questionsOrder',
    select: '-correctAnswer -explanation -rubricCriteria -aiMetadata',
  });

  // Also clean up question options so isCorrect is never leaked
  const sanitizedQuestions = attempt.questionsOrder.map((q) => {
    const qObj = q.toObject ? q.toObject() : { ...q };
    if (qObj.options && Array.isArray(qObj.options)) {
      qObj.options = qObj.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
      }));
    }
    return qObj;
  });

  return {
    attemptId: attempt._id,
    attemptNumber: attempt.attemptNumber,
    startTime: attempt.startTime,
    endTimeDeadline: attempt.endTimeDeadline,
    status: attempt.status,
    exam: {
      _id: exam._id,
      title: exam.title,
      code: exam.code,
      instructions: exam.instructions,
      durationMinutes: exam.durationMinutes,
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks,
      enableNegativeMarking: exam.enableNegativeMarking,
      negativeMarkingPenalty: exam.negativeMarkingPenalty,
    },
    questions: sanitizedQuestions,
    answers: attempt.answers.map((a) => ({
      questionId: a.question._id || a.question,
      answer: a.answer,
      isMarkedForReview: a.isMarkedForReview,
      answeredAt: a.answeredAt,
    })),
  };
};

/**
 * Autosave student answer for a specific question
 */
const saveStudentAnswer = async (attemptId, studentId, questionId, answer, isMarkedForReview) => {
  const attempt = await ExaminationAttempt.findOne({
    _id: attemptId,
    student: studentId,
  });

  if (!attempt) {
    throw new Error('Attempt not found or unauthorized');
  }

  if (attempt.status !== 'in_progress') {
    throw new Error(`Cannot submit answer. Attempt status is "${attempt.status}".`);
  }

  // Server-authoritative time check (with 30-sec grace for latency)
  const now = new Date();
  const deadline = new Date(attempt.endTimeDeadline).getTime() + 30000;
  if (now.getTime() > deadline) {
    attempt.status = 'timed_out';
    attempt.submittedAt = now;
    await attempt.save();
    const exam = await Examination.findById(attempt.exam);
    await gradeAttempt(attempt, exam);
    throw new Error('Time has expired. Your examination has been automatically submitted.');
  }

  // Update answer in array
  let existingAnswer = attempt.answers.find(
    (a) => a.question.toString() === questionId.toString()
  );

  if (existingAnswer) {
    existingAnswer.answer = answer;
    if (typeof isMarkedForReview === 'boolean') {
      existingAnswer.isMarkedForReview = isMarkedForReview;
    }
    existingAnswer.answeredAt = now;
  } else {
    attempt.answers.push({
      question: questionId,
      answer,
      isMarkedForReview: isMarkedForReview || false,
      answeredAt: now,
    });
  }

  await attempt.save();

  return {
    saved: true,
    questionId,
    isMarkedForReview: isMarkedForReview || false,
    answeredAt: now,
  };
};

/**
 * Submit final exam attempt
 */
const submitStudentExam = async (attemptId, studentId) => {
  const attempt = await ExaminationAttempt.findOne({
    _id: attemptId,
    student: studentId,
  });

  if (!attempt) {
    throw new Error('Attempt not found or unauthorized');
  }

  if (['submitted', 'evaluated'].includes(attempt.status)) {
    throw new Error('This examination attempt has already been submitted.');
  }

  attempt.status = 'submitted';
  attempt.submittedAt = new Date();
  await attempt.save();

  const exam = await Examination.findById(attempt.exam);
  const gradingResult = await gradeAttempt(attempt, exam);

  return {
    success: true,
    message: 'Examination submitted and evaluated successfully.',
    totalScore: attempt.totalScore,
    percentage: attempt.percentage,
    isPassed: attempt.isPassed,
    pendingDescriptiveCount: attempt.pendingDescriptiveCount,
    isReleased: exam.releaseResultsImmediately || false,
  };
};

module.exports = {
  startStudentExam,
  saveStudentAnswer,
  submitStudentExam,
};
