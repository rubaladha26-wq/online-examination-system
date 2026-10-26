import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import {
  Database,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  Plus,
  Search,
  Sparkles,
  BookOpen,
} from 'lucide-react';

const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Manual Question Create Form
  const [manualForm, setManualForm] = useState({
    subject: '',
    unitNumber: 1,
    topic: '',
    questionText: '',
    questionType: 'mcq',
    difficulty: 'medium',
    cognitiveLevel: 'understand',
    marks: 1,
    correctAnswer: 'A',
    explanation: '',
    options: [
      { id: 'A', text: '', isCorrect: true },
      { id: 'B', text: '', isCorrect: false },
      { id: 'C', text: '', isCorrect: false },
      { id: 'D', text: '', isCorrect: false },
    ],
  });

  const { showToast } = useToast();

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (difficultyFilter !== 'all') params.append('difficulty', difficultyFilter);
      if (typeFilter !== 'all') params.append('questionType', typeFilter);
      if (search) params.append('search', search);

      const [qRes, subRes] = await Promise.all([
        api.get(`/teacher/questions?${params.toString()}`),
        api.get('/teacher/dashboard'),
      ]);

      if (qRes.success) setQuestions(qRes.data);
      if (subRes.success && subRes.data) {
        setSubjects(subRes.data.assignedSubjects || []);
        if (subRes.data.assignedSubjects?.length > 0 && !manualForm.subject) {
          setManualForm((prev) => ({ ...prev, subject: subRes.data.assignedSubjects[0]._id }));
        }
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [statusFilter, difficultyFilter, typeFilter]);

  const handleApprove = async (id) => {
    try {
      const res = await api.post(`/teacher/questions/${id}/approve`, {});
      if (res.success) {
        showToast('Question approved and added to exam-ready pool!', 'success');
        fetchQuestions();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/teacher/questions/${rejectingId}/reject`, {
        reason: rejectionReason,
      });
      if (res.success) {
        showToast('Question marked as rejected', 'success');
        setRejectModalOpen(false);
        setRejectionReason('');
        fetchQuestions();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      const res = await api.delete(`/teacher/questions/${id}`);
      if (res.success) {
        showToast('Question deleted', 'success');
        fetchQuestions();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/teacher/questions/${editingQuestion._id}`, editingQuestion);
      if (res.success) {
        showToast('Question updated successfully', 'success');
        setEditModalOpen(false);
        fetchQuestions();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleManualCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/teacher/questions', manualForm);
      if (res.success) {
        showToast('Manual question created and approved in bank!', 'success');
        setCreateModalOpen(false);
        fetchQuestions();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Question Bank & Review</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Review AI draft questions, modify keys/rubrics, approve for exams, or author manual questions
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setCreateModalOpen(true)}>
          <Plus size={18} /> Add Manual Question
        </button>
      </div>

      {/* Filter Toolbar */}
      <div
        className="card"
        style={{
          padding: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          {['all', 'draft', 'approved', 'rejected'].map((st) => (
            <button
              key={st}
              className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter(st)}
              style={{ textTransform: 'capitalize' }}
            >
              {st} {st === 'draft' ? '(Review)' : ''}
            </button>
          ))}

          <select
            className="form-select"
            style={{ width: 'auto', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select
            className="form-select"
            style={{ width: 'auto', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Question Types</option>
            <option value="mcq">MCQ</option>
            <option value="multiple_select">Multiple Select</option>
            <option value="true_false">True / False</option>
            <option value="fill_blanks">Fill in Blanks</option>
            <option value="match_following">Match Following</option>
            <option value="short_answer">Short Answer</option>
            <option value="long_descriptive">Long Descriptive</option>
            <option value="numerical">Numerical</option>
            <option value="case_study">Case Study</option>
          </select>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchQuestions();
          }}
          style={{ display: 'flex', gap: '0.5rem' }}
        >
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search question text or topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.2rem', minWidth: '240px', fontSize: '0.85rem' }}
            />
            <Search
              size={15}
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
            />
          </div>
          <button type="submit" className="btn btn-secondary btn-sm">
            Search
          </button>
        </form>
      </div>

      {/* Questions Cards */}
      {questions.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Database}
            title="No Questions Match Current Filters"
            description="Generate questions using the AI Question Generator or add custom questions manually."
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {questions.map((q, idx) => (
            <div
              key={q._id}
              className="card"
              style={{
                borderLeft: `5px solid ${
                  q.status === 'approved' ? '#10b981' : q.status === 'rejected' ? '#ef4444' : '#f59e0b'
                }`,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Badge
                    variant={
                      q.status === 'approved' ? 'success' : q.status === 'rejected' ? 'danger' : 'warning'
                    }
                  >
                    {q.status}
                  </Badge>
                  <Badge variant="primary">{q.questionType}</Badge>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                    Unit {q.unitNumber}: {q.topic}
                  </span>
                  {q.aiGenerated && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        fontSize: '0.75rem',
                        color: '#7c3aed',
                        fontWeight: 600,
                      }}
                    >
                      <Sparkles size={12} /> AI Synthesized
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Badge variant={q.difficulty === 'hard' ? 'danger' : q.difficulty === 'medium' ? 'warning' : 'success'}>
                    {q.difficulty}
                  </Badge>
                  <Badge variant="secondary">Bloom: {q.cognitiveLevel}</Badge>
                  <Badge variant="primary">{q.marks} Marks</Badge>
                </div>
              </div>

              {/* Case Study Context if applicable */}
              {q.caseStudyContext && (
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    color: '#334155',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <strong>Case Context:</strong> {q.caseStudyContext}
                </div>
              )}

              {/* Question Text */}
              <p style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.5 }}>
                {q.questionText}
              </p>

              {/* Options */}
              {q.options && q.options.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  {q.options.map((opt) => (
                    <div
                      key={opt.id}
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: '6px',
                        background: opt.isCorrect ? '#ecfdf5' : '#f8fafc',
                        border: `1px solid ${opt.isCorrect ? '#10b981' : '#e2e8f0'}`,
                        fontSize: '0.85rem',
                        color: opt.isCorrect ? '#065f46' : '#334155',
                        fontWeight: opt.isCorrect ? 600 : 400,
                      }}
                    >
                      <strong>{opt.id}.</strong> {opt.text}
                      {opt.isCorrect && ' ✓ (Correct)'}
                    </div>
                  ))}
                </div>
              )}

              {/* Answer Key & Explanation */}
              {q.explanation && (
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    color: '#475569',
                  }}
                >
                  <strong>Rationale:</strong> {q.explanation}
                </div>
              )}

              {/* Actions Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid #f1f5f9',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Subject: {q.subject?.name || 'N/A'}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {q.status === 'draft' && (
                    <>
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleApprove(q._id)}
                      >
                        <CheckCircle2 size={14} /> Approve for Exams
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => {
                          setRejectingId(q._id);
                          setRejectModalOpen(true);
                        }}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </>
                  )}

                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      setEditingQuestion({ ...q });
                      setEditModalOpen(true);
                    }}
                  >
                    <Edit size={14} /> Edit
                  </button>

                  <button
                    className="btn btn-sm btn-secondary"
                    style={{ color: '#ef4444' }}
                    onClick={() => handleDelete(q._id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Reason Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Question"
      >
        <form onSubmit={handleRejectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">Reason for Rejection</label>
            <textarea
              className="form-control"
              placeholder="e.g. Question wording is ambiguous or out of syllabus scope..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-danger">
              Confirm Rejection
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Question Modal */}
      {editingQuestion && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title="Edit Question Details"
          maxWidth="700px"
        >
          <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="form-label">Question Text</label>
              <textarea
                className="form-control"
                value={editingQuestion.questionText}
                onChange={(e) =>
                  setEditingQuestion({ ...editingQuestion, questionText: e.target.value })
                }
                required
              />
            </div>

            <div className="grid-3">
              <div>
                <label className="form-label">Difficulty</label>
                <select
                  className="form-select"
                  value={editingQuestion.difficulty}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, difficulty: e.target.value })
                  }
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="form-label">Marks</label>
                <input
                  type="number"
                  className="form-control"
                  value={editingQuestion.marks}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      marks: parseFloat(e.target.value) || 1,
                    })
                  }
                />
              </div>

              <div>
                <label className="form-label">Bloom's Level</label>
                <select
                  className="form-select"
                  value={editingQuestion.cognitiveLevel}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, cognitiveLevel: e.target.value })
                  }
                >
                  <option value="remember">Remember</option>
                  <option value="understand">Understand</option>
                  <option value="apply">Apply</option>
                  <option value="analyze">Analyze</option>
                  <option value="evaluate">Evaluate</option>
                  <option value="create">Create</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">Explanation / Solution Key</label>
              <textarea
                className="form-control"
                value={editingQuestion.explanation || ''}
                onChange={(e) =>
                  setEditingQuestion({ ...editingQuestion, explanation: e.target.value })
                }
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Manual Question Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add Question to Bank Manually"
        maxWidth="700px"
      >
        <form onSubmit={handleManualCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">Subject</label>
            <select
              className="form-select"
              value={manualForm.subject}
              onChange={(e) => setManualForm({ ...manualForm, subject: e.target.value })}
              required
            >
              {subjects.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid-2">
            <div>
              <label className="form-label">Unit Number</label>
              <input
                type="number"
                className="form-control"
                value={manualForm.unitNumber}
                onChange={(e) =>
                  setManualForm({ ...manualForm, unitNumber: parseInt(e.target.value, 10) })
                }
              />
            </div>
            <div>
              <label className="form-label">Topic Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Binary Search Trees"
                required
                value={manualForm.topic}
                onChange={(e) => setManualForm({ ...manualForm, topic: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Question Text</label>
            <textarea
              className="form-control"
              placeholder="Enter full question wording..."
              required
              value={manualForm.questionText}
              onChange={(e) => setManualForm({ ...manualForm, questionText: e.target.value })}
            />
          </div>

          <div className="grid-3">
            <div>
              <label className="form-label">Question Type</label>
              <select
                className="form-select"
                value={manualForm.questionType}
                onChange={(e) => setManualForm({ ...manualForm, questionType: e.target.value })}
              >
                <option value="mcq">MCQ</option>
                <option value="short_answer">Short Answer</option>
                <option value="long_descriptive">Long Descriptive</option>
                <option value="true_false">True / False</option>
                <option value="numerical">Numerical</option>
              </select>
            </div>
            <div>
              <label className="form-label">Difficulty</label>
              <select
                className="form-select"
                value={manualForm.difficulty}
                onChange={(e) => setManualForm({ ...manualForm, difficulty: e.target.value })}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="form-label">Marks</label>
              <input
                type="number"
                className="form-control"
                value={manualForm.marks}
                onChange={(e) =>
                  setManualForm({ ...manualForm, marks: parseFloat(e.target.value) || 1 })
                }
              />
            </div>
          </div>

          {manualForm.questionType === 'mcq' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label className="form-label">Options (Check the correct radio):</label>
              {manualForm.options.map((opt, i) => (
                <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="radio"
                    name="correctOpt"
                    checked={opt.isCorrect}
                    onChange={() => {
                      const updated = manualForm.options.map((o, idx) => ({
                        ...o,
                        isCorrect: idx === i,
                      }));
                      setManualForm({ ...manualForm, options: updated, correctAnswer: opt.id });
                    }}
                  />
                  <span style={{ fontWeight: 700, width: 20 }}>{opt.id}.</span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={`Option ${opt.id} text`}
                    value={opt.text}
                    onChange={(e) => {
                      const updated = [...manualForm.options];
                      updated[i].text = e.target.value;
                      setManualForm({ ...manualForm, options: updated });
                    }}
                    required
                  />
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="form-label">Explanation & Rationale</label>
            <textarea
              className="form-control"
              placeholder="Provide solution rationale..."
              value={manualForm.explanation}
              onChange={(e) => setManualForm({ ...manualForm, explanation: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save to Question Bank
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default QuestionBank;
