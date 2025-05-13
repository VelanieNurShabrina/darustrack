import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subjectsAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

function SubjectDetail() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchSubjectDetails();
  }, [subjectId]);

  const fetchSubjectDetails = async () => {
    try {
      setLoading(true);
      const response = await subjectsAPI.getById(subjectId);
      setSubject(response);
      setEditForm({
        name: response.name || '',
        description: response.description || ''
      });
    } catch (err) {
      console.error('Error fetching subject:', err);
      toast.error('Gagal memuat detail mata pelajaran');
      navigate('/subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!subject || userRole !== 'admin') return;

    try {
      setLoading(true);
      const response = await subjectsAPI.update(subject.id, editForm);
      if (response) {
        setSubject(response);
        setShowEditModal(false);
        toast.success('Mata pelajaran berhasil diperbarui');
      }
    } catch (err) {
      console.error('Error updating subject:', err);
      toast.error('Gagal memperbarui mata pelajaran');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!subject) {
    return <div>Subject not found</div>;
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">{subject.name}</h2>
        <div>
          {userRole === 'admin' && (
            <button
              className="btn btn-outline-primary me-2"
              onClick={() => setShowEditModal(true)}
            >
              <i className="bi bi-pencil me-2"></i>
              Edit
            </button>
          )}
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate('/subjects')}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Kembali
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">

            </div>
          </div>
          <div className="mt-4">
            <h5 className="card-title">Deskripsi</h5>
            <p className="card-text">{subject.description || 'Tidak ada deskripsi tersedia.'}</p>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Mata Pelajaran</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">Nama Mata Pelajaran</label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">Deskripsi</label>
                    <textarea
                      className="form-control"
                      id="description"
                      rows="5"
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowEditModal(false)}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubjectDetail;
