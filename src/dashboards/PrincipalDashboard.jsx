import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

function PrincipalDashboard() {
  const { currentUser } = useAuth()
  const [principalData, setPrincipalData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPrincipalData()
  }, [])

  const fetchPrincipalData = async () => {
    try {
      setIsLoading(true)
      // Fetch principal profile data
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

      // Set principal data from profile response
      setPrincipalData({
        name: profileData.name,
        email: profileData.email,
        nip: profileData.nip,
        role: profileData.role,
        phone: profileData.phone
      })

      setError(null)
    } catch (err) {
      console.error('Error fetching principal data:', err)
      setError('Gagal mengambil data kepala sekolah')
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
      {/* Principal Profile Section */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <div className="avatar-lg me-3 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '64px', height: '64px' }}>
                  <span className="h3 mb-0">{principalData?.name?.charAt(0) || 'K'}</span>
                </div>
                <div>
                  <h4 className="mb-1">{principalData?.name}</h4>
                  <p className="text-muted mb-0">Kepala Sekolah</p>
                </div>
              </div>
              <hr />
              <div className="mb-3">
                <h6 className="text-muted mb-2">Informasi Kepala Sekolah</h6>
                <p className="mb-1"><strong>Email:</strong> {principalData?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrincipalDashboard
