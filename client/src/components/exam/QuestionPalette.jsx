import React from 'react';
import { Bookmark, CheckCircle2, Circle } from 'lucide-react';

const QuestionPalette = ({
  questions,
  answers,
  currentIndex,
  onSelectIndex,
}) => {
  const getQuestionStatus = (qId) => {
    const ans = answers.find((a) => (a.questionId || a.question) === qId);
    if (!ans) return 'unanswered';

    const hasAnswer =
      ans.answer !== null &&
      ans.answer !== undefined &&
      ans.answer !== '' &&
      !(Array.isArray(ans.answer) && ans.answer.length === 0);

    if (ans.isMarkedForReview) return 'review';
    if (hasAnswer) return 'answered';
    return 'unanswered';
  };

  const answeredCount = questions.filter(
    (q) => getQuestionStatus(q._id) === 'answered'
  ).length;

  const reviewCount = questions.filter(
    (q) => getQuestionStatus(q._id) === 'review'
  ).length;

  const unansweredCount = questions.length - answeredCount - reviewCount;

  return (
    <div
      className="card"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        background: '#ffffff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
          Question Palette
        </h4>
        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      {/* Status Legends */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem',
          fontSize: '0.75rem',
          fontWeight: 600,
          padding: '0.6rem',
          background: '#f8fafc',
          borderRadius: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#059669' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
          <span>{answeredCount} Solved</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#7c3aed' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#8b5cf6' }} />
          <span>{reviewCount} Review</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#cbd5e1' }} />
          <span>{unansweredCount} Left</span>
        </div>
      </div>

      {/* Question Number Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '0.5rem',
          maxHeight: '340px',
          overflowY: 'auto',
          padding: '2px',
        }}
      >
        {questions.map((q, idx) => {
          const status = getQuestionStatus(q._id);
          const isCurrent = currentIndex === idx;

          let btnBg = '#f1f5f9';
          let textColor = '#475569';
          let borderColor = '#e2e8f0';

          if (status === 'answered') {
            btnBg = '#ecfdf5';
            textColor = '#059669';
            borderColor = '#10b981';
          } else if (status === 'review') {
            btnBg = '#f5f3ff';
            textColor = '#7c3aed';
            borderColor = '#8b5cf6';
          }

          if (isCurrent) {
            borderColor = '#4f46e5';
            btnBg = '#4f46e5';
            textColor = '#ffffff';
          }

          return (
            <button
              key={q._id}
              onClick={() => onSelectIndex(idx)}
              style={{
                height: '42px',
                borderRadius: '8px',
                border: `2px solid ${borderColor}`,
                background: btnBg,
                color: textColor,
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
            >
              {idx + 1}
              {status === 'review' && !isCurrent && (
                <div
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#8b5cf6',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionPalette;
