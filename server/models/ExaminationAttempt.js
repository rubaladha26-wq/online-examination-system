const mongoose = require('mongoose');

const studentAnswerSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  // Can be string (MCQ optId, true/false, fill-in, text), array (multiple_select optIds), or object (match pairs)
  answer: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  isMarkedForReview: {
    type: Boolean,
    default: false,
  },
  answeredAt: {
    type: Date,
  },
  isEvaluated: {
    type: Boolean,
    default: false,
  },
  scoreAwarded: {
    type: Number,
    default: 0,
  },
  maxMarks: {
    type: Number,
    default: 1,
  },
  isAutoGraded: {
    type: Boolean,
    default: false,
  },
  needsManualGrading: {
    type: Boolean,
    default: false,
  },
  evaluationFeedback: {
    type: String,
    default: '',
  },
  aiEvaluation: {
    suggestedScore: Number,
    confidence: Number,
    rubricAssessment: String,
    missingConcepts: [String],
    feedback: String,
    evaluatedAt: Date,
  },
  teacherOverride: {
    originalScore: Number,
    newScore: Number,
    reason: String,
    overriddenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    overriddenAt: Date,
  },
});

const examinationAttemptSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Examination',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    attemptNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTimeDeadline: {
      type: Date,
      required: true,
    },
    submittedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'timed_out', 'evaluated'],
      default: 'in_progress',
    },
    // Shuffled or preserved order of questions for this specific attempt
    questionsOrder: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    answers: [studentAnswerSchema],
    totalScore: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    isPassed: {
      type: Boolean,
      default: false,
    },
    pendingDescriptiveCount: {
      type: Number,
      default: 0,
    },
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: true }
);

examinationAttemptSchema.index({ exam: 1, student: 1, attemptNumber: 1 });
examinationAttemptSchema.index({ status: 1 });

module.exports = mongoose.model('ExaminationAttempt', examinationAttemptSchema);
