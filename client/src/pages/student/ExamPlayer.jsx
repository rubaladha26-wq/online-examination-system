import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import ExamTimer from '../../components/exam/ExamTimer';
import QuestionPalette from '../../components/exam/QuestionPalette';
import QuestionRenderer from '../../components/exam/QuestionRenderer';
import Modal from '../../components/common/Modal';
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Send,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';

const ExamPlayer = () => {
  const { attemptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [attemptData, setAttemptData] = useState(location.state?.examData || null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answersMap, setAnswersMap] = useState({});
  const [reviewMap, setReviewMap] = useState({});
  const [savingStatus, setSavingStatus] = useState('saved'); // 'saved' | 'saving' | 'error'
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(!location.state?.examData);

  // Autosave debounce timer
  const autosaveTimeoutRef = useRef(null);

  // Fetch or resume attempt
  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/student/attempts/${attemptId}`);
        if (res.success && res.data) {
          setAttemptData(res.data);
          // Initialize answers map
          const aMap = {};
          const rMap = {};
          (res.data.answers || []).forEach((a) => {
            const qId = a.questionId || a.question;
            aMap[qId] = a.answer;
            rMap[qId] = a.isMarkedForReview || false;
          });
          setAnswersMap(aMap);
          setReviewMap(rMap);
        }
      } catch (err) {
        showToast(err.message, 'error');
        navigate('/student/exams');
      } finally {
        setLoading(false);
      }
    };

    if (!attemptData) {
      fetchAttempt();
    } else {
      const aMap = {};
      const rMap = {};
      (attemptData.answers || []).forEach((a) => {
        const qId = a.questionId || a.question;
        aMap[qId] = a.answer;
        rMap[qId] = a.isMarkedForReview || false;
      });
      setAnswersMap(aMap);
      setReviewMap(rMap);
    }
  }, [attemptId]);

  const questions = attemptData?.questions || [];
  const currentQuestion = questions[currentIndex];
  const currentQId = currentQuestion?._id;

  // Handle Answer Change & trigger autosave
  const handleAnswerChange = (newAnswer) => {
    if (!currentQId) return;

    setAnswersMap((prev) => ({ ...prev, [currentQId]: newAnswer }));
    setSavingStatus('saving');

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.put(`/student/attempts/${attemptId}/answers/${currentQId}`, {
          answer: newAnswer,
          isMarkedForReview: reviewMap[currentQId] || false,
        });
        setSavingStatus('saved');
      } catch (err) {
        setSavingStatus('error');
        console.error('Autosave error:', err);
      }
    }, 400); // 400ms debounce
  };

  // Toggle Mark for Review
  const handleToggleReview = async () => {
    if (!currentQId) return;
    const newStatus = !reviewMap[currentQId];
    setReviewMap((prev) => ({ ...prev, [currentQId]: newStatus }));

    try {
      await api.put(`/student/attempts/${attemptId}/answers/${currentQId}`, {
        answer: answersMap[currentQId],
        isMarkedForReview: newStatus,
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Final Submit Examination
  const handleSubmitExam = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.post(`/student/attempts/${attemptId}/submit`, {});
      if (res.success) {
        showToast('Examination submitted successfully!', 'success');
        setIsSubmitModalOpen(false);
        navigate('/student/results');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // On Timer Expiration (server-authoritative)
  const handleTimerExpire = () => {
    showToast('Authoritative exam timer has expired. Auto-submitting answers...', 'warning');
    handleSubmitExam();
  };

  if (loading || !attemptData) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <p>Loading secure examination session...</p>
      </div>
    );
  }

  // Answered / Review metrics for confirmation dialog
  const answersList = questions.map((q) => ({
    questionId: q._id,
    answer: answersMap[q._id],
    isMarkedForReview: reviewMap[q._id],
  }));

  const answeredCount = answersList.filter(
    (a) =>
      a.answer !== null &&
      a.answer !== undefined &&
      a.answer !== '' &&
      !(Array.isArray(a.answer) && a.answer.length === 0)
  ).length;

  const unansweredCount = questions.length - answeredCount;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Exam Header */}
      <header
        style={{
          height: '70px',
          background: '#ffffff',
          borderBottom: '1.5px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              {attemptData.exam?.title}
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Attempt #{attemptData.attemptNumber} • Code: {attemptData.exam?.code}
            </span>
          </div>
        </div>

        {/* Server Authoritative Timer & Autosave Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: savingStatus === 'saving' ? '#f59e0b' : '#10b981',
                animation: savingStatus === 'saving' ? 'pulse 1s infinite' : 'none',
              }}
            />
            <span style={{ color: '#64748b', fontWeight: 500 }}>
              {savingStatus === 'saving' ? 'Saving...' : 'All answers autosaved'}
            </span>
          </div>

          <ExamTimer
            deadline={attemptData.endTimeDeadline}
            onExpire={handleTimerExpire}
          />

          <button
            className="btn btn-primary btn-sm"
            style={{ background: '#059669', borderColor: '#059669' }}
            onClick={() => setIsSubmitModalOpen(true)}
          >
            <Send size={15} /> Submit Exam
          </button>
        </div>
      </header>

      {/* Main Examination Body */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: '2rem',
          padding: '2rem',
          maxWidth: '1440px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* Left Column: Active Question Workspace */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '2rem', minHeight: '480px' }}>
            <QuestionRenderer
              question={currentQuestion}
              questionNumber={currentIndex + 1}
              currentAnswer={answersMap[currentQId]}
              onChangeAnswer={handleAnswerChange}
            />
          </div>

          {/* Player Navigation Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#ffffff',
              padding: '1rem 1.5rem',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
            }}
          >
            <button
              type="button"
              className={`btn ${reviewMap[currentQId] ? 'btn-primary' : 'btn-secondary'}`}
              style={
                reviewMap[currentQId]
                  ? { background: '#7c3aed', borderColor: '#7c3aed' }
                  : {}
              }
              onClick={handleToggleReview}
            >
              <Bookmark size={16} />
              <span>{reviewMap[currentQId] ? 'Marked for Review' : 'Mark for Review'}</span>
            </button>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              >
                <ChevronLeft size={16} /> Previous
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                >
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => setIsSubmitModalOpen(true)}
                >
                  Submit Examination <Send size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Question Palette & Progress */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <QuestionPalette
            questions={questions}
            answers={answersList}
            currentIndex={currentIndex}
            onSelectIndex={(idx) => setCurrentIndex(idx)}
          />

          <div
            className="card"
            style={{
              background: '#f8fafc',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              fontSize: '0.82rem',
              color: '#64748b',
            }}
          >
            <div style={{ fontWeight: 700, color: '#334155' }}>Exam Integrity Notice</div>
            <p>
              Your answers are securely recorded on the server with timestamps. Negative marking is active if configured.
            </p>
          </div>
        </div>
      </div>

      {/* Final Submit Confirmation Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => !isSubmitting && setIsSubmitModalOpen(false)}
        title="Submit Examination Confirmation"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              Are you sure you want to finish and submit?
            </h4>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.25rem' }}>
              Once submitted, your answers will be locked and graded.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem',
              background: '#f8fafc',
              padding: '1rem',
              borderRadius: '10px',
              textAlign: 'center',
            }}
          >
            <div style={{ borderRight: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>
                {answeredCount}
              </span>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Answered Questions</div>
            </div>

            <div>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: unansweredCount > 0 ? '#dc2626' : '#64748b' }}>
                {unansweredCount}
              </span>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Unanswered Questions</div>
            </div>
          </div>

          {unansweredCount > 0 && (
            <div
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                color: '#b45309',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertTriangle size={16} />
              <span>You have {unansweredCount} unanswered questions remaining.</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={isSubmitting}
              onClick={() => setIsSubmitModalOpen(false)}
            >
              Return to Exam
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={isSubmitting}
              onClick={handleSubmitExam}
              style={{ background: '#059669', borderColor: '#059669' }}
            >
              {isSubmitting ? 'Evaluating & Submitting...' : 'Yes, Submit Examination'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ExamPlayer;
