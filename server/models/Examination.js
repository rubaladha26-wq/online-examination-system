const mongoose = require('mongoose');

const examinationSectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  instructions: {
    type: String,
    default: '',
  },
  marks: {
    type: Number,
    required: true,
  },
  questions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
    },
  ],
});

const examinationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Examination title is required'],
      trim: true,
    },
    code: {
      type: String,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    instructions: {
      type: String,
      default: 'Please read all questions carefully. Time will be enforced strictly by the server.',
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    syllabus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Syllabus',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    eligibleCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    eligibleBatches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch',
      },
    ],
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: [1, 'Duration must be at least 1 minute'],
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    passingMarks: {
      type: Number,
      required: true,
    },
    maxAttempts: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['draft', 'reviewed', 'published', 'scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'draft',
    },
    questionSelectionMethod: {
      type: String,
      enum: ['manual', 'random_from_bank'],
      default: 'manual',
    },
    randomCriteria: {
      unitNumbers: [Number],
      easyCount: { type: Number, default: 0 },
      mediumCount: { type: Number, default: 0 },
      hardCount: { type: Number, default: 0 },
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    sections: [examinationSectionSchema],
    randomizeQuestions: {
      type: Boolean,
      default: false,
    },
    randomizeOptions: {
      type: Boolean,
      default: false,
    },
    enableNegativeMarking: {
      type: Boolean,
      default: false,
    },
    negativeMarkingPenalty: {
      type: Number,
      default: 0.25, // deduct 0.25 of marks on wrong answer
    },
    releaseResultsImmediately: {
      type: Boolean,
      default: false,
    },
    resultsReleaseDate: {
      type: Date,
    },
    allowDescriptiveAIGrading: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

examinationSchema.index({ subject: 1, status: 1, startDate: 1 });

module.exports = mongoose.model('Examination', examinationSchema);
