import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import { FileText, Sparkles, ArrowLeft, Save, Plus, Trash2, CheckCircle2 } from 'lucide-react';

const SyllabusDetails = () => {
  const { id } = useParams();
  const [syllabus, setSyllabus] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchSyllabus = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/teacher/syllabuses/${id}`);
        if (res.success && res.data) {
          setSyllabus(res.data);
          setUnits(res.data.units || []);
        }
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSyllabus();
  }, [id]);

  const handleUnitChange = (index, field, value) => {
    const updated = [...units];
    updated[index][field] = value;
    setUnits(updated);
  };

  const handleTopicAdd = (unitIndex, topicText) => {
    if (!topicText.trim()) return;
    const updated = [...units];
    updated[unitIndex].topics.push(topicText.trim());
    setUnits(updated);
  };

  const handleTopicRemove = (unitIndex, topicIdx) => {
    const updated = [...units];
    updated[unitIndex].topics.splice(topicIdx, 1);
    setUnits(updated);
  };

  const handleSaveUnits = async () => {
    try {
      setSaving(true);
      const res = await api.put(`/teacher/syllabuses/${id}/units`, { units });
      if (res.success) {
        showToast('Syllabus units and topics saved successfully!', 'success');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="page-wrapper"><p>Loading syllabus details...</p></div>;
  }

  if (!syllabus) {
    return <div className="page-wrapper"><p>Syllabus not found.</p></div>;
  }

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/teacher/syllabuses" className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} /> Back to Syllabuses
          </Link>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{syllabus.title}</h2>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Subject: <span style={{ fontWeight: 600, color: '#0f172a' }}>{syllabus.subject?.name}</span> ({syllabus.subject?.code})
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handleSaveUnits} disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Unit Edits'}
          </button>
          <Link
            to={`/teacher/ai-generator?syllabusId=${syllabus._id}`}
            className="btn btn-primary"
            style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
          >
            <Sparkles size={16} /> Generate Questions with AI
          </Link>
        </div>
      </div>

      {/* Units List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
          Extracted Units & Topics ({units.length})
        </h3>

        {units.map((unit, uIdx) => (
          <div key={unit._id || uIdx} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                {unit.unitNumber}
              </span>
              <input
                type="text"
                className="form-control"
                style={{ fontWeight: 700, fontSize: '1.05rem' }}
                value={unit.title}
                onChange={(e) => handleUnitChange(uIdx, 'title', e.target.value)}
              />
            </div>

            {/* Learning Objectives */}
            {unit.learningObjectives && unit.learningObjectives.length > 0 && (
              <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                  Learning Objectives:
                </span>
                <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem', fontSize: '0.85rem', color: '#334155' }}>
                  {unit.learningObjectives.map((obj, oIdx) => (
                    <li key={oIdx}>{obj}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Topics Tags */}
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>
                Grounded Topics (Used by AI Generator):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {unit.topics.map((top, tIdx) => (
                  <span
                    key={tIdx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: '#eef2ff',
                      color: '#4338ca',
                      padding: '0.3rem 0.75rem',
                      borderRadius: '999px',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                    }}
                  >
                    {top}
                    <button
                      onClick={() => handleTopicRemove(uIdx, tIdx)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#6366f1',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '1rem',
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Topic Input */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="Add custom topic..."
                  className="form-control"
                  style={{ maxWidth: 300, fontSize: '0.85rem' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleTopicAdd(uIdx, e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SyllabusDetails;
