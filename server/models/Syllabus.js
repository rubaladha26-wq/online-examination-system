const mongoose = require('mongoose');

const syllabusUnitSchema = new mongoose.Schema({
  unitNumber: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  topics: [
    {
      type: String,
    },
  ],
  learningObjectives: [
    {
      type: String,
    },
  ],
  rawContent: {
    type: String,
    default: '',
  },
});

const syllabusSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    semester: {
      type: Number,
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ['pdf', 'docx', 'txt'],
      required: true,
    },
    fileSize: {
      type: Number,
    },
    filePath: {
      type: String,
      required: true,
    },
    rawText: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'processed', 'error'],
      default: 'uploaded',
    },
    errorMessage: {
      type: String,
      default: '',
    },
    version: {
      type: Number,
      default: 1,
    },
    units: [syllabusUnitSchema],
    aiParsedSummary: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Syllabus', syllabusSchema);
