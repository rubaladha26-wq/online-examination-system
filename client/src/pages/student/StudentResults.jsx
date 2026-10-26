import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { Award, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

const StudentResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await api.get('/student/results');
        if (res.success) {
          setResults(res.data);
        }
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>My Examination Results</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Official grades, topic mastery analytics, and question-by-question review keys
        </p>
      </div>

      {results.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Award}
            title="No Results Released Yet"
            description="Results will be published here once authorized by your instructor or upon exam conclusion."
          />
        </div>
      ) : (
        <div className="grid-2">
          {results.map((r) => (
            <div
              key={r._id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                borderTop: `4px solid ${r.isPassed ? '#10b981' : '#ef4444'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                  {r.subject?.name} ({r.subject?.code})
                </span>
                <Badge variant={r.isPassed ? 'success' : 'danger'}>
                  {r.isPassed ? 'PASSED' : 'NEEDS IMPROVEMENT'}
                </Badge>
              </div>

              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
                  {r.exam?.title}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Released: {new Date(r.releasedAt || r.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  background: '#f8fafc',
                  borderRadius: '8px',
                }}
              >
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#4f46e5' }}>
                  {r.obtainedMarks}
                </span>
                <span style={{ fontSize: '1rem', color: '#64748b' }}>
                  / {r.totalMarks} Marks ({r.percentage}%)
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                <span>Solved: {r.attemptedCount} / {r.totalQuestions}</span>
                <span>Correct: {r.correctCount}</span>
                <span>Wrong: {r.wrongCount}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <Link to={`/student/results/${r._id}`} className="btn btn-primary btn-sm">
                  View Full Topic Breakdown & Solutions <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentResults;
