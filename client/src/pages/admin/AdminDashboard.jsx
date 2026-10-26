import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import {
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Database,
  Award,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/admin/dashboard');
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
        <p>Loading administrative telemetry...</p>
      </div>
    );
  }

  const counts = data?.counts || {};
  const upcoming = data?.upcomingExams || [];
  const logs = data?.recentLogs || [];

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          borderRadius: '16px',
          padding: '2rem',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            System Administration Center
          </span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.35rem', color: '#ffffff' }}>
            ExaminAI Global Control Center
          </h2>
          <p style={{ color: '#c7d2fe', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Multi-tenant examination oversight, syllabus AI monitoring, and academic telemetry.
          </p>
        </div>
        <Link to="/admin/settings" className="btn btn-secondary btn-sm" style={{ background: 'white', color: '#1e1b4b' }}>
          Configure AI Models
        </Link>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid-4">
        <StatCard
          title="Total Students"
          value={counts.totalStudents || 0}
          icon={GraduationCap}
          color="#4f46e5"
          subtext="Enrolled across all programs"
        />
        <StatCard
          title="Total Instructors"
          value={counts.totalTeachers || 0}
          icon={Users}
          color="#0ea5e9"
          subtext="Active academic faculty"
        />
        <StatCard
          title="Live Examinations"
          value={counts.totalExams || 0}
          icon={CalendarCheck}
          color="#8b5cf6"
          subtext="Created and scheduled"
        />
        <StatCard
          title="Questions in Bank"
          value={counts.totalQuestions || 0}
          icon={Database}
          color="#10b981"
          subtext="AI-generated & approved"
        />
      </div>

      <div className="grid-2">
        {/* Upcoming Examinations Card */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Upcoming Examinations</h3>
            <Link to="/admin/exams" className="btn btn-secondary btn-sm">
              View All <ArrowUpRight size={14} />
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>
              No upcoming scheduled examinations.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Examination</th>
                    <th>Subject</th>
                    <th>Start Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((ex) => (
                    <tr key={ex._id}>
                      <td style={{ fontWeight: 600 }}>{ex.title}</td>
                      <td>{ex.subject?.name || 'N/A'}</td>
                      <td>{new Date(ex.startDate).toLocaleDateString()}</td>
                      <td>
                        <Badge variant="primary">{ex.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Live System Audit Feed */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} color="#4f46e5" /> System Audit Trail
            </h3>
            <Link to="/admin/audit-logs" className="btn btn-secondary btn-sm">
              Full Logs
            </Link>
          </div>

          {logs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No activity logged yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {logs.slice(0, 6).map((log) => (
                <div
                  key={log._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, color: '#334155' }}>
                      {log.action}
                    </span>
                    <span style={{ color: '#64748b', marginLeft: '0.5rem' }}>
                      by {log.user?.name || 'System'}
                    </span>
                  </div>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
