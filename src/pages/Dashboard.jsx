import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ParentDashboard from '../dashboards/ParentDashboard'
import TeacherDashboard from '../dashboards/TeacherDashboard'
import AdminDashboard from '../dashboards/AdminDashboard'
import PrincipalDashboard from '../dashboards/PrincipalDashboard'

function Dashboard() {
  const { userRole } = useAuth()
  const [student, setStudent] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  console.log('Dashboard rendering with userRole:', userRole)

  useEffect(() => {
    // Simulating API call to get student data
    setIsLoading(true)

    // Log when dashboard is loaded for kepala_sekolah
    if (userRole === 'kepala_sekolah') {
      console.log('Kepala Sekolah dashboard is loading...')
    }

    // In a real app, this would be an API call
    setTimeout(() => {
      if (userRole === 'orang_tua') {
        setStudent({
          name: 'Andre Setiawan',
          birthDate: '1 Desember 2017',
          class: '2 A',
          homeRoomTeacher: 'Budiono Sp.d',
          attendance: 95,
          gpa: 3.8,
          recentGrades: [
            { subject: 'Matematika', grade: 'A-', score: 87 },
            { subject: 'IPA', grade: 'A', score: 92 },
            { subject: 'Bahasa', grade: 'B+', score: 84 },
          ],
          behavior: 'Baik',
          upcomingTests: [
            { subject: 'Matematika', date: '18 Maret 2025', topic: 'Statistika' },
            { subject: 'IPA', date: '20 Maret 2025', topic: 'Biologi' }
          ]
        })
      }
      setIsLoading(false)
    }, 1000)
  }, [userRole])

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Dashboard</h2>
      </div>

      {userRole === 'orang_tua' && student && <ParentDashboard student={student} />}
      {userRole === 'wali_kelas' && <TeacherDashboard />}
      {userRole === 'admin' && <AdminDashboard />}
      {userRole === 'kepala_sekolah' && <PrincipalDashboard />}

      <div className="row mt-4">
        <div className="col-md-7">
        </div>
        <div className="col-md-5">
        </div>
      </div>
    </div>
  )
}

export default Dashboard
