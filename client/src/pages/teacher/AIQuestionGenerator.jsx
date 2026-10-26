import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import {
  Sparkles,
  Layers,
  Sliders,
  CheckSquare,
  BookOpen,
  ArrowRight,
  Database,
  CheckCircle2,
} from 'lucide-react';

const ALL_QUESTION_TYPES = [
  { id: 'mcq', label: 'Multiple Choice (MCQ)' },
  { id: 'multiple_select', label: 'Multiple Select' },
  { id: 'true_false', label: 'True / False' },
  { id: 'fill_blanks', label: 'Fill in Blanks' },
  { id: 'match_following', label: 'Match the Following' },
  { id: 'short_answer', label: 'Short Answer' },
  { id: 'long_descriptive', label: 'Long Descriptive' },
  { id: 'numerical', label: 'Numerical / Problem' },
  { id: 'case_study', label: 'Case Study' },
];

const BLOOM_LEVELS = [
  { id: 'remember', label: 'Remember' },
  { id: 'understand', label: 'Understand' },
  { id: 'apply', label: 'Apply' },
  { id: 'analyze', label: 'Analyze' },
  { id: 'evaluate', label: 'Evaluate' },
  { id: 'create', label: 'Create' },
];

const AIQuestionGenerator = () => {
  const [searchParams] = useSearchParams();
  const preSelectedSyllabusId = searchParams.get('syllabusId') || '';

  const [syllabuses, setSyllabuses] = useState([]);
  const [selectedSyllabusId, setSelectedSyllabusId] = useState(preSelectedSyllabusId);
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([
    'mcq',
    'multiple_select',
    'short_answer',
    'long_descriptive',
  ]);
  const [selectedBlooms, setSelectedBlooms] = useState([
    'remember',
    'understand',
    'apply',
    'analyze',
  ]);
  const [count, setCount] = useState(6);
  const [difficulty, setDifficulty] = useState({ easy: 30, medium: 50, hard: 20 });
  const [generating, setGenerating] = useState(false);
  const [generatedResults, setGeneratedResults] = useState(null);

  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSyllabuses = async () => {
      try {
        const res = await api.get('/teacher/syllabuses');
        if (res.success && res.data) {
          setSyllabuses(res.data);
          if (!selectedSyllabusId && res.data.length > 0) {
            setSelectedSyllabusId(res.data[0]._id);
          }
        }
      } catch (err) {
        showToast(err.message, 'error');
      }
    };
    fetchSyllabuses();
  }, []);

  const currentSyllabus = syllabuses.find((s) => s._id === selectedSyllabusId);

  const toggleType = (typeId) => {
    if (selectedTypes.includes(typeId)) {
      if (selectedTypes.length === 1) {
        showToast('At least one question type must be selected', 'warning');
        return;
      }
      setSelectedTypes(selectedTypes.filter((t) => t !== typeId));
    } else {
      setSelectedTypes([...selectedTypes, typeId]);
    }
  };

  const toggleBloom = (levelId) => {
    if (selectedBlooms.includes(levelId)) {
      if (selectedBlooms.length === 1) return;
      setSelectedBlooms(selectedBlooms.filter((b) => b !== levelId));
    } else {
      setSelectedBlooms([...selectedBlooms, levelId]);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedSyllabusId) {
      showToast('Please select a syllabus document first.', 'warning');
      return;
    }

    setGenerating(true);
    setGeneratedResults(null);

    try {
      const payload = {
        unitNumbers: selectedUnits.length > 0 ? selectedUnits : undefined,
        questionTypes: selectedTypes,
        count: parseInt(count, 10),
        difficultyDistribution: difficulty,
        cognitiveLevels: selectedBlooms,
        includeExplanations: true,
      };

      const res = await api.post(
        `/teacher/syllabuses/${selectedSyllabusId}/generate-questions`,
        payload
      );

      if (res.success && res.data) {
        setGeneratedResults(res.data);
        showToast(
          `Generated ${res.data.totalGenerated} questions grounded in syllabus!`,
          'success'
        );
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#7c3aed', fontWeight: 700, fontSize: '0.85rem' }}>
          <Sparkles size={18} />
          <span>Syllabus-Grounded AI Synthesis Engine</span>
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem' }}>
          AI Question Generator
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Configure curriculum boundaries, cognitive taxonomy distribution, and question formats. Questions are saved in draft status for teacher review.
        </p>
      </div>

      <div className="grid-3" style={{ gridTemplateColumns: '1.2fr 1.8fr', gap: '2rem' }}>
        {/* Generator Controls */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'fit-content' }}>
          <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Syllabus Selector */}
            <div>
              <label className="form-label">Target Syllabus</label>
              <select
                className="form-select"
                value={selectedSyllabusId}
                onChange={(e) => {
                  setSelectedSyllabusId(e.target.value);
                  setSelectedUnits([]);
                }}
                required
              >
                {syllabuses.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.title} ({s.subject?.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Units Selector */}
            {currentSyllabus?.units && (
              <div>
                <label className="form-label">
                  Curriculum Units ({selectedUnits.length === 0 ? 'All Units Included' : `${selectedUnits.length} Selected`})
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {currentSyllabus.units.map((u) => {
                    const isSelected = selectedUnits.includes(u.unitNumber);
                    return (
                      <button
                        type="button"
                        key={u.unitNumber}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedUnits(selectedUnits.filter((n) => n !== u.unitNumber));
                          } else {
                            setSelectedUnits([...selectedUnits, u.unitNumber]);
                          }
                        }}
                        style={{
                          padding: '0.35rem 0.65rem',
                          borderRadius: '6px',
                          border: `1.5px solid ${isSelected ? '#4f46e5' : '#cbd5e1'}`,
                          background: isSelected ? '#eef2ff' : '#ffffff',
                          color: isSelected ? '#4f46e5' : '#475569',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Unit {u.unitNumber}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Question Types */}
            <div>
              <label className="form-label">Supported Question Types (9 Formats)</label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.4rem',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  paddingRight: '4px',
                }}
              >
                {ALL_QUESTION_TYPES.map((type) => {
                  const isChecked = selectedTypes.includes(type.id);
                  return (
                    <div
                      key={type.id}
                      onClick={() => toggleType(type.id)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: `1px solid ${isChecked ? '#4f46e5' : '#e2e8f0'}`,
                        background: isChecked ? '#eef2ff' : '#ffffff',
                        color: isChecked ? '#4f46e5' : '#334155',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ pointerEvents: 'none' }}
                      />
                      <span>{type.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bloom's Taxonomy Cognitive Levels */}
            <div>
              <label className="form-label">Bloom's Taxonomy Cognitive Levels</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {BLOOM_LEVELS.map((level) => {
                  const isChecked = selectedBlooms.includes(level.id);
                  return (
                    <button
                      type="button"
                      key={level.id}
                      onClick={() => toggleBloom(level.id)}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '999px',
                        border: `1.5px solid ${isChecked ? '#8b5cf6' : '#cbd5e1'}`,
                        background: isChecked ? '#f5f3ff' : '#ffffff',
                        color: isChecked ? '#7c3aed' : '#475569',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {level.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Total Questions Count */}
            <div>
              <label className="form-label">Number of Questions to Synthesize</label>
              <input
                type="number"
                min="1"
                max="30"
                className="form-control"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                required
              />
            </div>

            {/* Difficulty Distribution */}
            <div>
              <label className="form-label">
                Difficulty Target: {difficulty.easy}% Easy / {difficulty.medium}% Med / {difficulty.hard}% Hard
              </label>
              <input
                type="range"
                min="10"
                max="70"
                value={difficulty.medium}
                onChange={(e) => {
                  const med = parseInt(e.target.value, 10);
                  const rem = 100 - med;
                  setDifficulty({
                    easy: Math.round(rem * 0.6),
                    medium: med,
                    hard: Math.round(rem * 0.4),
                  });
                }}
                style={{ width: '100%' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={generating}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                borderColor: '#7c3aed',
              }}
            >
              <Sparkles size={18} />
              {generating ? 'Synthesizing Questions with AI...' : 'Generate Questions'}
            </button>
          </form>
        </div>

        {/* Live Generation Results / Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {generating && (
            <div
              className="card"
              style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  border: '4px solid #e0e7ff',
                  borderTopColor: '#7c3aed',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                Synthesizing Questions from Syllabus...
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.875rem', maxWidth: 400 }}>
                Processing curriculum units, constructing distractors, mapping Bloom's taxonomy, and formulating grading rubrics.
              </p>
            </div>
          )}

          {!generating && !generatedResults && (
            <div
              className="card"
              style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: '#f5f3ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#7c3aed',
                }}
              >
                <Sparkles size={28} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Ready to Generate</h3>
              <p style={{ color: '#64748b', fontSize: '0.875rem', maxWidth: 420 }}>
                Configure your curriculum units and click "Generate Questions" to synthesize draft questions grounded strictly in the syllabus.
              </p>
            </div>
          )}

          {!generating && generatedResults && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  padding: '1rem 1.25rem',
                  borderRadius: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#065f46' }}>
                  <CheckCircle2 size={20} color="#059669" />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    Successfully Synthesized {generatedResults.totalGenerated} Questions in Draft Status!
                  </span>
                </div>
                <Link to="/teacher/questions" className="btn btn-primary btn-sm">
                  <Database size={14} /> Review in Question Bank
                </Link>
              </div>

              {/* Cards of Generated Questions */}
              {generatedResults.questions.map((q, idx) => (
                <div key={q._id || idx} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                      <Badge variant="secondary">Unit {q.unitNumber}: {q.topic}</Badge>
                      <Badge variant="primary">{q.questionType}</Badge>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <Badge variant={q.difficulty === 'hard' ? 'danger' : q.difficulty === 'medium' ? 'warning' : 'success'}>
                        {q.difficulty}
                      </Badge>
                      <Badge variant="secondary">Bloom: {q.cognitiveLevel}</Badge>
                      <Badge variant="primary">{q.marks} Marks</Badge>
                    </div>
                  </div>

                  <p style={{ fontWeight: 600, fontSize: '1rem', color: '#0f172a' }}>
                    {q.questionText}
                  </p>

                  {/* Options if MCQ / Multiple Select */}
                  {q.options && q.options.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem', marginTop: '0.25rem' }}>
                      {q.options.map((opt) => (
                        <div
                          key={opt.id}
                          style={{
                            padding: '0.4rem 0.75rem',
                            borderRadius: '6px',
                            background: opt.isCorrect ? '#ecfdf5' : '#f8fafc',
                            border: `1px solid ${opt.isCorrect ? '#10b981' : '#e2e8f0'}`,
                            fontSize: '0.85rem',
                            display: 'flex',
                            gap: '0.4rem',
                          }}
                        >
                          <span style={{ fontWeight: 700, color: opt.isCorrect ? '#059669' : '#64748b' }}>
                            {opt.id}.
                          </span>
                          <span>{opt.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Explanation */}
                  {q.explanation && (
                    <div
                      style={{
                        background: '#f8fafc',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        color: '#475569',
                      }}
                    >
                      <strong style={{ color: '#0f172a' }}>Pedagogical Rationale:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIQuestionGenerator;
