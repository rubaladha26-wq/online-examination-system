import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import { Calendar, AlertOctagon, CheckCircle2 } from 'lucide-react';

const ExamOversight = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/exams');
      if (res.success) {
        setExams(res.data);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleStatusChange = async (examId, newStatus) => {
    try {
      const res = await api.patch(`/admin/exams/${examId}/status`, {
        status: newStatus,
        reason: 'Administrative override from control panel',
      });
      if (res.success) {
        showToast(res.message, 'success');
        fetchExams();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Examination Oversight</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Monitor system-wide examination schedules, states, and administrative interventions
        </p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Examination Title</th>
                <th>Subject & Creator</th>
                <th>Time Window</th>
                <th>Duration & Marks</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Admin Override</th>
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
                    <div style={{ fontSize: '0.9rem', color: '#1e293b' }}>{ex.subject?.name || 'N/A'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>By: {ex.createdBy?.name || 'Faculty'}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem' }}>
                      {new Date(ex.startDate).toLocaleDateString()} - {new Date(ex.endDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    {ex.durationMinutes} mins • {ex.totalMarks} Marks
                  </td>
                  <td>
                    <Badge
                      variant={
                        ex.status === 'published'
                          ? 'success'
                          : ex.status === 'completed'
                          ? 'primary'
                          : ex.status === 'cancelled'
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {ex.status}
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {ex.status !== 'cancelled' ? (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleStatusChange(ex._id, 'cancelled')}
                        style={{ fontSize: '0.75rem' }}
                      >
                        Cancel Exam
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleStatusChange(ex._id, 'published')}
                        style={{ fontSize: '0.75rem' }}
                      >
                        Re-Publish
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExamOversight;
