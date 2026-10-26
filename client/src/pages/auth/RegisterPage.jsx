import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Sparkles, Lock, Mail, User, ArrowRight, GraduationCap, Briefcase } from 'lucide-react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    rollNumber: '',
    employeeId: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register(formData);
      showToast('Registration successful! Welcome to ExaminAI.', 'success');
      if (user.role === 'teacher') navigate('/teacher');
      else navigate('/student');
    } catch (err) {
      showToast(err.message || 'Registration failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'rgba(255, 255, 255, 0.98)',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          padding: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <Sparkles size={24} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
            Create Your Account
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Join ExaminAI as a Student or Faculty Member
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Role Selection */}
          <div>
            <label className="form-label">I am registering as:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div
                onClick={() => setFormData({ ...formData, role: 'student' })}
                style={{
                  padding: '0.85rem',
                  borderRadius: '10px',
                  border: `2px solid ${formData.role === 'student' ? '#4f46e5' : '#e2e8f0'}`,
                  background: formData.role === 'student' ? '#eef2ff' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: formData.role === 'student' ? '#4f46e5' : '#475569',
                }}
              >
                <GraduationCap size={18} />
                <span>Student</span>
              </div>

              <div
                onClick={() => setFormData({ ...formData, role: 'teacher' })}
                style={{
                  padding: '0.85rem',
                  borderRadius: '10px',
                  border: `2px solid ${formData.role === 'teacher' ? '#4f46e5' : '#e2e8f0'}`,
                  background: formData.role === 'teacher' ? '#eef2ff' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: formData.role === 'teacher' ? '#4f46e5' : '#475569',
                }}
              >
                <Briefcase size={18} />
                <span>Instructor</span>
              </div>
            </div>
          </div>

          <div>
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="name"
              className="form-control"
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="form-control"
              placeholder="e.g. john@university.edu"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {formData.role === 'student' ? (
            <div>
              <label className="form-label">Student Roll / Registration Number</label>
              <input
                type="text"
                name="rollNumber"
                className="form-control"
                placeholder="e.g. STU-2026-092"
                value={formData.rollNumber}
                onChange={handleChange}
              />
            </div>
          ) : (
            <div>
              <label className="form-label">Employee / Faculty ID</label>
              <input
                type="text"
                name="employeeId"
                className="form-control"
                placeholder="e.g. FAC-CSE-045"
                value={formData.employeeId}
                onChange={handleChange}
              />
            </div>
          )}

          <div>
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-control"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
