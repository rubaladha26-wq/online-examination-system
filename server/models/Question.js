const mongoose = require('mongoose');

const questionOptionSchema = new mongoose.Schema({
  id: {
    type: String, // e.g. 'opt_1', 'A', 'B', etc.
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  isCorrect: {
    type: Boolean,
    default: false,
  },
});

const matchPairSchema = new mongoose.Schema({
  left: {
    type: String,
    required: true,
  },
  right: {
    type: String,
    required: true,
  },
});

const questionSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    syllabus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Syllabus',
    },
    unitNumber: {
      type: Number,
      required: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    learningObjective: {
      type: String,
      default: '',
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    questionType: {
      type: String,
      enum: [
        'mcq',
        'multiple_select',
        'true_false',
        'fill_blanks',
        'match_following',
        'short_answer',
        'long_descriptive',
        'numerical',
        'case_study',
      ],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    cognitiveLevel: {
      type: String,
      enum: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'],
      default: 'understand',
    },
    marks: {
      type: Number,
      required: true,
      default: 1,
    },
    negativeMarks: {
      type: Number,
      default: 0,
    },
    // For MCQ & Multiple-select
    options: [questionOptionSchema],
    // For Match the following
    matchPairs: [matchPairSchema],
    // For True/False, Fill in blanks, Numerical, etc.
    correctAnswer: {
      type: String, // Stringified answer, single option id, true/false, or formula/numerical result
    },
    // Optional context/case study reading passage
    caseStudyContext: {
      type: String,
      default: '',
    },
    // Rubric / Key points for descriptive / short answers
    rubricCriteria: [
      {
        criterion: String,
        points: Number,
      },
    ],
    explanation: {
      type: String,
      default: '',
    },
    sourceTopic: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'approved', 'rejected'],
      default: 'draft',
    },
    aiGenerated: {
      type: Boolean,
      default: false,
    },
    aiMetadata: {
      model: String,
      promptTokens: Number,
      completionTokens: Number,
      generatedAt: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

questionSchema.index({ subject: 1, status: 1, difficulty: 1 });
questionSchema.index({ unitNumber: 1, topic: 1 });

module.exports = mongoose.model('Question', questionSchema);
