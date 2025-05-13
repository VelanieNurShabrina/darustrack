import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

function AdminDashboard() {
  const { currentUser } = useAuth()
  const [adminData, setAdminData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      setIsLoading(true)
      // Fetch admin profile data
      const profileResponse = await fetch('https://darustrack-backend-production.up.railway.app/auth/profile', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!profileResponse.ok) {
        throw new Error('Failed to fetch profile')
      }

      const profileData = await profileResponse.json()

      // Set admin data from profile response
      setAdminData({
        name: profileData.name,
        email: profileData.email,
        nip: profileData.nip,
        role: profileData.role,
        phone: profileData.phone
      })

      setError(null)
    } catch (err) {
      console.error('Error fetching admin data:', err)
      setError('Gagal mengambil data admin')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        {error}
      </div>
    )
  }

  return (
    <div>
      {/* Admin Profile Section */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <div className="avatar-lg me-3 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '64px', height: '64px' }}>
                  <span className="h3 mb-0">{adminData?.name?.charAt(0) || 'A'}</span>
                </div>
                <div>
                  <h4 className="mb-1">{adminData?.name}</h4>
                  <p className="text-muted mb-0">Administrator</p>
                </div>
              </div>
              <hr />
              <div className="mb-3">
                <h6 className="text-muted mb-2">Informasi Administrator</h6>
                <p className="mb-1"><strong>Email:</strong> {adminData?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
