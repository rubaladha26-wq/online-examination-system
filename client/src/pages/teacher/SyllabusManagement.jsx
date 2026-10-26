import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { Upload, FileText, Sparkles, Eye, Trash2, CheckCircle2 } from 'lucide-react';

const SyllabusManagement = () => {
  const [syllabuses, setSyllabuses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [semester, setSemester] = useState(1);
  const [academicYear, setAcademicYear] = useState('2024-2028');

  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sylRes, subRes] = await Promise.all([
        api.get('/teacher/syllabuses'),
        api.get('/teacher/dashboard'),
      ]);

      if (sylRes.success) setSyllabuses(sylRes.data);
      if (subRes.success && subRes.data) setSubjects(subRes.data.assignedSubjects || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      showToast('Please select a syllabus document file.', 'warning');
      return;
    }

    if (!subjectId) {
      showToast('Please select an assigned subject.', 'warning');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title || file.name.replace(/\.[^/.]+$/, ''));
    formData.append('subjectId', subjectId);
    formData.append('semester', semester);
    formData.append('academicYear', academicYear);

    try {
      const res = await api.post('/teacher/syllabuses', formData);
      if (res.success) {
        showToast('Syllabus uploaded and parsed into units successfully!', 'success');
        setIsModalOpen(false);
        setFile(null);
        setTitle('');
        fetchData();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Syllabus Documents & Curriculum</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Upload course syllabuses to extract units, topics, and enable grounded AI question synthesis
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Upload size={18} /> Upload New Syllabus
        </button>
      </div>

      {syllabuses.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FileText}
            title="No Syllabuses Uploaded Yet"
            description="Upload your course curriculum in PDF, Word DOCX, or Text format to automatically extract units and topics."
            action={
              <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                <Upload size={16} /> Upload First Syllabus
              </button>
            }
          />
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Syllabus Details</th>
                  <th>Subject</th>
                  <th>Parsed Units</th>
                  <th>File Metadata</th>
                  <th>Processing Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {syllabuses.map((syl) => (
                  <tr key={syl._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{syl.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Academic Year: {syl.academicYear} • Sem {syl.semester}
                      </div>
                    </td>
                    <td>
                      <Badge variant="primary">{syl.subject?.name || 'Subject'}</Badge>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#4f46e5' }}>
                        {syl.units?.length || 0} Units
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#475569' }}>
                        {syl.fileType} • {(syl.fileSize / 1024 / 1024).toFixed(2)} MB
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {new Date(syl.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <Badge variant={syl.status === 'processed' ? 'success' : 'warning'}>
                        {syl.status}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <Link
                          to={`/teacher/syllabuses/${syl._id}`}
                          className="btn btn-secondary btn-sm"
                          title="View Units & Topics"
                        >
                          <Eye size={14} /> Review Units
                        </Link>
                        <Link
                          to={`/teacher/ai-generator?syllabusId=${syl._id}`}
                          className="btn btn-primary btn-sm"
                          style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
                          title="Generate Questions with AI"
                        >
                          <Sparkles size={14} /> Generate
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !uploading && setIsModalOpen(false)}
        title="Upload & Parse Syllabus Document"
      >
        <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label className="form-label">Syllabus Title</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Data Structures & Algorithms Syllabus 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="form-label">Select Subject</label>
            <select
              className="form-select"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              required
            >
              <option value="">-- Choose Assigned Subject --</option>
              {subjects.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid-2">
            <div>
              <label className="form-label">Semester</label>
              <input
                type="number"
                className="form-control"
                value={semester}
                onChange={(e) => setSemester(parseInt(e.target.value, 10))}
              />
            </div>
            <div>
              <label className="form-label">Academic Year</label>
              <input
                type="text"
                className="form-control"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Choose Document File (PDF, DOCX, TXT)</label>
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              className="form-control"
              onChange={(e) => setFile(e.target.files[0])}
              required
            />
            <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
              Maximum size: 15MB. Our engine automatically segments the text into Units and Topics.
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={uploading}
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? 'Extracting & Parsing Units...' : 'Upload & Process Syllabus'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SyllabusManagement;
