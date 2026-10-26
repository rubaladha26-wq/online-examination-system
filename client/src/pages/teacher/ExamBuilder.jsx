import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import {
  CalendarCheck,
  Clock,
  Award,
  Layers,
  Shuffle,
  Percent,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const ExamBuilder = () => {
  const [subjects, setSubjects] = useState([]);
  const [syllabuses, setSyllabuses] = useState([]);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form Configuration
  const [title, setTitle] = useState('');
  const [code, setCode] = useState(`EX-${Math.floor(100000 + Math.random() * 900000)}`);
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState(
    '1. Answer all questions within the allocated time.\n2. Server timing is strictly authoritative.\n3. Autosave is enabled in real time.'
  );
  const [subjectId, setSubjectId] = useState('');
  const [syllabusId, setSyllabusId] = useState('');

  // Default dates: start now, end in 7 days
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const toLocalIso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  const [startDate, setStartDate] = useState(toLocalIso(now));
  const [endDate, setEndDate] = useState(toLocalIso(nextWeek));
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [totalMarks, setTotalMarks] = useState(30);
  const [passingMarks, setPassingMarks] = useState(12);
  const [maxAttempts, setMaxAttempts] = useState(1);

  const [selectionMethod, setSelectionMethod] = useState('manual'); // 'manual' | 'random_from_bank'
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [enableNegativeMarking, setEnableNegativeMarking] = useState(false);
  const [negativeMarkingPenalty, setNegativeMarkingPenalty] = useState(0.25);
  const [releaseResultsImmediately, setReleaseResultsImmediately] = useState(true);
  const [allowDescriptiveAIGrading, setAllowDescriptiveAIGrading] = useState(true);

  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [dashRes, sylRes] = await Promise.all([
          api.get('/teacher/dashboard'),
          api.get('/teacher/syllabuses'),
        ]);

        if (dashRes.success && dashRes.data) {
          const subs = dashRes.data.assignedSubjects || [];
          setSubjects(subs);
          if (subs.length > 0) {
            setSubjectId(subs[0]._id);
          }
        }
        if (sylRes.success) setSyllabuses(sylRes.data || []);
      } catch (err) {
        showToast(err.message, 'error');
      }
    };
    fetchInit();
  }, []);

  // Fetch approved questions when subject changes
  useEffect(() => {
    if (!subjectId) return;
    const fetchApprovedQuestions = async () => {
      try {
        const res = await api.get(`/teacher/questions?subjectId=${subjectId}&status=approved`);
        if (res.success && res.data) {
          setAvailableQuestions(res.data);
          // Pre-select questions to match total marks
          setSelectedQuestions(res.data.slice(0, 8).map((q) => q._id));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchApprovedQuestions();
  }, [subjectId]);

  const toggleQuestionSelect = (qId) => {
    if (selectedQuestions.includes(qId)) {
      setSelectedQuestions(selectedQuestions.filter((id) => id !== qId));
    } else {
      setSelectedQuestions([...selectedQuestions, qId]);
    }
  };

  const calculatedSelectedMarks = availableQuestions
    .filter((q) => selectedQuestions.includes(q._id))
    .reduce((acc, q) => acc + (q.marks || 1), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectionMethod === 'manual' && selectedQuestions.length === 0) {
      showToast('Please select at least one question for the examination.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title,
        code,
        description,
        instructions,
        subject: subjectId,
        syllabus: syllabusId || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        durationMinutes: parseInt(durationMinutes, 10),
        totalMarks: selectionMethod === 'manual' ? calculatedSelectedMarks : parseFloat(totalMarks),
        passingMarks: parseFloat(passingMarks),
        maxAttempts: parseInt(maxAttempts, 10),
        questionSelectionMethod: selectionMethod,
        questions: selectionMethod === 'manual' ? selectedQuestions : [],
        randomizeQuestions,
        enableNegativeMarking,
        negativeMarkingPenalty: parseFloat(negativeMarkingPenalty),
        releaseResultsImmediately,
        allowDescriptiveAIGrading,
      };

      const res = await api.post('/teacher/exams', payload);
      if (res.success) {
        showToast('Examination created successfully in Draft status!', 'success');
        navigate('/teacher/exams');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Create Examination</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Configure scheduling, question pool selection, passing thresholds, and AI descriptive evaluation settings
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Basic Information */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            General Information & Subject Mapping
          </h3>

          <div className="grid-2">
            <div>
              <label className="form-label">Examination Title</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Mid-Term Examination on Data Structures"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">Examination Code</label>
              <input
                type="text"
                className="form-control"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <div>
              <label className="form-label">Subject</label>
              <select
                className="form-select"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                required
              >
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Associated Syllabus (Optional)</label>
              <select
                className="form-select"
                value={syllabusId}
                onChange={(e) => setSyllabusId(e.target.value)}
              >
                <option value="">-- No specific syllabus version --</option>
                {syllabuses.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Student Instructions</label>
            <textarea
              className="form-control"
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>
        </div>

        {/* Schedule & Marks */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            Timing, Marks & Attempt Rules
          </h3>

          <div className="grid-3">
            <div>
              <label className="form-label">Start Date & Time (Server-Authoritative)</label>
              <input
                type="datetime-local"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">End Date & Time</label>
              <input
                type="datetime-local"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">Duration (Minutes)</label>
              <input
                type="number"
                min="5"
                max="360"
                className="form-control"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid-3">
            <div>
              <label className="form-label">
                Total Marks {selectionMethod === 'manual' && `(Calculated: ${calculatedSelectedMarks})`}
              </label>
              <input
                type="number"
                className="form-control"
                value={selectionMethod === 'manual' ? calculatedSelectedMarks : totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
                readOnly={selectionMethod === 'manual'}
              />
            </div>
            <div>
              <label className="form-label">Passing Marks</label>
              <input
                type="number"
                className="form-control"
                value={passingMarks}
                onChange={(e) => setPassingMarks(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">Allowed Attempts Per Student</label>
              <input
                type="number"
                min="1"
                max="5"
                className="form-control"
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Question Selection & Rules */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            Question Selection & Assessment Integrity
          </h3>

          <div className="grid-2">
            <div>
              <label className="form-label">Question Selection Method</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="method"
                    checked={selectionMethod === 'manual'}
                    onChange={() => setSelectionMethod('manual')}
                  />
                  <span>Manual Selection from Approved Bank</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="method"
                    checked={selectionMethod === 'random_from_bank'}
                    onChange={() => setSelectionMethod('random_from_bank')}
                  />
                  <span>Random Draw from Approved Bank</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={randomizeQuestions}
                  onChange={(e) => setRandomizeQuestions(e.target.checked)}
                />
                <span>Randomize question order for each student attempt</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={enableNegativeMarking}
                  onChange={(e) => setEnableNegativeMarking(e.target.checked)}
                />
                <span>Enable Negative Marking (Deduct 25% of question mark on wrong answer)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={releaseResultsImmediately}
                  onChange={(e) => setReleaseResultsImmediately(e.target.checked)}
                />
                <span>Release scores & answer explanations immediately upon student submission</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={allowDescriptiveAIGrading}
                  onChange={(e) => setAllowDescriptiveAIGrading(e.target.checked)}
                />
                <span>Enable AI-Assisted Descriptive Evaluation (Generates rubrics & score suggestions)</span>
              </label>
            </div>
          </div>

          {/* Manual Question Selector Table */}
          {selectionMethod === 'manual' && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  Select Questions from Approved Bank ({selectedQuestions.length} Selected • {calculatedSelectedMarks} Marks)
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    if (selectedQuestions.length === availableQuestions.length) {
                      setSelectedQuestions([]);
                    } else {
                      setSelectedQuestions(availableQuestions.map((q) => q._id));
                    }
                  }}
                >
                  {selectedQuestions.length === availableQuestions.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {availableQuestions.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                  No approved questions in bank for this subject. Please approve draft questions in the Question Bank first.
                </p>
              ) : (
                <div className="table-responsive" style={{ maxHeight: '350px' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>Select</th>
                        <th>Question</th>
                        <th>Type</th>
                        <th>Difficulty</th>
                        <th>Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableQuestions.map((q) => {
                        const isSelected = selectedQuestions.includes(q._id);
                        return (
                          <tr
                            key={q._id}
                            onClick={() => toggleQuestionSelect(q._id)}
                            style={{ cursor: 'pointer', background: isSelected ? '#f5f3ff' : 'transparent' }}
                          >
                            <td>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                style={{ pointerEvents: 'none' }}
                              />
                            </td>
                            <td style={{ fontWeight: 600, color: '#1e293b' }}>
                              {q.questionText}
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                Unit {q.unitNumber}: {q.topic}
                              </div>
                            </td>
                            <td><Badge variant="primary">{q.questionType}</Badge></td>
                            <td><Badge variant={q.difficulty === 'hard' ? 'danger' : q.difficulty === 'medium' ? 'warning' : 'success'}>{q.difficulty}</Badge></td>
                            <td style={{ fontWeight: 700 }}>{q.marks}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/teacher/exams')}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? 'Creating Examination...' : 'Create Examination (Draft)'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExamBuilder;
