import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { teachersAPI } from '../utils/api'

function TeacherDashboard() {
  const { currentUser } = useAuth()
  const [teacherData, setTeacherData] = useState(null)
  const [classData, setClassData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTeacherData()
  }, [])

  const fetchTeacherData = async () => {
    try {
      setIsLoading(true)
      // Fetch teacher profile and class data
      const [profileResponse, classResponse] = await Promise.all([
        fetch('https://darustrack-backend-production.up.railway.app/auth/profile', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }).then(async res => {
          if (!res.ok) {
            throw new Error('Failed to fetch profile');
          }
          return res.json();
        }),
        teachersAPI.getMyClass()
      ])

      // Set teacher data from profile response
      setTeacherData({
        name: profileResponse.name,
        email: profileResponse.email,
        nip: profileResponse.nip,
        role: profileResponse.role,
        class_id: profileResponse.class_id
      })

      // Extract class data from the response
      console.log('My class data:', classResponse) // For debugging
      
      // Check if the response has the class property in the expected structure
      if (classResponse && classResponse.class) {
        setClassData(classResponse.class)
      } else if (classResponse && typeof classResponse === 'object') {
        // If class is not nested but directly in the response
        setClassData(classResponse)
      } else {
        console.error('Unexpected class data structure:', classResponse)
        setError('Format data kelas tidak sesuai')
      }
      
      setError(null)
    } catch (err) {
      console.error('Error fetching teacher data:', err)
      setError('Gagal mengambil data guru dan kelas')
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
      {/* Teacher Profile and Class Info Section */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <div className="avatar-lg me-3 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '64px', height: '64px' }}>
                  <span className="h3 mb-0">{teacherData?.name?.charAt(0) || 'G'}</span>
                </div>
                <div>
                  <h4 className="mb-1">{teacherData?.name}</h4>
                  <p className="text-muted mb-0">Wali Kelas</p>
                </div>
              </div>
              <hr />
              <div className="mb-3">
                <h6 className="text-muted mb-2">Informasi Guru</h6>
                <p className="mb-1"><strong>NIP:</strong> {teacherData?.nip || '-'}</p>
                <p className="mb-1"><strong>Email:</strong> {teacherData?.email}</p>
              </div>
              <hr />
              <div className="mb-3">
                <h6 className="text-muted mb-2">Informasi Kelas</h6>
                <p className="mb-1"><strong>Nama Kelas:</strong> {classData?.name || '-'}</p>
                
                <p className="mb-1"><strong>ID Kelas:</strong> {classData?.id || '-'}</p>
      
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeacherDashboard
