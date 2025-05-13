import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../utils/api'
import { toast } from 'react-toastify'

function Profile() {
  const { userRole, currentUser } = useAuth()
  const [student, setStudent] = useState(null)
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: ''
  })
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    fetchUserProfile()

    // Student data for parent role (can be removed when API is fully implemented)
    if (userRole === 'parent') {
      setStudent({
        name: 'Andre Setiawan',
        birthDate: '1 Desember 2017',
        class: '2 A',
        homeRoomTeacher: 'Budiono Sp.d'
      })
    }
  }, [userRole])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      const data = await authAPI.getProfile()

      if (data) {
        setProfileData({
          name: data.name || '',
          email: data.email || '',
          password: ''
        })
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      toast.error('Gagal memuat profil')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!profileData.password) {
      toast.error('Password harus diisi')
      return
    }

    try {
      setLoading(true)
      await authAPI.updateProfile({
        password: profileData.password
      })
      setIsEditing(false)
      setProfileData(prev => ({
        ...prev,
        password: ''
      }))
      toast.success('Profil berhasil diperbarui')
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast.error('Gagal memperbarui profil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-md-8">
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="card-title text-primary">Profil</h2>
                {!isEditing ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => setIsEditing(true)}
                  >
                    <i className="bi bi-pencil me-2"></i>Edit Profil
                  </button>
                ) : null}
              </div>

              {loading ? (
                <div className="d-flex justify-content-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : isEditing ? (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">Nama</label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      name="name"
                      value={profileData.name}
                      onChange={handleInputChange}
                      required
                      readOnly
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleInputChange}
                      required
                      readOnly
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">Ubah Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      name="password"
                      value={profileData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-success" disabled={loading}>
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Menyimpan...
                        </>
                      ) : 'Simpan Perubahan'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setIsEditing(false)
                        setProfileData(prev => ({
                          ...prev,
                          password: ''
                        }))
                      }}
                    >
                      Batal
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-4">
                  <div className="row mb-3">
                    <div className="col-sm-3">
                      <h6 className="mb-0">Nama</h6>
                    </div>
                    <div className="col-sm-9 text-secondary">
                      {profileData.name}
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-sm-3">
                      <h6 className="mb-0">Email</h6>
                    </div>
                    <div className="col-sm-9 text-secondary">
                      {profileData.email}
                    </div>
                  </div>


                  
                </div>
              )}

              {userRole === 'parent' && student && !isEditing && (
                <div className="mt-4">
                  <h4 className="text-primary mb-3">Data Siswa</h4>
                  <div className="row mb-3">
                    <div className="col-sm-3">
                      <h6 className="mb-0">Nama</h6>
                    </div>
                    <div className="col-sm-9 text-secondary">
                      {student.name}
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-sm-3">
                      <h6 className="mb-0">Tanggal Lahir</h6>
                    </div>
                    <div className="col-sm-9 text-secondary">
                      {student.birthDate}
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-sm-3">
                      <h6 className="mb-0">Kelas</h6>
                    </div>
                    <div className="col-sm-9 text-secondary">
                      {student.class}
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-sm-3">
                      <h6 className="mb-0">Wali Kelas</h6>
                    </div>
                    <div className="col-sm-9 text-secondary">
                      {student.homeRoomTeacher}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
