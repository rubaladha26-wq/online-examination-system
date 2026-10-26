const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require admin role
router.use(protect, authorize('admin'));

router.get('/dashboard', getAdminDashboard);

// User Management
router.get('/users', getUsers);
router.post('/users', createUser);
router.patch('/users/:id/toggle-status', toggleUserStatus);

// Academic Management
router.get('/departments', getDepartments);
router.post('/departments', createDepartment);
router.get('/courses', getCourses);
router.post('/courses', createCourse);
router.get('/batches', getBatches);
router.post('/batches', createBatch);
router.get('/subjects', getSubjects);
router.post('/subjects', createSubject);
router.post('/subjects/:id/assign-teacher', assignTeacherToSubject);

// Examination Oversight
router.get('/exams', getAllExamsAdmin);
router.patch('/exams/:id/status', updateExamStatusAdmin);

// System Configuration & Logs
router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSetting);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
