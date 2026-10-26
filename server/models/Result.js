const mongoose = require('mongoose');

const topicPerformanceSchema = new mongoose.Schema({
  unitNumber: Number,
  topic: String,
  totalQuestions: Number,
  correctQuestions: Number,
  totalMarks: Number,
  obtainedMarks: Number,
  percentage: Number,
});

const resultSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Examination',
      required: true,
    },
    attempt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExaminationAttempt',
      required: true,
      unique: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    attemptedCount: {
      type: Number,
      default: 0,
    },
    correctCount: {
      type: Number,
      default: 0,
    },
    wrongCount: {
      type: Number,
      default: 0,
    },
    unansweredCount: {
      type: Number,
      default: 0,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    obtainedMarks: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    isPassed: {
      type: Boolean,
      required: true,
    },
    isReleased: {
      type: Boolean,
      default: false,
    },
    releasedAt: {
      type: Date,
    },
    topicPerformance: [topicPerformanceSchema],
    strengths: [String],
    areasForImprovement: [String],
    recommendedTopics: [String],
  },
  { timestamps: true }
);

resultSchema.index({ exam: 1, student: 1 });
resultSchema.index({ student: 1, isReleased: 1 });

module.exports = mongoose.model('Result', resultSchema);
