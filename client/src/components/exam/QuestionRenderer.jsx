import React from 'react';
import Badge from '../common/Badge';
import { BookOpen, HelpCircle } from 'lucide-react';

const QuestionRenderer = ({
  question,
  questionNumber,
  currentAnswer,
  onChangeAnswer,
}) => {
  if (!question) return null;

  const {
    questionText,
    questionType,
    difficulty,
    cognitiveLevel,
    marks,
    options = [],
    matchPairs = [],
    caseStudyContext,
    topic,
  } = question;

  const handleMCQSelect = (optId) => {
    onChangeAnswer(optId);
  };

  const handleMultiSelect = (optId) => {
    const currentList = Array.isArray(currentAnswer) ? currentAnswer : [];
    if (currentList.includes(optId)) {
      onChangeAnswer(currentList.filter((id) => id !== optId));
    } else {
      onChangeAnswer([...currentList, optId]);
    }
  };

  const handleMatchChange = (leftText, rightText) => {
    const currentMatches = typeof currentAnswer === 'object' && currentAnswer !== null ? { ...currentAnswer } : {};
    currentMatches[leftText] = rightText;
    onChangeAnswer(currentMatches);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Question Header & Badges */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              background: '#4f46e5',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.9rem',
            }}
          >
            {questionNumber}
          </span>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>
            Topic: <span style={{ color: '#0f172a' }}>{topic || 'General'}</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Badge variant={difficulty === 'hard' ? 'danger' : difficulty === 'medium' ? 'warning' : 'success'}>
            {difficulty}
          </Badge>
          <Badge variant="secondary">
            Bloom: {cognitiveLevel}
          </Badge>
          <Badge variant="primary">
            {marks} {marks === 1 ? 'Mark' : 'Marks'}
          </Badge>
        </div>
      </div>

      {/* Case Study Reading Context */}
      {caseStudyContext && (
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4338ca', fontWeight: 700, fontSize: '0.875rem' }}>
            <BookOpen size={16} />
            <span>Case Study Context</span>
          </div>
          <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.6 }}>
            {caseStudyContext}
          </p>
        </div>
      )}

      {/* Question Text */}
      <div>
        <h3
          style={{
            fontSize: '1.2rem',
            fontWeight: 600,
            color: '#0f172a',
            lineHeight: 1.5,
          }}
        >
          {questionText}
        </h3>
      </div>

      {/* Answer Form Elements based on questionType */}
      <div style={{ marginTop: '0.5rem' }}>
        {/* 1. Multiple Choice Questions (MCQ) */}
        {questionType === 'mcq' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {options.map((opt) => {
              const isSelected = currentAnswer === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => handleMCQSelect(opt.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem 1.25rem',
                    borderRadius: '12px',
                    border: `1.5px solid ${isSelected ? '#4f46e5' : '#e2e8f0'}`,
                    background: isSelected ? '#eef2ff' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      border: `2px solid ${isSelected ? '#4f46e5' : '#cbd5e1'}`,
                      background: isSelected ? '#4f46e5' : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.95rem', color: '#1e293b' }}>
                    <span style={{ fontWeight: 700, color: isSelected ? '#4f46e5' : '#64748b' }}>
                      {opt.id}.
                    </span>
                    <span>{opt.text}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 2. Multiple Select Questions */}
        {questionType === 'multiple_select' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', marginBottom: '0.25rem' }}>
              Select all options that apply:
            </span>
            {options.map((opt) => {
              const selectedList = Array.isArray(currentAnswer) ? currentAnswer : [];
              const isSelected = selectedList.includes(opt.id);
              return (
                <div
                  key={opt.id}
                  onClick={() => handleMultiSelect(opt.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem 1.25rem',
                    borderRadius: '12px',
                    border: `1.5px solid ${isSelected ? '#4f46e5' : '#e2e8f0'}`,
                    background: isSelected ? '#eef2ff' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '4px',
                      border: `2px solid ${isSelected ? '#4f46e5' : '#cbd5e1'}`,
                      background: isSelected ? '#4f46e5' : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                    }}
                  >
                    {isSelected && '✓'}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.95rem', color: '#1e293b' }}>
                    <span style={{ fontWeight: 700, color: isSelected ? '#4f46e5' : '#64748b' }}>
                      {opt.id}.
                    </span>
                    <span>{opt.text}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 3. True or False */}
        {questionType === 'true_false' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            {['True', 'False'].map((val) => {
              const isSelected = String(currentAnswer).toLowerCase() === val.toLowerCase();
              return (
                <div
                  key={val}
                  onClick={() => onChangeAnswer(val)}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: `2px solid ${isSelected ? '#4f46e5' : '#e2e8f0'}`,
                    background: isSelected ? '#eef2ff' : '#ffffff',
                    textAlign: 'center',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: isSelected ? '#4f46e5' : '#334155',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {val}
                </div>
              );
            })}
          </div>
        )}

        {/* 4. Fill in the Blanks */}
        {questionType === 'fill_blanks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="form-label">Type your answer here:</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter the missing term or phrase..."
              value={currentAnswer || ''}
              onChange={(e) => onChangeAnswer(e.target.value)}
              style={{ fontSize: '1rem', padding: '0.85rem' }}
            />
          </div>
        )}

        {/* 5. Match the Following */}
        {questionType === 'match_following' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Select the matching description for each term on the left:
            </span>
            {matchPairs.map((pair, idx) => {
              const matches = typeof currentAnswer === 'object' && currentAnswer !== null ? currentAnswer : {};
              const selectedRight = matches[pair.left] || '';

              return (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    alignItems: 'center',
                    padding: '0.85rem 1rem',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>
                    {idx + 1}. {pair.left}
                  </span>
                  <select
                    className="form-select"
                    value={selectedRight}
                    onChange={(e) => handleMatchChange(pair.left, e.target.value)}
                  >
                    <option value="">-- Select Match --</option>
                    {matchPairs.map((p, pIdx) => (
                      <option key={pIdx} value={p.right}>
                        {p.right}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        )}

        {/* 6. Numerical */}
        {questionType === 'numerical' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="form-label">Enter numeric solution:</label>
            <input
              type="number"
              step="any"
              className="form-control"
              placeholder="Enter numerical value (e.g. 10, 42.5)..."
              value={currentAnswer || ''}
              onChange={(e) => onChangeAnswer(e.target.value)}
              style={{ fontSize: '1.1rem', padding: '0.85rem', fontFamily: 'var(--font-mono)' }}
            />
          </div>
        )}

        {/* 7. Short Answer, Long Descriptive & Case Study Essay */}
        {['short_answer', 'long_descriptive', 'case_study'].includes(questionType) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Your Descriptive Answer:</label>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {String(currentAnswer || '').split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <textarea
              className="form-control"
              rows={questionType === 'long_descriptive' || questionType === 'case_study' ? 8 : 4}
              placeholder="Type your well-reasoned answer here..."
              value={currentAnswer || ''}
              onChange={(e) => onChangeAnswer(e.target.value)}
              style={{ fontSize: '0.95rem', lineHeight: 1.6 }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionRenderer;
