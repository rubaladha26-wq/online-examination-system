import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import {
  ClipboardList,
  Calendar,
  Award,
  Play,
  RotateCcw,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/student/dashboard');
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="page-wrapper"><p>Loading student assessment portal...</p></div>;
  }

  const counts = data?.counts || {};
  const availableExams = data?.availableExams || [];
  const upcomingExams = data?.upcomingExams || [];
  const activeAttempts = data?.activeAttempts || [];
  const recentResults = data?.recentResults || [];

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
          borderRadius: '16px',
          padding: '2rem',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Student Examination Portal
          </span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem', color: '#ffffff' }}>
            Welcome to Online Assessments
          </h2>
          <p style={{ color: '#d1fae5', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Take scheduled examinations, monitor authoritative timers, and review detailed diagnostic analytics.
          </p>
        </div>

        <Link
          to="/student/exams"
          className="btn btn-secondary btn-sm"
          style={{ background: 'white', color: '#064e3b', fontWeight: 700 }}
        >
          <ClipboardList size={16} /> View All Examinations
        </Link>
      </div>

      {/* KPI Grid */}
      <div className="grid-4">
        <StatCard
          title="Available Examinations"
          value={counts.availableExams || 0}
          icon={ClipboardList}
          color="#059669"
          subtext="Ready to take now"
        />
        <StatCard
          title="Upcoming Examinations"
          value={counts.upcomingExams || 0}
          icon={Calendar}
          color="#0ea5e9"
          subtext="Scheduled on calendar"
        />
        <StatCard
          title="Completed Exams"
          value={counts.completedExams || 0}
          icon={Award}
          color="#8b5cf6"
          subtext="Submitted attempts"
        />
        <StatCard
          title="Average Score"
          value={`${counts.averageScore || 0}%`}
          icon={Sparkles}
          color="#f59e0b"
          subtext="Across released results"
        />
      </div>

      {/* Active In-Progress Banner if any */}
      {activeAttempts.length > 0 && (
        <div
          style={{
            background: '#fffbeb',
            border: '2px solid #f59e0b',
            borderRadius: '14px',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d97706',
              }}
            >
              <Clock size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#92400e' }}>
                You Have an Active In-Progress Examination!
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#b45309' }}>
                {activeAttempts[0].exam?.title} • Deadline: {new Date(activeAttempts[0].endTimeDeadline).toLocaleTimeString()}
              </p>
            </div>
          </div>

          <Link
            to={`/student/player/${activeAttempts[0]._id}`}
            className="btn btn-primary"
            style={{ background: '#d97706', borderColor: '#d97706' }}
          >
            <RotateCcw size={16} /> Resume Examination
          </Link>
        </div>
      )}

      {/* Available Examinations Cards */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            Available Examinations Ready to Take
          </h3>
          <Link to="/student/exams" className="btn btn-secondary btn-sm">
            All Examinations
          </Link>
        </div>

        {availableExams.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>
            No examinations are currently open for taking. Check upcoming schedule below.
          </p>
        ) : (
          <div className="grid-2">
            {availableExams.map((ex) => (
              <div
                key={ex._id}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Badge variant="primary">{ex.subject?.name || 'Subject'}</Badge>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                    {ex.durationMinutes} Minutes
                  </span>
                </div>

                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  {ex.title}
                </h4>

                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Total Marks: <strong>{ex.totalMarks}</strong> • Passing: <strong>{ex.passingMarks}</strong>
                  {ex.enableNegativeMarking && ' • Negative Marking: Yes'}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <Link to={`/student/exams/${ex._id}/instructions`} className="btn btn-success btn-sm">
                    <Play size={14} /> Start Examination
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Results */}
      {recentResults.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              Recent Examination Results
            </h3>
            <Link to="/student/results" className="btn btn-secondary btn-sm">
              All Results
            </Link>
          </div>

          <div className="grid-3">
            {recentResults.map((r) => (
              <div
                key={r._id}
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                    {r.exam?.title}
                  </span>
                  <Badge variant={r.isPassed ? 'success' : 'danger'}>
                    {r.isPassed ? 'PASS' : 'FAIL'}
                  </Badge>
                </div>

                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4f46e5' }}>
                  {r.obtainedMarks} / {r.totalMarks} ({r.percentage}%)
                </div>

                <Link
                  to={`/student/results/${r._id}`}
                  style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4f46e5', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}
                >
                  View Topic Breakdown & Explanations <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
