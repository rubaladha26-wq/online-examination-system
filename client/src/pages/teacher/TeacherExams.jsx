import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import {
  CalendarCheck,
  Plus,
  Play,
  ClipboardList,
  Download,
  Share2,
  CheckCircle2,
} from 'lucide-react';

const TeacherExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teacher/exams');
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

  const handlePublish = async (examId) => {
    try {
      const res = await api.post(`/teacher/exams/${examId}/publish`, {});
      if (res.success) {
        showToast('Examination published successfully! Students can now access it.', 'success');
        fetchExams();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleReleaseResults = async (examId) => {
    try {
      const res = await api.post(`/teacher/exams/${examId}/release-results`, {});
      if (res.success) {
        showToast('Examination results released to students!', 'success');
        fetchExams();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleExportCSV = (examId, title) => {
    const token = localStorage.getItem('token');
    const url = `/api/teacher/exams/${examId}/export-csv`;

    // Download via fetch with auth header
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${title.replace(/\s+/g, '_')}_results.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast('CSV Export downloaded successfully', 'success');
      })
      .catch((err) => showToast('Failed to export CSV: ' + err.message, 'error'));
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Manage Examinations</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Publish examinations, view student attempts, conduct AI-assisted grading, and release scores
          </p>
        </div>

        <Link to="/teacher/create-exam" className="btn btn-primary">
          <Plus size={18} /> Create New Examination
        </Link>
      </div>

      {exams.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={CalendarCheck}
            title="No Examinations Created Yet"
            description="Create your first online examination using approved questions from your syllabus question bank."
            action={
              <Link to="/teacher/create-exam" className="btn btn-primary">
                <Plus size={16} /> Create Examination
              </Link>
            }
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
                  <th>Schedule Window</th>
                  <th>Questions & Marks</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((ex) => (
                  <tr key={ex._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{ex.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Code: {ex.code} • Duration: {ex.durationMinutes} mins
                      </div>
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
                      <div style={{ fontWeight: 600, color: '#4f46e5' }}>
                        {ex.questions?.length || 0} Questions
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {ex.totalMarks} Marks (Pass: {ex.passingMarks})
                      </div>
                    </td>
                    <td>
                      <Badge
                        variant={
                          ex.status === 'published'
                            ? 'success'
                            : ex.status === 'completed'
                            ? 'primary'
                            : 'warning'
                        }
                      >
                        {ex.status}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {ex.status === 'draft' && (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handlePublish(ex._id)}
                            title="Publish exam so students can attend"
                          >
                            <Play size={13} /> Publish
                          </button>
                        )}

                        <Link
                          to={`/teacher/exams/${ex._id}/grading`}
                          className="btn btn-sm btn-secondary"
                          title="View student attempts and AI grading"
                        >
                          <ClipboardList size={13} /> Submissions
                        </Link>

                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleReleaseResults(ex._id)}
                          title="Release final results to students"
                        >
                          <Share2 size={13} /> Release Results
                        </button>

                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleExportCSV(ex._id, ex.title)}
                          title="Export CSV gradebook"
                        >
                          <Download size={13} /> CSV
                        </button>
                      </div>
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

export default TeacherExams;
