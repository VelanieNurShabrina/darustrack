import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { studentsAPI, usersAPI } from '../utils/api'
import { toast } from 'react-toastify'

function StudentManagement() {
  const [students, setStudents] = useState([])
  const [parents, setParents] = useState([])
  const [loading, setLoading] = useState(true)
  const [parentsLoading, setParentsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [newStudent, setNewStudent] = useState({
    nisn: '',
    name: '',
    birth_date: '',
    parent_id: ''
  })
  const [editStudentForm, setEditStudentForm] = useState({
    nisn: '',
    name: '',
    birth_date: '',
    parent_id: ''
  })
  const [parentSearchTerm, setParentSearchTerm] = useState('')
  const [filteredParents, setFilteredParents] = useState([])
  const [showParentDropdown, setShowParentDropdown] = useState(false)
  const [showEditParentDropdown, setShowEditParentDropdown] = useState(false)
  const { currentUser } = useAuth()

  const fetchStudents = async () => {
    console.log('StudentManagement: Starting to fetch students');
    try {
      setLoading(true)
      console.log('StudentManagement: Calling studentsAPI.getAll()');
      const response = await studentsAPI.getAll()
      console.log('StudentManagement: Received response from API:', response);
      console.log('StudentManagement: Response structure:', {
        isArray: Array.isArray(response),
        length: Array.isArray(response) ? response.length : 'not an array',
        dataType: typeof response,
        hasData: response && (Array.isArray(response) ? response.length > 0 : Object.keys(response).length > 0)
      });
      
      if (Array.isArray(response) && response.length > 0) {
        console.log('StudentManagement: Sample student item:', response[0]);
        console.log('StudentManagement: Available fields:', Object.keys(response[0]));
      }
      
      setStudents(Array.isArray(response) ? response : [])
      console.log('StudentManagement: Students state updated with', Array.isArray(response) ? response.length : 0, 'items');
      setError(null)
    } catch (err) {
      console.error('StudentManagement: Error fetching students:', err);
      console.error('StudentManagement: Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      setError('Gagal mengambil data siswa')
      toast.error('Gagal mengambil data siswa')
      setStudents([])
    } finally {
      setLoading(false)
      console.log('StudentManagement: Fetch operation completed');
    }
  }

  const fetchParents = async () => {
    try {
      setParentsLoading(true)
      console.log('StudentManagement: Fetching parents with role=orang_tua');
      const response = await usersAPI.getAll('orang_tua')
      console.log('StudentManagement: Parents fetched successfully:', response);
      setParents(Array.isArray(response) ? response : [])
      setFilteredParents(Array.isArray(response) ? response : [])
    } catch (err) {
      console.error('StudentManagement: Error fetching parents:', err);
      toast.error('Gagal mengambil data orang tua')
    } finally {
      setParentsLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser) {
      fetchStudents()
      fetchParents()
    }
  }, [currentUser])

  // Filter parents based on search term
  useEffect(() => {
    if (parentSearchTerm.trim() === '') {
      setFilteredParents(parents)
    } else {
      const filtered = parents.filter(parent => 
        parent.name?.toLowerCase().includes(parentSearchTerm.toLowerCase()) ||
        parent.email?.toLowerCase().includes(parentSearchTerm.toLowerCase()) ||
        parent.phone?.includes(parentSearchTerm)
      )
      setFilteredParents(filtered)
    }
  }, [parentSearchTerm, parents])

  const handleAddClick = () => {
    setNewStudent({
      nisn: '',
      name: '',
      birth_date: '',
      parent_id: ''
    })
    setShowAddModal(true)
  }

  const handleViewClick = (student) => {
    setSelectedStudent(student)
    setShowViewModal(true)
  }

  const handleEditClick = (student) => {
    console.log('StudentManagement: Edit clicked for student:', student);
    setSelectedStudent(student)
    setEditStudentForm({
      nisn: student.nisn || '',
      name: student.name || '',
      birth_date: student.birth_date ? student.birth_date.split('T')[0] : '',
      parent_id: student.parent_id || ''
    })
    setShowEditModal(true)
  }

  const handleDeleteClick = (student) => {
    console.log('StudentManagement: Delete clicked for student:', student);
    setSelectedStudent(student)
    setShowDeleteModal(true)
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    console.log('StudentManagement: Adding new student:', newStudent);
    try {
      setLoading(true)
      console.log('StudentManagement: Calling studentsAPI.create()');
      const result = await studentsAPI.create(newStudent)
      console.log('StudentManagement: Successfully created student, received:', result);
      setShowAddModal(false)
      fetchStudents()
      toast.success('Siswa berhasil ditambahkan')
    } catch (err) {
      console.error('StudentManagement: Error creating student:', err);
      setError('Gagal menambahkan siswa')
      toast.error('Gagal menambahkan siswa')
    } finally {
      setLoading(false)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    console.log(`StudentManagement: Updating student ID ${selectedStudent.id} with:`, editStudentForm);
    try {
      setLoading(true)
      console.log('StudentManagement: Calling studentsAPI.update()');
      const result = await studentsAPI.update(selectedStudent.id, editStudentForm)
      console.log('StudentManagement: Successfully updated student, received:', result);
      setShowEditModal(false)
      fetchStudents()
      toast.success('Data siswa berhasil diperbarui')
    } catch (err) {
      console.error('StudentManagement: Error updating student:', err);
      setError('Gagal memperbarui data siswa')
      toast.error('Gagal memperbarui data siswa')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    console.log(`StudentManagement: Deleting student ID ${selectedStudent.id}`);
    try {
      setLoading(true)
      console.log('StudentManagement: Calling studentsAPI.delete()');
      const result = await studentsAPI.delete(selectedStudent.id)
      console.log('StudentManagement: Successfully deleted student, received:', result);
      setShowDeleteModal(false)
      fetchStudents()
      toast.success('Siswa berhasil dihapus')
    } catch (err) {
      console.error('StudentManagement: Error deleting student:', err);
      setError('Gagal menghapus siswa')
      toast.error('Gagal menghapus siswa')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStudent({
      ...newStudent,
      [name]: value
    })
  }

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditStudentForm({
      ...editStudentForm,
      [name]: value
    })
  }

  const handleParentSelect = (parent) => {
    setNewStudent({
      ...newStudent,
      parent_id: parent.id
    })
    setParentSearchTerm(parent.name)
    setShowParentDropdown(false)
  }

  const handleEditParentSelect = (parent) => {
    setEditStudentForm({
      ...editStudentForm,
      parent_id: parent.id
    })
    setParentSearchTerm(parent.name)
    setShowEditParentDropdown(false)
  }

  // Get parent name by id
  const getParentName = (parentId) => {
    const parent = parents.find(p => p.id === parentId)
    return parent ? parent.name : '-'
  }

  // Calculate statistics
  const totalStudents = students.length;

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Kelola Siswa</h2>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Daftar Siswa</h5>
                <button
                  onClick={handleAddClick}
                  className="btn btn-primary btn-sm"
                  disabled={loading}
                >
                  <i className="bi bi-plus-lg me-1"></i>
                  Tambah Siswa
                </button>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-people text-muted" style={{ fontSize: '3rem' }}></i>
                  <p className="mt-3 text-muted">Belum ada data siswa</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>NISN</th>
                        <th>Nama</th>
                        <th>Tanggal Lahir</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(student => (
                        <tr key={student.id}>
                          <td>{student.nisn}</td>
                          <td>{student.name}</td>
                          <td>{student.birth_date ? new Date(student.birth_date).toLocaleDateString('id-ID') : '-'}</td>
                          <td>
                            <div className="btn-group">
                              <button
                                onClick={() => handleViewClick(student)}
                                className="btn btn-sm btn-outline-info me-1"
                                title="Lihat Detail"
                              >
                                <i className="bi bi-eye"></i>
                              </button>
                              <button
                                onClick={() => handleEditClick(student)}
                                className="btn btn-sm btn-outline-primary me-1"
                                disabled={loading}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                onClick={() => handleDeleteClick(student)}
                                className="btn btn-sm btn-outline-danger"
                                disabled={loading}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-header bg-white">
              <h5 className="card-title mb-0">Statistik Siswa</h5>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <h6 className="text-muted mb-2">Total Siswa</h6>
                <h3 className="mb-0">{totalStudents}</h3>
              </div>
              <div className="alert alert-info mb-0">
                <i className="bi bi-info-circle me-2"></i>
                <small>Menampilkan total {totalStudents} siswa yang terdaftar dalam sistem.</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Tambah Siswa</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <form onSubmit={handleAddSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="nisn" className="form-label">NISN</label>
                    <input
                      type="text"
                      className="form-control"
                      id="nisn"
                      name="nisn"
                      value={newStudent.nisn}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">Nama</label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      name="name"
                      value={newStudent.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="birth_date" className="form-label">Tanggal Lahir</label>
                    <input
                      type="date"
                      className="form-control"
                      id="birth_date"
                      name="birth_date"
                      value={newStudent.birth_date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="parent_id" className="form-label">Orang Tua</label>
                    <div className="position-relative">
                      <input
                        type="text"
                        className="form-control"
                        id="parent_search"
                        placeholder="Cari orang tua..."
                        value={parentSearchTerm}
                        onChange={(e) => {
                          setParentSearchTerm(e.target.value)
                          setShowParentDropdown(true)
                        }}
                        onFocus={() => setShowParentDropdown(true)}
                      />
                      <input 
                        type="hidden" 
                        id="parent_id"
                        name="parent_id"
                        value={newStudent.parent_id}
                      />
                      {showParentDropdown && (
                        <div 
                          className="position-absolute w-100 border rounded bg-white shadow-sm"
                          style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}
                        >
                          {parentsLoading ? (
                            <div className="p-2 text-center">
                              <div className="spinner-border spinner-border-sm text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            </div>
                          ) : filteredParents.length === 0 ? (
                            <div className="p-2 text-center text-muted">Tidak ditemukan</div>
                          ) : (
                            filteredParents.map(parent => (
                              <div 
                                key={parent.id}
                                className="p-2 border-bottom cursor-pointer hover-bg-light"
                                onClick={() => handleParentSelect(parent)}
                                style={{ cursor: 'pointer' }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = ''}
                              >
                                <div className="fw-bold">{parent.name}</div>
                                <small>{parent.email || '-'}</small>
                                {parent.phone && <div><small>Telp: {parent.phone}</small></div>}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    {newStudent.parent_id && (
                      <div className="form-text text-success">
                        <i className="bi bi-check-circle me-1"></i>
                        Terpilih: {getParentName(newStudent.parent_id)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAddModal(false)}
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
                        Menyimpan...
                      </>
                    ) : (
                      'Simpan'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Student Modal */}
      {showViewModal && selectedStudent && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Detail Siswa</h5>
                <button type="button" className="btn-close" onClick={() => setShowViewModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-4 fw-bold">ID</div>
                  <div className="col-md-8">{selectedStudent.id}</div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-4 fw-bold">NISN</div>
                  <div className="col-md-8">{selectedStudent.nisn}</div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-4 fw-bold">Nama</div>
                  <div className="col-md-8">{selectedStudent.name}</div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-4 fw-bold">Tanggal Lahir</div>
                  <div className="col-md-8">
                    {selectedStudent.birth_date ? new Date(selectedStudent.birth_date).toLocaleDateString('id-ID') : '-'}
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-4 fw-bold">Orang Tua</div>
                  <div className="col-md-8">{selectedStudent.parent_id ? getParentName(selectedStudent.parent_id) : '-'}</div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-4 fw-bold">Dibuat Pada</div>
                  <div className="col-md-8">
                    {selectedStudent.createdAt ? new Date(selectedStudent.createdAt).toLocaleString('id-ID') : '-'}
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-4 fw-bold">Diperbarui Pada</div>
                  <div className="col-md-8">
                    {selectedStudent.updatedAt ? new Date(selectedStudent.updatedAt).toLocaleString('id-ID') : '-'}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowViewModal(false)}
                >
                  Tutup
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditClick(selectedStudent);
                  }}
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && selectedStudent && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Siswa</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="edit-nisn" className="form-label">NISN</label>
                    <input
                      type="text"
                      className="form-control"
                      id="edit-nisn"
                      name="nisn"
                      value={editStudentForm.nisn}
                      onChange={handleEditInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="edit-name" className="form-label">Nama</label>
                    <input
                      type="text"
                      className="form-control"
                      id="edit-name"
                      name="name"
                      value={editStudentForm.name}
                      onChange={handleEditInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="edit-birth_date" className="form-label">Tanggal Lahir</label>
                    <input
                      type="date"
                      className="form-control"
                      id="edit-birth_date"
                      name="birth_date"
                      value={editStudentForm.birth_date}
                      onChange={handleEditInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="edit-parent_id" className="form-label">Orang Tua</label>
                    <div className="position-relative">
                      <input
                        type="text"
                        className="form-control"
                        id="edit-parent_search"
                        placeholder="Cari orang tua..."
                        value={parentSearchTerm}
                        onChange={(e) => {
                          setParentSearchTerm(e.target.value)
                          setShowEditParentDropdown(true)
                        }}
                        onFocus={() => setShowEditParentDropdown(true)}
                      />
                      <input 
                        type="hidden" 
                        id="edit-parent_id"
                        name="parent_id"
                        value={editStudentForm.parent_id}
                      />
                      {showEditParentDropdown && (
                        <div 
                          className="position-absolute w-100 border rounded bg-white shadow-sm"
                          style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}
                        >
                          {parentsLoading ? (
                            <div className="p-2 text-center">
                              <div className="spinner-border spinner-border-sm text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            </div>
                          ) : filteredParents.length === 0 ? (
                            <div className="p-2 text-center text-muted">Tidak ditemukan</div>
                          ) : (
                            filteredParents.map(parent => (
                              <div 
                                key={parent.id}
                                className="p-2 border-bottom cursor-pointer hover-bg-light"
                                onClick={() => handleEditParentSelect(parent)}
                                style={{ cursor: 'pointer' }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = ''}
                              >
                                <div className="fw-bold">{parent.name}</div>
                                <small>{parent.email || '-'}</small>
                                {parent.phone && <div><small>Telp: {parent.phone}</small></div>}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    {editStudentForm.parent_id && (
                      <div className="form-text text-success">
                        <i className="bi bi-check-circle me-1"></i>
                        Terpilih: {getParentName(editStudentForm.parent_id)}
                      </div>
                    )}
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
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Menyimpan...
                      </>
                    ) : (
                      'Simpan'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Student Modal */}
      {showDeleteModal && selectedStudent && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Konfirmasi Hapus</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Anda yakin ingin menghapus siswa ini?</p>
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Data yang dihapus tidak dapat dikembalikan.
                </div>
                <div className="mt-3">
                  <p className="mb-1"><strong>ID:</strong> {selectedStudent.id}</p>
                  <p className="mb-1"><strong>NISN:</strong> {selectedStudent.nisn}</p>
                  <p className="mb-0"><strong>Nama:</strong> {selectedStudent.name}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={loading}
                >
                  Batal
                </button>
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentManagement 