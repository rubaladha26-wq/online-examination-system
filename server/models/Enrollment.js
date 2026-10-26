const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],
    status: {
      type: String,
      enum: ['active', 'completed', 'suspended'],
      default: 'active',
    },
  },
  { timestamps: true }
);

enrollmentSchema.index({ student: 1, batch: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
