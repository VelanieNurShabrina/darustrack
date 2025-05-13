import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { subjectsAPI } from '../utils/api'
import { toast } from 'react-toastify';

function SubjectManagement() {
  const [subjects, setSubjects] = useState([])
  const [newSubject, setNewSubject] = useState({
    name: '',
    description: ''
  })
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { currentUser, userRole } = useAuth()
  const navigate = useNavigate()

  // Fetch subjects from API
  const fetchSubjects = async () => {
    try {
      setLoading(true)
      const response = await subjectsAPI.getAll()
      setSubjects(Array.isArray(response) ? response : [])
      setError(null)
    } catch (err) {
      setError('Failed to fetch subjects')
      console.error('Error fetching subjects:', err)
      setSubjects([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser) {
      fetchSubjects()
    }
  }, [currentUser])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewSubject(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (userRole !== 'admin') {
      setError('Only administrators can add new subjects')
      return
    }

    try {
      setLoading(true)
      const response = await subjectsAPI.create(newSubject)
      if (response) {
        setSubjects(prev => [...prev, response])
        setNewSubject({ name: '', description: '' })
        setShowAddModal(false)
        setError(null)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create subject')
      console.error('Error creating subject:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (subject) => {
    setSelectedSubject(subject)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedSubject || userRole !== 'admin') return

    try {
      setLoading(true)
      await subjectsAPI.delete(selectedSubject.id)
      setSubjects(prev => prev.filter(subject => subject.id !== selectedSubject.id))
      setShowDeleteModal(false)
      setSelectedSubject(null)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete subject')
      console.error('Error deleting subject:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Informasi Mata Pelajaran</h2>
        {userRole === 'admin' && (
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <i className="bi bi-plus-lg me-2"></i>
            Tambah Mata Pelajaran
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : subjects.length === 0 ? (
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2"></i>
          Belum ada mata pelajaran.
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">
          {subjects.map((subject) => (
            <div key={subject.id} className="card border rounded-3 shadow-sm">
              <div className="card-body p-4">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <h3 className="mb-2" style={{ color: '#0D6EFD' }}>{subject.name}</h3>
                    <p className="mb-0 text-muted">
                      {subject.description?.substring(0, 100)}
                      {subject.description?.length > 100 ? '...' : ''}
                    </p>
                  </div>
                  <div className="col-md-4 text-md-end mt-3 mt-md-0">
                    <Link
                      to={`/subjects/${subject.id}`}
                      className="btn btn-outline-primary me-2"
                    >
                      <i className="bi bi-eye me-1"></i>
                      Lihat Detail
                    </Link>
                    {userRole === 'admin' && (
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => handleDeleteClick(subject)}
                        disabled={loading}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Tambah Mata Pelajaran Baru</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">Nama Mata Pelajaran</label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      name="name"
                      value={newSubject.name}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">Deskripsi</label>
                    <textarea
                      className="form-control"
                      id="description"
                      name="description"
                      value={newSubject.description}
                      onChange={handleInputChange}
                      rows="3"
                      disabled={loading}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAddModal(false)}
                    disabled={loading}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Menambahkan...
                      </>
                    ) : (
                      'Tambah Mata Pelajaran'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedSubject && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Konfirmasi Hapus</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setSelectedSubject(null)
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <p>Anda yakin ingin menghapus mata pelajaran ini?</p>
                <div className="alert alert-warning">
                  <strong>Nama:</strong> {selectedSubject.name}<br />
                  <strong>Deskripsi:</strong> {selectedSubject.description}
                </div>
                <p className="text-danger mb-0">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Tindakan ini tidak dapat dibatalkan
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteConfirm}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Menghapus...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-trash me-2"></i>
                      Hapus
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setSelectedSubject(null)
                  }}
                  disabled={loading}
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubjectManagement
