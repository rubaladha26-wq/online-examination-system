import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import {
  Award,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';

const ResultDetails = () => {
  const { resultId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchResultDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/student/results/${resultId}`);
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchResultDetails();
  }, [resultId]);

  if (loading) {
    return <div className="page-wrapper"><p>Generating performance diagnostic report...</p></div>;
  }

  const result = data?.result;
  const answers = data?.answers || [];

  if (!result) {
    return <div className="page-wrapper"><p>Result record not found.</p></div>;
  }

  const isPass = result.isPassed;

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link to="/student/results" className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} /> Back to Results
        </Link>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4f46e5', textTransform: 'uppercase' }}>
            Subject: {result.subject?.name} ({result.subject?.code})
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
            {result.exam?.title} Performance Report
          </h2>
        </div>
      </div>

      {/* Hero Performance Card */}
      <div
        className="card"
        style={{
          background: isPass
            ? 'linear-gradient(135deg, #064e3b 0%, #047857 100%)'
            : 'linear-gradient(135deg, #881337 0%, #be123c 100%)',
          color: 'white',
          padding: '2.5rem',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div>
          <span
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              background: 'rgba(255, 255, 255, 0.2)',
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {isPass ? 'Passed with Distinction' : 'Official Evaluation Result'}
          </span>
          <h1 style={{ fontSize: '2.75rem', fontWeight: 900, marginTop: '0.75rem', color: 'white' }}>
            {result.obtainedMarks} <span style={{ fontSize: '1.5rem', fontWeight: 500 }}>/ {result.totalMarks} Marks</span>
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.95rem' }}>
            Percentage: <strong>{result.percentage}%</strong> • Passing Threshold: {result.exam?.passingMarks} Marks
          </p>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(8px)',
            borderRadius: '16px',
            padding: '1.5rem 2rem',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <div style={{ fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', color: 'white' }}>
            Status
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white', marginTop: '0.25rem' }}>
            {isPass ? 'PASS' : 'FAIL'}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid-4">
        <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Total Questions</span>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{result.totalQuestions}</h3>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Correct Answers</span>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669' }}>{result.correctCount}</h3>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Wrong Answers</span>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#dc2626' }}>{result.wrongCount}</h3>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Unanswered</span>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#64748b' }}>{result.unansweredCount}</h3>
        </div>
      </div>

      {/* Topic Mastery & Diagnostic Insights */}
      <div className="grid-2">
        {/* Topic-wise Performance Bars */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} color="#4f46e5" /> Topic-Wise Mastery Breakdown
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {result.topicPerformance && result.topicPerformance.length > 0 ? (
              result.topicPerformance.map((tp, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>
                      Unit {tp.unitNumber}: {tp.topic}
                    </span>
                    <span style={{ fontWeight: 700, color: '#4f46e5' }}>
                      {tp.obtainedMarks} / {tp.totalMarks} ({tp.percentage}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${tp.percentage}%`,
                        height: '100%',
                        background: tp.percentage >= 70 ? '#10b981' : tp.percentage >= 40 ? '#f59e0b' : '#ef4444',
                        borderRadius: '4px',
                        transition: 'width 0.5s ease-out',
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Topic statistics aggregated.</p>
            )}
          </div>
        </div>

        {/* Strengths & Improvement Insights */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card-header">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="#7c3aed" /> Diagnostic Strengths & Recommendations
            </h3>
          </div>

          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
              Demonstrated Strengths (Score ≥ 70%):
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.35rem' }}>
              {(result.strengths || []).map((str, idx) => (
                <Badge key={idx} variant="success">{str}</Badge>
              ))}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase' }}>
              Priority Areas for Improvement (Score &lt; 60%):
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.35rem' }}>
              {(result.areasForImprovement || []).map((impr, idx) => (
                <Badge key={idx} variant="warning">{impr}</Badge>
              ))}
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
              Recommended Study & Revision Strategy:
            </span>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.35rem', fontSize: '0.85rem', color: '#475569' }}>
              {(result.recommendedTopics || []).map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Detailed Question-by-Question Review */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
          Question-by-Question Solution Review & Keys
        </h3>

        {answers.map((item, idx) => {
          const q = item.question;
          if (!q) return null;

          const isFullCredit = item.scoreAwarded === (item.maxMarks || q.marks);

          return (
            <div key={item._id || idx} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Question Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '6px',
                      background: '#4f46e5',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{q.topic}</span>
                  <Badge variant="primary">{q.questionType}</Badge>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Badge variant={isFullCredit ? 'success' : item.scoreAwarded > 0 ? 'warning' : 'danger'}>
                    Score: {item.scoreAwarded} / {item.maxMarks || q.marks}
                  </Badge>
                </div>
              </div>

              <p style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
                {q.questionText}
              </p>

              {/* Your Answer */}
              <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Your Submitted Answer:
                </span>
                <p style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: '#0f172a' }}>
                  {item.answer ? String(item.answer) : <em style={{ color: '#94a3b8' }}>Unanswered</em>}
                </p>
              </div>

              {/* Correct Answer / Model Guideline */}
              {q.correctAnswer && (
                <div style={{ background: '#ecfdf5', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065f46', textTransform: 'uppercase' }}>
                    Authorized Answer Key / Model Solution:
                  </span>
                  <p style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: '#064e3b', fontWeight: 600 }}>
                    {q.correctAnswer}
                  </p>
                </div>
              )}

              {/* Explanation & Rationale */}
              {q.explanation && (
                <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', color: '#475569' }}>
                  <strong style={{ color: '#0f172a' }}>Pedagogical Explanation:</strong> {q.explanation}
                </div>
              )}

              {/* Descriptive Evaluation Feedback if applicable */}
              {item.evaluationFeedback && (
                <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', color: '#5b21b6' }}>
                  <strong>Evaluator Feedback:</strong> {item.evaluationFeedback}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResultDetails;
