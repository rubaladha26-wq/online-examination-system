import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import {
  ShieldAlert,
  Clock,
  Award,
  AlertTriangle,
  Play,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

const ExamInstructions = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [starting, setStarting] = useState(false);
  const [loading, setLoading] = useState(true);

  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInstructions = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/student/exams/${id}/instructions`);
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchInstructions();
  }, [id]);

  const handleStartExam = async () => {
    if (!agreed) {
      showToast('You must confirm agreement to the instructions to proceed.', 'warning');
      return;
    }

    setStarting(true);
    try {
      const res = await api.post(`/student/exams/${id}/start`, {});
      if (res.success && res.data) {
        showToast('Examination started. Good luck!', 'success');
        navigate(`/student/player/${res.data.attemptId}`, { state: { examData: res.data } });
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return <div className="page-wrapper"><p>Loading examination rules and guidelines...</p></div>;
  }

  const exam = data?.exam;
  if (!exam) {
    return <div className="page-wrapper"><p>Examination not found.</p></div>;
  }

  return (
    <div className="page-wrapper" style={{ maxWidth: '850px' }}>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', padding: '2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
          <Link to="/student/exams" className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} /> Back
          </Link>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4f46e5', textTransform: 'uppercase' }}>
              Subject: {exam.subject?.name} ({exam.subject?.code})
            </span>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
              {exam.title}
            </h2>
          </div>
        </div>

        {/* Exam Vital Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            background: '#f8fafc',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block' }}>Duration</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{exam.durationMinutes} Mins</span>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block' }}>Total Marks</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#4f46e5' }}>{exam.totalMarks}</span>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block' }}>Passing Marks</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#059669' }}>{exam.passingMarks}</span>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block' }}>Attempts Left</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#d97706' }}>{data.attemptsRemaining}</span>
          </div>
        </div>

        {/* Negative Marking Alert */}
        {exam.enableNegativeMarking && (
          <div
            style={{
              background: '#fef2f2',
              border: '1.5px solid #fecaca',
              padding: '1rem',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#991b1b',
              fontSize: '0.9rem',
            }}
          >
            <AlertTriangle size={20} color="#dc2626" style={{ flexShrink: 0 }} />
            <div>
              <strong>Negative Marking is Enabled:</strong> An incorrect answer on objective questions will deduct{' '}
              {Math.round((exam.negativeMarkingPenalty || 0.25) * 100)}% of the question's marks. Unanswered questions will receive 0 marks without penalty.
            </div>
          </div>
        )}

        {/* Rules & Guidelines */}
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>
            Authoritative Rules & System Guidelines:
          </h3>
          <ul
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              fontSize: '0.92rem',
              color: '#334155',
              paddingLeft: '1.25rem',
              lineHeight: 1.6,
            }}
          >
            <li>
              <strong>Server-Authoritative Timing:</strong> The countdown clock is enforced strictly by the backend server. When time expires, your answers will be automatically submitted immediately.
            </li>
            <li>
              <strong>Real-time Answer Autosave:</strong> Your selections and written responses are saved incrementally to the database. If you accidentally reload the browser, your saved answers will be restored.
            </li>
            <li>
              <strong>Question Navigation Palette:</strong> You can mark questions for review and jump between questions freely using the question palette.
            </li>
            <li>
              <strong>Evaluation Protocol:</strong> Objective questions are evaluated instantly upon submission. Descriptive answers are assessed via syllabus-grounded AI rubrics with instructor oversight.
            </li>
          </ul>
        </div>

        {/* Instructor Specific Instructions */}
        {exam.instructions && (
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
              Instructor Notes:
            </span>
            <p style={{ marginTop: '0.35rem', fontSize: '0.9rem', color: '#1e293b', whiteSpace: 'pre-wrap' }}>
              {exam.instructions}
            </p>
          </div>
        )}

        {/* Agreement Checkbox */}
        <div
          style={{
            background: agreed ? '#ecfdf5' : '#f8fafc',
            border: `2px solid ${agreed ? '#059669' : '#cbd5e1'}`,
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onClick={() => setAgreed(!agreed)}
        >
          <input
            type="checkbox"
            checked={agreed}
            onChange={() => {}}
            style={{ width: 18, height: 18, cursor: 'pointer' }}
          />
          <span style={{ fontWeight: 600, fontSize: '0.92rem', color: agreed ? '#065f46' : '#1e293b' }}>
            I confirm that I have read and agree to follow all examination rules and code of conduct.
          </span>
        </div>

        {/* Action Button */}
        <button
          type="button"
          className="btn btn-primary btn-lg"
          disabled={!agreed || starting}
          onClick={handleStartExam}
          style={{
            background: agreed ? 'linear-gradient(135deg, #059669, #10b981)' : '#94a3b8',
            borderColor: agreed ? '#059669' : '#94a3b8',
            fontSize: '1.1rem',
            padding: '1rem',
          }}
        >
          <Play size={20} />
          {starting ? 'Initializing Session...' : 'Begin Examination Session'}
        </button>
      </div>
    </div>
  );
};

export default ExamInstructions;
