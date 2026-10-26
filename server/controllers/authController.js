const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const TeacherProfile = require('../models/TeacherProfile');
const AuditLog = require('../models/AuditLog');
const { generateToken } = require('../utils/token');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get token
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, 'Please provide both email and password.');
    }

    // Check for user (include password field)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return errorResponse(res, 401, 'Invalid email or password.');
    }

    if (!user.isActive) {
      return errorResponse(res, 403, 'Account deactivated. Please contact the administrator.');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid email or password.');
    }

    // Update lastLogin
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate JWT
    const token = generateToken(user._id, user.role);

    // Audit log
    await AuditLog.create({
      user: user._id,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user._id.toString(),
      details: { email: user.email, role: user.role },
      ipAddress: req.ip || '',
      userAgent: req.get('User-Agent') || '',
    });

    return successResponse(res, 200, 'Login successful', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/register
 * @desc    Public registration (Admin role strictly prohibited)
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, rollNumber, employeeId } = req.body;

    // Enforce security: Public registration can NEVER register as Admin
    if (role === 'admin') {
      return errorResponse(res, 403, 'Administrative accounts cannot be self-registered.');
    }

    const selectedRole = role === 'teacher' ? 'teacher' : 'student';

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse(res, 409, 'An account with this email already exists.');
    }

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: selectedRole,
    });

    if (selectedRole === 'student') {
      await StudentProfile.create({
        user: newUser._id,
        rollNumber: rollNumber || `STU-${Date.now().toString().slice(-6)}`,
      });
    } else {
      await TeacherProfile.create({
        user: newUser._id,
        employeeId: employeeId || `FAC-${Date.now().toString().slice(-6)}`,
      });
    }

    const token = generateToken(newUser._id, newUser.role);

    return successResponse(res, 201, 'Account registered successfully', {
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user profile
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    let profile = null;

    if (user.role === 'student') {
      profile = await StudentProfile.findOne({ user: user._id })
        .populate('department')
        .populate('course')
        .populate('batch');
    } else if (user.role === 'teacher') {
      profile = await TeacherProfile.findOne({ user: user._id })
        .populate('department')
        .populate('assignedSubjects');
    }

    return successResponse(res, 200, 'User profile fetched', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
      profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (logs event)
 */
const logout = async (req, res) => {
  return successResponse(res, 200, 'Logged out successfully');
};

module.exports = {
  login,
  register,
  getMe,
  logout,
};
