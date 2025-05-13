import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { authAPI, parentsAPI } from '../utils/api'
import { toast } from 'react-toastify';

function ParentDashboard() {
  const { currentUser } = useAuth()
  const [userProfile, setUserProfile] = useState(null)
  const [studentData, setStudentData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProfileData = async () => {
    try {
      setLoading(true)

      // Fetch user profile from auth API
      const userData = await authAPI.getProfile()
      console.log('User profile data:', userData)
      setUserProfile(userData)

      // Fetch student data using the correct endpoint
      const student = await parentsAPI.getStudentData()
      console.log('Student data:', student)
      setStudentData(student)

      setError(null)
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser) {
      fetchProfileData()
    }
  }, [currentUser])

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <i className="bi bi-exclamation-triangle me-2"></i>
        {error}
        <button
          className="btn btn-sm btn-danger ms-3"
          onClick={fetchProfileData}
        >
          Coba Lagi
        </button>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="alert alert-info" role="alert">
        <i className="bi bi-info-circle me-2"></i>
        Tidak ada data profil yang tersedia.
        <button
          className="btn btn-sm btn-primary ms-3"
          onClick={fetchProfileData}
        >
          Refresh
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* User Profile Card */}
      <div className="card mb-4">
        <div className="card-header bg-white">
          <h5 className="card-title mb-0">Profil Pengguna</h5>
        </div>
        <div className="card-body">
          <div className="d-flex align-items-center mb-4">
            <div className="avatar-lg me-3 bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center">
              <span className="display-5 text-primary">{userProfile.name ? userProfile.name.charAt(0) : '?'}</span>
            </div>
            <div>
              <h3 className="mb-1">{userProfile.name || 'Unnamed User'}</h3>
              <p className="text-muted mb-0">
                <i className="bi bi-envelope me-2"></i>
                {userProfile.email || '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Student Information */}
        <div className="card">
          <div className="card-header bg-white">
            <h5 className="card-title mb-0">Data Anak</h5>
          </div>
          <div className="card-body">
          {!studentData ? (
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                Tidak ada data anak yang tersedia.
              </div>
            ) : (
              <div className="row">
                <div className="col-md-6 mb-3">
                  <p className="text-muted mb-1">Nama</p>
                <p className="fw-bold mb-0">{studentData.name || '-'}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <p className="text-muted mb-1">NISN</p>
                <p className="fw-bold mb-0">{studentData.nisn || '-'}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <p className="text-muted mb-1">Tanggal Lahir</p>
                <p className="fw-bold mb-0">{studentData.birth_date || '-'}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <p className="text-muted mb-1">Kelas</p>
                <p className="fw-bold mb-0">
                  {studentData.student_class && studentData.student_class.length > 0
                    ? (studentData.student_class[0].class?.name || studentData.student_class[0].id || '-')
                    : '-'}
                </p>
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  )
}

export default ParentDashboard
