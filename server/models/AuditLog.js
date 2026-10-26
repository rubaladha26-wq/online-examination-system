const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    action: {
      type: String,
      required: true, // e.g. USER_LOGIN, EXAM_PUBLISHED, QUESTION_APPROVED, DESCRIPTIVE_OVERRIDE
    },
    entity: {
      type: String,
      required: true, // e.g. User, Examination, Question, Syllabus
    },
    entityId: {
      type: String,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ entity: 1, action: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
