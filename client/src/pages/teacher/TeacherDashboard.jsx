import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import {
  BookOpen,
  FileText,
  Sparkles,
  Database,
  CalendarCheck,
  ClipboardCheck,
  Upload,
  ArrowRight,
} from 'lucide-react';

const TeacherDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/teacher/dashboard');
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
    return (
      <div className="page-wrapper">
        <p>Loading instructor workspace...</p>
      </div>
    );
  }

  const counts = data?.counts || {};
  const recentAttempts = data?.recentAttempts || [];
  const assignedSubjects = data?.assignedSubjects || [];

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 100%)',
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
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Faculty & Curriculum Portal
          </span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem', color: '#ffffff' }}>
            AI Examination & Question Synthesis
          </h2>
          <p style={{ color: '#e0e7ff', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Upload syllabus documents, generate Bloom-grounded questions, review drafts, and evaluate student submissions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/teacher/syllabuses" className="btn btn-secondary btn-sm" style={{ background: 'white', color: '#312e81' }}>
            <Upload size={16} /> Upload Syllabus
          </Link>
          <Link to="/teacher/ai-generator" className="btn btn-primary btn-sm" style={{ background: '#7c3aed', borderColor: '#7c3aed' }}>
            <Sparkles size={16} /> AI Question Generator
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid-4">
        <StatCard
          title="Assigned Subjects"
          value={counts.subjects || 0}
          icon={BookOpen}
          color="#4f46e5"
          subtext="Active teaching courses"
        />
        <StatCard
          title="Uploaded Syllabuses"
          value={counts.syllabuses || 0}
          icon={FileText}
          color="#0ea5e9"
          subtext="Extracted into units"
        />
        <StatCard
          title="Question Bank"
          value={counts.totalQuestions || 0}
          icon={Database}
          color="#10b981"
          subtext={`${counts.draftQuestions || 0} awaiting review`}
        />
        <StatCard
          title="Descriptive Reviews"
          value={counts.pendingDescriptiveReviews || 0}
          icon={ClipboardCheck}
          color="#f59e0b"
          subtext="AI grading suggestions ready"
        />
      </div>

      <div className="grid-2">
        {/* Assigned Subjects Overview */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>My Assigned Subjects</h3>
            <Link to="/teacher/syllabuses" className="btn btn-secondary btn-sm">
              Manage Syllabuses
            </Link>
          </div>

          {assignedSubjects.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No subjects assigned yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {assignedSubjects.map((sub) => (
                <div
                  key={sub._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    background: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{sub.name}</span>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Code: {sub.code} • Semester {sub.semester} • {sub.credits} Credits
                    </div>
                  </div>
                  <Link to="/teacher/ai-generator" className="btn btn-outline-primary btn-sm">
                    <Sparkles size={14} /> Generate
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Submissions */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Submissions</h3>
            <Link to="/teacher/exams" className="btn btn-secondary btn-sm">
              All Exams
            </Link>
          </div>

          {recentAttempts.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No submissions yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentAttempts.map((att) => (
                <div
                  key={att._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    background: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>
                      {att.student?.name || 'Student'}
                    </span>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {att.exam?.title} • Score: {att.totalScore} / {att.exam?.totalMarks}
                    </div>
                  </div>
                  <Badge variant={att.status === 'evaluated' ? 'success' : 'warning'}>
                    {att.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
