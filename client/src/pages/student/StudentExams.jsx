import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { ClipboardList, Play, RotateCcw, Clock, CheckCircle2 } from 'lucide-react';

const StudentExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        const res = await api.get('/student/exams');
        if (res.success) {
          setExams(res.data);
        }
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Examinations Directory</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          View all published examinations, active sessions, and historical records
        </p>
      </div>

      {exams.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ClipboardList}
            title="No Examinations Available"
            description="There are currently no examinations scheduled for your registered subjects."
          />
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Examination</th>
                  <th>Subject</th>
                  <th>Time Window</th>
                  <th>Duration & Marks</th>
                  <th>Attempts</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((ex) => (
                  <tr key={ex._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{ex.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Code: {ex.code}</div>
                    </td>
                    <td>
                      <Badge variant="primary">{ex.subject?.name || 'Subject'}</Badge>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: '#1e293b' }}>
                        {new Date(ex.startDate).toLocaleDateString()} - {new Date(ex.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      {ex.durationMinutes} Mins • {ex.totalMarks} Marks
                      {ex.enableNegativeMarking && (
                        <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>Negative Marking: Active</div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                        {ex.attemptsCount} / {ex.maxAttempts || 1} Used
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {ex.hasActiveAttempt ? (
                        <Link to={`/student/exams/${ex._id}/instructions`} className="btn btn-sm btn-primary" style={{ background: '#d97706', borderColor: '#d97706' }}>
                          <RotateCcw size={14} /> Resume Exam
                        </Link>
                      ) : ex.canAttempt ? (
                        <Link to={`/student/exams/${ex._id}/instructions`} className="btn btn-sm btn-success">
                          <Play size={14} /> Take Exam
                        </Link>
                      ) : ex.attemptsCount > 0 ? (
                        <Link to="/student/results" className="btn btn-sm btn-secondary">
                          <CheckCircle2 size={14} /> Completed
                        </Link>
                      ) : (
                        <Badge variant="secondary">Unavailable</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentExams;
