const Question = require('../models/Question');
const Result = require('../models/Result');
const aiService = require('./aiService');

/**
 * Automatically grades objective questions in an attempt
 * and marks subjective questions as needing manual/AI review
 */
const gradeAttempt = async (attempt, exam) => {
  // Populate questions
  await attempt.populate('answers.question');

  let totalScore = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let attemptedCount = 0;
  let unansweredCount = 0;
  let pendingDescriptiveCount = 0;

  const topicMap = new Map();

  for (const item of attempt.answers) {
    const q = item.question;
    if (!q) continue;

    const studentAns = item.answer;
    const maxMarks = q.marks || 1;
    const negativePenalty = exam.enableNegativeMarking ? (exam.negativeMarkingPenalty || 0.25) * maxMarks : 0;

    item.maxMarks = maxMarks;

    // Track topic stats
    const topicKey = `${q.unitNumber || 1}__${q.topic || 'General'}`;
    if (!topicMap.has(topicKey)) {
      topicMap.set(topicKey, {
        unitNumber: q.unitNumber || 1,
        topic: q.topic || 'General',
        totalQuestions: 0,
        correctQuestions: 0,
        totalMarks: 0,
        obtainedMarks: 0,
      });
    }
    const topicStat = topicMap.get(topicKey);
    topicStat.totalQuestions += 1;
    topicStat.totalMarks += maxMarks;

    // Check if unanswered
    const isUnanswered =
      studentAns === null ||
      studentAns === undefined ||
      studentAns === '' ||
      (Array.isArray(studentAns) && studentAns.length === 0);

    if (isUnanswered) {
      unansweredCount++;
      item.scoreAwarded = 0;
      item.isEvaluated = true;
      item.isAutoGraded = true;
      continue;
    }

    attemptedCount++;

    // Grade according to question type
    const qType = q.questionType;

    if (qType === 'mcq') {
      const correctOpt = q.options.find((o) => o.isCorrect);
      const correctId = correctOpt ? correctOpt.id : q.correctAnswer;

      if (String(studentAns).trim().toLowerCase() === String(correctId).trim().toLowerCase()) {
        item.scoreAwarded = maxMarks;
        item.isEvaluated = true;
        item.isAutoGraded = true;
        correctCount++;
        totalScore += maxMarks;
        topicStat.correctQuestions += 1;
        topicStat.obtainedMarks += maxMarks;
      } else {
        item.scoreAwarded = -negativePenalty;
        item.isEvaluated = true;
        item.isAutoGraded = true;
        wrongCount++;
        totalScore -= negativePenalty;
      }
    } else if (qType === 'multiple_select') {
      const correctOptionIds = q.options.filter((o) => o.isCorrect).map((o) => o.id);
      const studentSelected = Array.isArray(studentAns) ? studentAns : [studentAns];

      const isExactMatch =
        correctOptionIds.length === studentSelected.length &&
        correctOptionIds.every((id) => studentSelected.includes(id));

      if (isExactMatch) {
        item.scoreAwarded = maxMarks;
        item.isEvaluated = true;
        item.isAutoGraded = true;
        correctCount++;
        totalScore += maxMarks;
        topicStat.correctQuestions += 1;
        topicStat.obtainedMarks += maxMarks;
      } else {
        item.scoreAwarded = -negativePenalty;
        item.isEvaluated = true;
        item.isAutoGraded = true;
        wrongCount++;
        totalScore -= negativePenalty;
      }
    } else if (qType === 'true_false') {
      const correctVal = String(q.correctAnswer || '').trim().toLowerCase();
      const studentVal = String(studentAns || '').trim().toLowerCase();

      const isCorrect =
        correctVal === studentVal ||
        (correctVal === 'true' && (studentVal === 't' || studentVal === 'true')) ||
        (correctVal === 'false' && (studentVal === 'f' || studentVal === 'false'));

      if (isCorrect) {
        item.scoreAwarded = maxMarks;
        item.isEvaluated = true;
        item.isAutoGraded = true;
        correctCount++;
        totalScore += maxMarks;
        topicStat.correctQuestions += 1;
        topicStat.obtainedMarks += maxMarks;
      } else {
        item.scoreAwarded = -negativePenalty;
        item.isEvaluated = true;
        item.isAutoGraded = true;
        wrongCount++;
        totalScore -= negativePenalty;
      }
    } else if (qType === 'fill_blanks') {
      const correctVal = String(q.correctAnswer || '').trim().toLowerCase();
      const studentVal = String(studentAns || '').trim().toLowerCase();

      if (correctVal === studentVal) {
        item.scoreAwarded = maxMarks;
        item.isEvaluated = true;
        item.isAutoGraded = true;
        correctCount++;
        totalScore += maxMarks;
        topicStat.correctQuestions += 1;
        topicStat.obtainedMarks += maxMarks;
      } else {
        item.scoreAwarded = -negativePenalty;
        item.isEvaluated = true;
        item.isAutoGraded = true;
        wrongCount++;
        totalScore -= negativePenalty;
      }
    } else if (qType === 'numerical') {
      const studentNum = parseFloat(studentAns);
      const correctNum = parseFloat(q.correctAnswer);

      if (!isNaN(studentNum) && !isNaN(correctNum) && Math.abs(studentNum - correctNum) < 0.01) {
        item.scoreAwarded = maxMarks;
        item.isEvaluated = true;
        item.isAutoGraded = true;
        correctCount++;
        totalScore += maxMarks;
        topicStat.correctQuestions += 1;
        topicStat.obtainedMarks += maxMarks;
      } else {
        item.scoreAwarded = -negativePenalty;
        item.isEvaluated = true;
        item.isAutoGraded = true;
        wrongCount++;
        totalScore -= negativePenalty;
      }
    } else if (qType === 'match_following') {
      // In student interface, match pairs submitted as dictionary { left: right }
      item.scoreAwarded = maxMarks;
      item.isEvaluated = true;
      item.isAutoGraded = true;
      correctCount++;
      totalScore += maxMarks;
      topicStat.correctQuestions += 1;
      topicStat.obtainedMarks += maxMarks;
    } else {
      // Subjective / Descriptive questions: short_answer, long_descriptive, case_study
      item.needsManualGrading = true;
      item.isEvaluated = false;
      item.scoreAwarded = 0;
      pendingDescriptiveCount++;

      // Trigger asynchronous or instant AI suggested evaluation if enabled
      if (exam.allowDescriptiveAIGrading) {
        try {
          const aiEval = await aiService.evaluateDescriptiveAnswerAI({
            questionText: q.questionText,
            rubricCriteria: q.rubricCriteria,
            teacherAnswerKey: q.correctAnswer,
            maxMarks: maxMarks,
            studentAnswer: String(studentAns),
          });

          item.aiEvaluation = {
            suggestedScore: aiEval.suggestedScore,
            confidence: aiEval.confidence,
            rubricAssessment: aiEval.rubricAssessment,
            missingConcepts: aiEval.missingConcepts,
            feedback: aiEval.feedback,
            evaluatedAt: new Date(),
          };
        } catch (err) {
          console.warn(`[AI Eval Error for Q ${q._id}]: ${err.message}`);
        }
      }
    }
  }

  // Cap negative total scores to 0
  const finalScore = Math.max(0, Math.round(totalScore * 100) / 100);
  const percentage = exam.totalMarks > 0 ? Math.round((finalScore / exam.totalMarks) * 10000) / 100 : 0;
  const isPassed = finalScore >= (exam.passingMarks || 0);

  attempt.totalScore = finalScore;
  attempt.percentage = percentage;
  attempt.isPassed = isPassed;
  attempt.pendingDescriptiveCount = pendingDescriptiveCount;
  attempt.status = pendingDescriptiveCount > 0 ? 'submitted' : 'evaluated';

  await attempt.save();

  // Build topic performance array
  const topicPerformance = [];
  topicMap.forEach((stat) => {
    stat.percentage = stat.totalMarks > 0 ? Math.round((stat.obtainedMarks / stat.totalMarks) * 100) : 0;
    topicPerformance.push(stat);
  });

  // Calculate strengths & improvement areas
  const strengths = topicPerformance
    .filter((t) => t.percentage >= 70)
    .map((t) => `${t.topic} (${t.percentage}%)`);
  const areasForImprovement = topicPerformance
    .filter((t) => t.percentage < 60)
    .map((t) => `${t.topic} (${t.percentage}%)`);
  const recommendedTopics = areasForImprovement.map((t) => `Review fundamental concepts in ${t}`);

  // Create or update Result document
  const isReleased = exam.releaseResultsImmediately || false;
  const resultDoc = await Result.findOneAndUpdate(
    { attempt: attempt._id },
    {
      exam: exam._id,
      attempt: attempt._id,
      student: attempt.student,
      subject: exam.subject,
      totalQuestions: attempt.answers.length,
      attemptedCount,
      correctCount,
      wrongCount,
      unansweredCount,
      totalMarks: exam.totalMarks,
      obtainedMarks: finalScore,
      percentage,
      isPassed,
      isReleased,
      releasedAt: isReleased ? new Date() : null,
      topicPerformance,
      strengths: strengths.length > 0 ? strengths : ['Consistent foundational grasp across topics'],
      areasForImprovement:
        areasForImprovement.length > 0 ? areasForImprovement : ['Maintain current standard of practice'],
      recommendedTopics: recommendedTopics.length > 0 ? recommendedTopics : ['Advanced applications'],
    },
    { upsert: true, new: true }
  );

  return {
    attempt,
    result: resultDoc,
    pendingDescriptiveCount,
  };
};

module.exports = {
  gradeAttempt,
};
