import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usersAPI } from '../utils/api'

function UserManagement() {
  const [users, setUsers] = useState([])
  const [selectedRole, setSelectedRole] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [usersPerPage] = useState(10)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: '',
    status: '',
    class_id: '',
    nip: ''
  })
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'orang_tua',
    status: 'active',
    nip: ''
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { currentUser, userRole } = useAuth()
  const navigate = useNavigate()

  // Check if user is admin
  useEffect(() => {
    if (!currentUser || userRole !== 'admin') {
      navigate('/dashboard')
    }
  }, [currentUser, userRole, navigate])

  // Fetch users from API
  const fetchUsers = async (roleFilter = null) => {
    try {
      setLoading(true)
      const response = await usersAPI.getAll(roleFilter)
      // Ensure we have the class_id for each user
      const usersWithClassId = Array.isArray(response) ? response.map(user => ({
        ...user,
        class_id: user.class_id || ''
      })) : []
      setUsers(usersWithClassId)
      setError(null)
    } catch (err) {
      setError('Failed to fetch users')
      console.error('Error fetching users:', err)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser && userRole === 'admin') {
      fetchUsers(selectedRole === 'all' ? null : selectedRole)
    }
  }, [currentUser, userRole, selectedRole])

  const handleRoleFilter = (e) => {
    setSelectedRole(e.target.value)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewUser(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (userRole !== 'admin') {
      setError('Only administrators can add new users')
      return
    }

    // Validate NIP for wali_kelas role
    if (newUser.role === 'wali_kelas' && !newUser.nip) {
      setError('NIP is required for Wali Kelas')
      return
    }

    try {
      setLoading(true)
      const response = await usersAPI.create(newUser)
      // Add the new user to the list if response is successful
      if (response) {
        setUsers(prev => [...prev, response])
        setNewUser({ name: '', email: '', password: '', role: 'orang_tua', status: 'active', nip: '' })
        setError(null)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user')
      console.error('Error creating user:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusToggle = async (id) => {
    if (userRole !== 'admin') {
      setError('Only administrators can modify user status')
      return
    }

    try {
      setLoading(true)
      const userToUpdate = users.find(user => user.id === id)
      const newStatus = userToUpdate.status === 'active' ? 'inactive' : 'active'

      await usersAPI.update(id, { ...userToUpdate, status: newStatus })

    setUsers(users.map(user => {
      if (user.id === id) {
          return { ...user, status: newStatus }
      }
      return user
    }))
      setError(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user status')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (id) => {
    try {
      setLoading(true)
      const response = await usersAPI.getById(id)

      // Ensure we have the class_id from the API response
      const userData = {
        ...response,
        class_id: response.class_id || ''
      }

      console.log('User data:', userData) // Add this for debugging

      setSelectedUser(userData)
      setEditForm({
        name: userData.name,
        email: userData.email,
        role: userData.role,
        status: userData.status,
        class_id: userData.class_id || '',
        nip: userData.nip || ''
      })
      setShowDetailsModal(true)
      setError(null)
    } catch (err) {
      setError('Failed to fetch user details')
      console.error('Error fetching user details:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleEditCancel = () => {
    setIsEditing(false)
    setEditForm({
      name: selectedUser.name,
      email: selectedUser.email,
      role: selectedUser.role,
      status: selectedUser.status,
      class_id: selectedUser.class_id || '',
      nip: selectedUser.nip || ''
    })
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditForm(prev => ({ ...prev, [name]: value }))
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)
      setError(null)

      // Create update data object with only the fields that are allowed
      const updateData = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role
      }

      // Only include nip if role is wali_kelas and nip exists
      if (editForm.role === 'wali_kelas' && editForm.nip) {
        updateData.nip = editForm.nip
      }

      // Validate required fields
      if (!updateData.name || !updateData.email || !updateData.role) {
        throw new Error('Please fill in all required fields')
      }

      const response = await usersAPI.update(selectedUser.id, updateData)

      // Update the users list with the edited user
      setUsers(prevUsers => prevUsers.map(user =>
        user.id === selectedUser.id ? { ...user, ...response } : user
      ))

      // Update the selected user view
      setSelectedUser(prev => ({ ...prev, ...response }))
      setIsEditing(false)
      setError(null)

      // Show success message
      const successMessage = document.createElement('div')
      successMessage.className = 'alert alert-success'
      successMessage.textContent = 'User updated successfully'
      document.querySelector('.modal-body').insertBefore(successMessage, document.querySelector('.modal-body').firstChild)
      setTimeout(() => successMessage.remove(), 3000)

    } catch (err) {
      console.error('Error updating user:', err)
      setError(err.message || 'Failed to update user. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const closeDetailsModal = () => {
    setShowDetailsModal(false)
    setSelectedUser(null)
  }

  const handleDeleteClick = (user) => {
    setUserToDelete(user)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    try {
      setLoading(true)
      await usersAPI.delete(userToDelete.id)
      setUsers(users.filter(user => user.id !== userToDelete.id))
      setShowDeleteModal(false)
      setUserToDelete(null)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user')
      console.error('Error deleting user:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setUserToDelete(null)
  }

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = Array.isArray(users) ? users.slice(indexOfFirstUser, indexOfLastUser) : [];
  const totalPages = Math.ceil((users?.length || 0) / usersPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Go to previous page
  const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  // Go to next page
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRole]);

  // Function to get pagination items
  const getPaginationItems = () => {
    const delta = 2; // Number of pages to show before and after current page
    const range = [];
    const rangeWithDots = [];

    // Always show first page
    range.push(1);

    // Calculate visible page numbers
    for (let i = 2; i <= totalPages; i++) {
      if (
        i === totalPages || // Always show last page
        (currentPage - delta <= i && i <= currentPage + delta) // Show pages near current page
      ) {
        range.push(i);
      }
    }

    // Add dots between page numbers
    let prev = 0;
    for (const i of range) {
      if (prev + 1 !== i) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(i);
      prev = i;
    }

    return rangeWithDots;
  };

  if (!currentUser || userRole !== 'admin') {
    return null
  }

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Kelola Pengguna</h2>

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
                <h5 className="card-title mb-0">Daftar Pengguna</h5>
                <select
                  className="form-select form-select-sm w-auto"
                  value={selectedRole}
                  onChange={handleRoleFilter}
                  disabled={loading}
                >
                  <option value="all">Semua Peran</option>
                  <option value="wali_kelas">Guru</option>
                  <option value="orang_tua">Orang Tua</option>
                  <option value="admin">Admin</option>
                  <option value="kepala_sekolah">Kepala Sekolah</option>
                </select>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
              <div className="table-responsive">
                {users.length > 0 && (
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="text-muted small">
                      Menampilkan {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, users.length)} dari {users.length} pengguna
                    </div>
                    {totalPages > 1 && (
                      <div className="text-muted small">
                        Halaman {currentPage} dari {totalPages}
                      </div>
                    )}
                  </div>
                )}
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Nama</th>
                      <th>Email</th>
                      <th>Peran</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(currentUsers) && currentUsers.map((user) => (
                      <tr key={user.id || Math.random()}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          {user.role === 'admin' && <span className="badge bg-danger">Admin</span>}
                          {user.role === 'wali_kelas' && <span className="badge bg-primary">Guru</span>}
                          {user.role === 'orang_tua' && <span className="badge bg-success">Orang Tua</span>}
                          {user.role === 'kepala_sekolah' && <span className="badge bg-warning">Kepala Sekolah</span>}
                        </td>
                        <td>
                          <div className="btn-group">
                            <button
                              className="btn btn-sm btn-outline-primary me-1"
                              onClick={() => handleViewDetails(user.id)}
                              disabled={loading}
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteClick(user)}
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
                {totalPages > 1 && (
                  <div className="d-flex justify-content-center mt-4">
                    <nav aria-label="Page navigation">
                      <ul className="pagination">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button
                            className="page-link"
                            onClick={goToPrevPage}
                            disabled={currentPage === 1}
                            aria-label="Previous"
                          >
                            <span aria-hidden="true">&laquo;</span>
                          </button>
                        </li>
                        {getPaginationItems().map((item, index) => (
                          <li key={index} className={`page-item ${item === '...' ? 'disabled' : ''} ${currentPage === item ? 'active' : ''}`}>
                            <button
                              onClick={() => item !== '...' ? paginate(item) : null}
                              className="page-link"
                              disabled={item === '...'}
                            >
                              {item}
                            </button>
                          </li>
                        ))}
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                          <button
                            className="page-link"
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                            aria-label="Next"
                          >
                            <span aria-hidden="true">&raquo;</span>
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
                {users.length === 0 && !loading && (
                  <div className="text-center py-4 text-muted">
                    <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                    Tidak ada pengguna ditemukan
                  </div>
                )}
              </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-header bg-white">
              <h5 className="card-title mb-0">Tambah Pengguna Baru</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="name" className="form-label">Nama</label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      name="name"
                      value={newUser.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={newUser.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      name="password"
                      value={newUser.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="role" className="form-label">Role</label>
                    <select
                      className="form-select"
                      id="role"
                      name="role"
                      value={newUser.role}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="orang_tua">Orang Tua</option>
                      <option value="wali_kelas">Wali Kelas</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  {newUser.role === 'wali_kelas' && (
                    <div className="col-md-6 mb-3">
                      <label htmlFor="nip" className="form-label">NIP</label>
                      <input
                        type="text"
                        className="form-control"
                        id="nip"
                        name="nip"
                        value={newUser.nip}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  )}

                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Adding...' : 'Add User'}
                </button>
              </form>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-header bg-white">
              <h5 className="card-title mb-0">Statistik Pengguna</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Guru</span>
                  <span className="badge bg-primary">{users.filter(u => u.role === 'wali_kelas').length}</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div
                    className="progress-bar bg-primary"
                    style={{ width: `${users.length ? (users.filter(u => u.role === 'wali_kelas').length / users.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Orang Tua</span>
                  <span className="badge bg-success">{users.filter(u => u.role === 'orang_tua').length}</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div
                    className="progress-bar bg-success"
                    style={{ width: `${users.length ? (users.filter(u => u.role === 'orang_tua').length / users.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Admin</span>
                  <span className="badge bg-danger">{users.filter(u => u.role === 'admin').length}</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div
                    className="progress-bar bg-danger"
                    style={{ width: `${users.length ? (users.filter(u => u.role === 'admin').length / users.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Kepala Sekolah</span>
                  <span className="badge bg-warning">{users.filter(u => u.role === 'kepala_sekolah').length}</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div
                    className="progress-bar bg-warning"
                    style={{ width: `${users.length ? (users.filter(u => u.role === 'kepala_sekolah').length / users.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Detail Pengguna</h5>
                <button type="button" className="btn-close" onClick={closeDetailsModal}></button>
              </div>
              <div className="modal-body">
                {isEditing ? (
                  <form onSubmit={handleEditSubmit}>
                    <div className="mb-3">
                      <label htmlFor="edit-name" className="form-label">Nama Lengkap</label>
                      <input
                        type="text"
                        className="form-control"
                        id="edit-name"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="edit-email" className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        id="edit-email"
                        name="email"
                        value={editForm.email}
                        onChange={handleEditChange}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="edit-role" className="form-label">Peran</label>
                      <select
                        className="form-select"
                        id="edit-role"
                        name="role"
                        value={editForm.role}
                        onChange={handleEditChange}
                        required
                        disabled={loading}
                      >
                        <option value="orang_tua">Orang Tua</option>
                        <option value="admin">Admin</option>
                        <option value="kepala_sekolah">Kepala Sekolah</option>
                        <option value="wali_kelas">Wali Kelas</option>
                      </select>
                    </div>
                    {editForm.role === 'wali_kelas' && (
                      <>
                        <div className="mb-3">
                          <label htmlFor="edit-nip" className="form-label">NIP</label>
                          <input
                            type="text"
                            className="form-control"
                            id="edit-nip"
                            name="nip"
                            value={editForm.nip}
                            onChange={handleEditChange}
                            required
                          />
                        </div>
                      </>
                    )}
                    <div className="mb-3">
                      <label htmlFor="edit-status" className="form-label">Status</label>
                      <select
                        className="form-select"
                        id="edit-status"
                        name="status"
                        value={editForm.status}
                        onChange={handleEditChange}
                        required
                        disabled={loading}
                      >
                        <option value="active">Aktif</option>
                        <option value="inactive">Tidak Aktif</option>
                      </select>
                    </div>
                    <div className="d-flex gap-2">
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
                          <>
                            <i className="bi bi-check-lg me-2"></i>
                            Simpan
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleEditCancel}
                        disabled={loading}
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="mb-3">
                      <label className="fw-bold">Nama Lengkap</label>
                      <p>{selectedUser.name}</p>
                    </div>
                    <div className="mb-3">
                      <label className="fw-bold">Email</label>
                      <p>{selectedUser.email}</p>
                    </div>
                    <div className="mb-3">
                      <label className="fw-bold">Peran</label>
                      <p>
                        {selectedUser.role === 'admin' && <span className="badge bg-danger">Admin</span>}
                        {selectedUser.role === 'wali_kelas' && <span className="badge bg-primary">Guru</span>}
                        {selectedUser.role === 'orang_tua' && <span className="badge bg-success">Orang Tua</span>}
                        {selectedUser.role === 'kepala_sekolah' && <span className="badge bg-warning">Kepala Sekolah</span>}
                      </p>
                    </div>
                    {selectedUser.role === 'wali_kelas' && (
                      <>
                        <div className="mb-3">
                          <label className="fw-bold">NIP</label>
                          <p>{selectedUser.nip || '-'}</p>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
              <div className="modal-footer">
                {!isEditing && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleEditClick}
                    disabled={loading}
                  >
                    <i className="bi bi-pencil me-2"></i>
                    Edit
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeDetailsModal}
                  disabled={loading}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Konfirmasi Hapus</h5>
                <button type="button" className="btn-close" onClick={handleDeleteCancel}></button>
              </div>
              <div className="modal-body">
                <p>Anda yakin ingin menghapus pengguna ini?</p>
                <div className="alert alert-warning">
                  <strong>Nama:</strong> {userToDelete.name}<br />
                  <strong>Email:</strong> {userToDelete.email}<br />
                  <strong>Peran:</strong>{' '}
                  {userToDelete.role === 'admin' && <span className="badge bg-danger">Admin</span>}
                  {userToDelete.role === 'wali_kelas' && <span className="badge bg-primary">Guru</span>}
                  {userToDelete.role === 'orang_tua' && <span className="badge bg-success">Orang Tua</span>}
                  {userToDelete.role === 'kepala_sekolah' && <span className="badge bg-warning">Kepala Sekolah</span>}
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
                  onClick={handleDeleteCancel}
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

export default UserManagement
