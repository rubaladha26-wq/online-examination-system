const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const TeacherProfile = require('../models/TeacherProfile');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const Subject = require('../models/Subject');
const Examination = require('../models/Examination');
const ExaminationAttempt = require('../models/ExaminationAttempt');
const Question = require('../models/Question');
const Result = require('../models/Result');
const AuditLog = require('../models/AuditLog');
const SystemSetting = require('../models/SystemSetting');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get system-wide overview metrics
 */
const getAdminDashboard = async (req, res, next) => {
  try {
    const [
      totalStudents,
      totalTeachers,
      totalCourses,
      totalSubjects,
      totalExams,
      totalQuestions,
      totalAttempts,
      recentLogs,
      upcomingExams,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      Course.countDocuments({ isActive: true }),
      Subject.countDocuments({ isActive: true }),
      Examination.countDocuments(),
      Question.countDocuments(),
      ExaminationAttempt.countDocuments({ status: { $in: ['submitted', 'evaluated'] } }),
      AuditLog.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name email role'),
      Examination.find({ status: { $in: ['published', 'scheduled'] } })
        .sort({ startDate: 1 })
        .limit(5)
        .populate('subject', 'name code'),
    ]);

    // Calculate overall pass percentage
    const allResults = await Result.find();
    const passedCount = allResults.filter((r) => r.isPassed).length;
    const overallPassRate = allResults.length > 0 ? Math.round((passedCount / allResults.length) * 100) : 0;

    return successResponse(res, 200, 'Admin dashboard metrics retrieved', {
      counts: {
        totalStudents,
        totalTeachers,
        totalCourses,
        totalSubjects,
        totalExams,
        totalQuestions,
        totalAttempts,
        overallPassRate,
      },
      upcomingExams,
      recentLogs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/users
 * @desc    Get paginated users with search & filters
 */
const getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10)),
      User.countDocuments(query),
    ]);

    return successResponse(res, 200, 'Users retrieved', {
      users,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/users
 * @desc    Create a user from Admin panel
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, department, rollNumber, employeeId } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return errorResponse(res, 409, 'A user with this email already exists.');
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: password || 'ExamPass123!',
      role: role || 'student',
    });

    if (role === 'student') {
      await StudentProfile.create({
        user: user._id,
        rollNumber: rollNumber || `STU-${Date.now().toString().slice(-6)}`,
        department: department || null,
      });
    } else if (role === 'teacher') {
      await TeacherProfile.create({
        user: user._id,
        employeeId: employeeId || `FAC-${Date.now().toString().slice(-6)}`,
        department: department || null,
      });
    }

    await AuditLog.create({
      user: req.user._id,
      action: 'ADMIN_CREATE_USER',
      entity: 'User',
      entityId: user._id.toString(),
      details: { email: user.email, role: user.role },
      ipAddress: req.ip || '',
    });

    return successResponse(res, 201, 'User created successfully', { user });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/admin/users/:id/toggle-status
 * @desc    Activate or deactivate user account
 */
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found.');
    }

    // Prevent deactivating own account
    if (user._id.toString() === req.user._id.toString()) {
      return errorResponse(res, 400, 'You cannot deactivate your own administrative account.');
    }

    user.isActive = !user.isActive;
    await user.save();

    await AuditLog.create({
      user: req.user._id,
      action: user.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entity: 'User',
      entityId: user._id.toString(),
      details: { email: user.email, isActive: user.isActive },
      ipAddress: req.ip || '',
    });

    return successResponse(
      res,
      200,
      `User account ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
      { user }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Academic Management Controllers: Departments, Courses, Batches, Subjects
 */
const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    return successResponse(res, 200, 'Departments retrieved', departments);
  } catch (error) {
    next(error);
  }
};

const createDepartment = async (req, res, next) => {
  try {
    const department = await Department.create(req.body);
    return successResponse(res, 201, 'Department created', department);
  } catch (error) {
    next(error);
  }
};

const getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find().populate('department').sort({ name: 1 });
    return successResponse(res, 200, 'Courses retrieved', courses);
  } catch (error) {
    next(error);
  }
};

const createCourse = async (req, res, next) => {
  try {
    const course = await Course.create(req.body);
    return successResponse(res, 201, 'Course created', course);
  } catch (error) {
    next(error);
  }
};

const getBatches = async (req, res, next) => {
  try {
    const batches = await Batch.find().populate('course').sort({ createdAt: -1 });
    return successResponse(res, 200, 'Batches retrieved', batches);
  } catch (error) {
    next(error);
  }
};

const createBatch = async (req, res, next) => {
  try {
    const batch = await Batch.create(req.body);
    return successResponse(res, 201, 'Batch created', batch);
  } catch (error) {
    next(error);
  }
};

const getSubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.find()
      .populate('department')
      .populate('course')
      .populate('assignedTeachers', 'name email');
    return successResponse(res, 200, 'Subjects retrieved', subjects);
  } catch (error) {
    next(error);
  }
};

const createSubject = async (req, res, next) => {
  try {
    const subject = await Subject.create(req.body);
    return successResponse(res, 201, 'Subject created', subject);
  } catch (error) {
    next(error);
  }
};

const assignTeacherToSubject = async (req, res, next) => {
  try {
    const { teacherId } = req.body;
    const subject = await Subject.findById(req.params.id);
    if (!subject) return errorResponse(res, 404, 'Subject not found.');

    if (!subject.assignedTeachers.includes(teacherId)) {
      subject.assignedTeachers.push(teacherId);
      await subject.save();
    }

    // Also update TeacherProfile
    await TeacherProfile.findOneAndUpdate(
      { user: teacherId },
      { $addToSet: { assignedSubjects: subject._id } }
    );

    return successResponse(res, 200, 'Teacher assigned to subject', subject);
  } catch (error) {
    next(error);
  }
};

/**
 * Examination Oversight
 */
const getAllExamsAdmin = async (req, res, next) => {
  try {
    const exams = await Examination.find()
      .populate('subject', 'name code')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return successResponse(res, 200, 'All examinations retrieved', exams);
  } catch (error) {
    next(error);
  }
};

const updateExamStatusAdmin = async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    const exam = await Examination.findById(req.params.id);
    if (!exam) return errorResponse(res, 404, 'Exam not found');

    const previousStatus = exam.status;
    exam.status = status;
    await exam.save();

    await AuditLog.create({
      user: req.user._id,
      action: 'ADMIN_EXAM_STATUS_CHANGE',
      entity: 'Examination',
      entityId: exam._id.toString(),
      details: { previousStatus, newStatus: status, reason },
      ipAddress: req.ip || '',
    });

    return successResponse(res, 200, `Exam status updated to ${status}`, exam);
  } catch (error) {
    next(error);
  }
};

/**
 * System Settings
 */
const getSystemSettings = async (req, res, next) => {
  try {
    const settings = await SystemSetting.find();
    return successResponse(res, 200, 'System settings retrieved', settings);
  } catch (error) {
    next(error);
  }
};

const updateSystemSetting = async (req, res, next) => {
  try {
    const { key, value, category, description } = req.body;
    const setting = await SystemSetting.findOneAndUpdate(
      { key },
      { key, value, category, description, updatedBy: req.user._id },
      { upsert: true, new: true }
    );

    await AuditLog.create({
      user: req.user._id,
      action: 'SETTING_UPDATED',
      entity: 'SystemSetting',
      entityId: setting._id.toString(),
      details: { key, value },
      ipAddress: req.ip || '',
    });

    return successResponse(res, 200, 'Setting updated successfully', setting);
  } catch (error) {
    next(error);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);
    return successResponse(res, 200, 'Audit logs retrieved', logs);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboard,
  getUsers,
  createUser,
  toggleUserStatus,
  getDepartments,
  createDepartment,
  getCourses,
  createCourse,
  getBatches,
  createBatch,
  getSubjects,
  createSubject,
  assignTeacherToSubject,
  getAllExamsAdmin,
  updateExamStatusAdmin,
  getSystemSettings,
  updateSystemSetting,
  getAuditLogs,
};
