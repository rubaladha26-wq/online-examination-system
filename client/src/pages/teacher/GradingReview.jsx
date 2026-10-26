import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import {
  ArrowLeft,
  Sparkles,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  User,
  Save,
  Clock,
  Eye,
} from 'lucide-react';

const GradingReview = () => {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Attempt for detailed review
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [gradingForm, setGradingForm] = useState({});
  const [savingGrade, setSavingGrade] = useState(false);

  const { showToast } = useToast();

  const fetchAttemptsData = async () => {
    try {
      setLoading(true);
      const [examRes, attemptsRes] = await Promise.all([
        api.get(`/teacher/exams/${examId}`),
        api.get(`/teacher/exams/${examId}/attempts`),
      ]);

      if (examRes.success) setExam(examRes.data);
      if (attemptsRes.success && attemptsRes.data) {
        setAttempts(attemptsRes.data.attempts || []);
        setResults(attemptsRes.data.results || []);
        if (attemptsRes.data.attempts?.length > 0 && !selectedAttempt) {
          setSelectedAttempt(attemptsRes.data.attempts[0]);
        }
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttemptsData();
  }, [examId]);

  const handleSelectAttempt = (att) => {
    setSelectedAttempt(att);
    // Initialize grading form state for descriptive answers
    const initForm = {};
    att.answers.forEach((a) => {
      const qId = a.question?._id || a.question;
      initForm[qId] = {
        newScore: a.scoreAwarded || (a.aiEvaluation ? a.aiEvaluation.suggestedScore : 0),
        feedback: a.evaluationFeedback || (a.aiEvaluation ? a.aiEvaluation.feedback : ''),
        reason: a.teacherOverride?.reason || 'Verified with syllabus rubric',
      };
    });
    setGradingForm(initForm);
  };

  const handleSaveGrade = async (questionId) => {
    const qData = gradingForm[questionId];
    if (!qData) return;

    try {
      setSavingGrade(true);
      const res = await api.post(`/teacher/attempts/${selectedAttempt._id}/override-grading`, {
        questionId,
        newScore: qData.newScore,
        feedback: qData.feedback,
        reason: qData.reason,
      });

      if (res.success) {
        showToast('Grade updated and recalculated successfully!', 'success');
        // Refresh attempts
        const updatedAttemptsRes = await api.get(`/teacher/exams/${examId}/attempts`);
        if (updatedAttemptsRes.success) {
          setAttempts(updatedAttemptsRes.data.attempts);
          const current = updatedAttemptsRes.data.attempts.find((a) => a._id === selectedAttempt._id);
          if (current) setSelectedAttempt(current);
        }
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingGrade(false);
    }
  };

  if (loading) {
    return <div className="page-wrapper"><p>Loading examination submissions...</p></div>;
  }

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/teacher/exams" className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} /> Back to Examinations
          </Link>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{exam?.title}</h2>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Submissions & AI-Assisted Descriptive Evaluation • Total Marks: {exam?.totalMarks}
            </div>
          </div>
        </div>

        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            api.post(`/teacher/exams/${examId}/release-results`, {})
              .then(() => showToast('Results released to students!', 'success'))
              .catch((err) => showToast(err.message, 'error'));
          }}
        >
          <CheckCircle2 size={16} /> Release All Results
        </button>
      </div>

      {attempts.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ClipboardCheck}
            title="No Submissions Yet"
            description="No students have submitted attempts for this examination so far."
          />
        </div>
      ) : (
        <div className="grid-3" style={{ gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
          {/* Submissions List */}
          <div className="card" style={{ padding: '1rem', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Student Attempts ({attempts.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {attempts.map((att) => {
                const isSelected = selectedAttempt?._id === att._id;
                return (
                  <div
                    key={att._id}
                    onClick={() => handleSelectAttempt(att)}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      border: `1.5px solid ${isSelected ? '#4f46e5' : '#e2e8f0'}`,
                      background: isSelected ? '#eef2ff' : '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                        {att.student?.name || 'Student'}
                      </span>
                      <Badge variant={att.status === 'evaluated' ? 'success' : 'warning'}>
                        {att.status}
                      </Badge>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
                      <span>Score: {att.totalScore} / {exam?.totalMarks} ({att.percentage}%)</span>
                      {att.pendingDescriptiveCount > 0 ? (
                        <span style={{ color: '#d97706', fontWeight: 600 }}>
                          {att.pendingDescriptiveCount} Reviews Pending
                        </span>
                      ) : (
                        <span style={{ color: '#059669', fontWeight: 600 }}>Graded</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grading Evaluation Pane */}
          {selectedAttempt && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Attempt Summary Card */}
              <div
                className="card"
                style={{
                  background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                  color: 'white',
                  padding: '1.25rem 1.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>
                      {selectedAttempt.student?.name}
                    </h3>
                    <div style={{ fontSize: '0.85rem', color: '#c7d2fe' }}>
                      Submitted: {new Date(selectedAttempt.submittedAt || selectedAttempt.updatedAt).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8' }}>
                        {selectedAttempt.totalScore} / {exam?.totalMarks}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Marks</div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: selectedAttempt.isPassed ? '#34d399' : '#f87171' }}>
                        {selectedAttempt.percentage}%
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {selectedAttempt.isPassed ? 'PASSED' : 'NOT PASSED'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Answers Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  Question-by-Question Evaluation & Rubric Review
                </h3>

                {selectedAttempt.answers.map((item, idx) => {
                  const q = item.question;
                  if (!q) return null;

                  const isObjective = [
                    'mcq',
                    'multiple_select',
                    'true_false',
                    'fill_blanks',
                    'match_following',
                    'numerical',
                  ].includes(q.questionType);

                  const formValues = gradingForm[q._id] || {
                    newScore: item.scoreAwarded || 0,
                    feedback: item.evaluationFeedback || '',
                    reason: '',
                  };

                  return (
                    <div key={item._id || idx} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {/* Question Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                          <Badge variant={isObjective ? 'success' : 'warning'}>
                            {isObjective ? 'Auto-Graded' : 'Descriptive Review'}
                          </Badge>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#4f46e5' }}>
                            Score: {item.scoreAwarded} / {item.maxMarks || q.marks}
                          </span>
                        </div>
                      </div>

                      <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b' }}>
                        {q.questionText}
                      </p>

                      {/* Student Submitted Answer */}
                      <div
                        style={{
                          background: '#f8fafc',
                          padding: '0.85rem 1rem',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                          Student's Submitted Answer:
                        </span>
                        <p style={{ marginTop: '0.35rem', fontSize: '0.9rem', color: '#0f172a', whiteSpace: 'pre-wrap' }}>
                          {item.answer ? String(item.answer) : <em style={{ color: '#94a3b8' }}>No answer provided</em>}
                        </p>
                      </div>

                      {/* AI-Assisted Descriptive Grading Block */}
                      {!isObjective && item.aiEvaluation && (
                        <div
                          style={{
                            background: '#f5f3ff',
                            border: '1px solid #ddd6fe',
                            borderRadius: '10px',
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.65rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#7c3aed', fontWeight: 700, fontSize: '0.85rem' }}>
                              <Sparkles size={16} />
                              <span>AI Grading Recommendation</span>
                            </div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6d28d9' }}>
                              Suggested: {item.aiEvaluation.suggestedScore} / {item.maxMarks} Marks (Confidence: {Math.round((item.aiEvaluation.confidence || 0.85) * 100)}%)
                            </span>
                          </div>

                          <p style={{ fontSize: '0.85rem', color: '#4c1d95' }}>
                            {item.aiEvaluation.rubricAssessment}
                          </p>

                          {item.aiEvaluation.missingConcepts?.length > 0 && (
                            <div style={{ fontSize: '0.8rem', color: '#b45309' }}>
                              <strong>Missing Concepts:</strong> {item.aiEvaluation.missingConcepts.join(', ')}
                            </div>
                          )}

                          <div style={{ fontSize: '0.8rem', color: '#5b21b6', fontStyle: 'italic' }}>
                            AI Feedback: "{item.aiEvaluation.feedback}"
                          </div>
                        </div>
                      )}

                      {/* Instructor Score Override & Feedback Form for Descriptive questions */}
                      {!isObjective && (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                            padding: '1rem',
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                          }}
                        >
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>
                            Instructor Final Evaluation & Score Override:
                          </span>

                          <div className="grid-2">
                            <div>
                              <label className="form-label" style={{ fontSize: '0.8rem' }}>Final Score Awarded (Max {item.maxMarks})</label>
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max={item.maxMarks}
                                className="form-control"
                                value={formValues.newScore}
                                onChange={(e) =>
                                  setGradingForm({
                                    ...gradingForm,
                                    [q._id]: { ...formValues, newScore: parseFloat(e.target.value) || 0 },
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="form-label" style={{ fontSize: '0.8rem' }}>Override Reason / Rubric Reference</label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="e.g. Full credit for identifying correct asymptotic recurrence"
                                value={formValues.reason}
                                onChange={(e) =>
                                  setGradingForm({
                                    ...gradingForm,
                                    [q._id]: { ...formValues, reason: e.target.value },
                                  })
                                }
                              />
                            </div>
                          </div>

                          <div>
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Feedback for Student</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Constructive feedback visible to student..."
                              value={formValues.feedback}
                              onChange={(e) =>
                                setGradingForm({
                                  ...gradingForm,
                                  [q._id]: { ...formValues, feedback: e.target.value },
                                })
                              }
                            />
                          </div>

                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={savingGrade}
                            onClick={() => handleSaveGrade(q._id)}
                            style={{ alignSelf: 'flex-end', marginTop: '0.25rem' }}
                          >
                            <Save size={14} /> Confirm Grade
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GradingReview;
