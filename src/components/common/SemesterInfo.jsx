import React from 'react'
import { useSemester } from '../../contexts/SemesterContext'

function SemesterInfo() {
  const { activeSemester, loading, error } = useSemester()

  if (loading) {
    return (
      <div className="d-flex align-items-center text-muted">
        <div className="spinner-border spinner-border-sm me-2" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <small>Memuat semester...</small>
      </div>
    )
  }

  if (error) {
    return (
      <div className="d-flex align-items-center text-danger">
        <i className="bi bi-exclamation-triangle-fill me-1"></i>
        <small>{error}</small>
      </div>
    )
  }

  if (!activeSemester) {
    return (
      <div className="d-flex align-items-center text-warning">
        <i className="bi bi-exclamation-circle-fill me-1"></i>
        <small>Tidak ada semester aktif</small>
      </div>
    )
  }

  // Get semester display name, ensuring we don't show "undefined"
  const getSemesterName = () => {
    if (activeSemester.name) {
      return activeSemester.name;
    }
    if (activeSemester.semester) {
      return `Semester ${activeSemester.semester}`;
    }
    if (activeSemester.number) {
      return `Semester ${activeSemester.number}`;
    }
    return ""; // Return empty string instead of undefined
  }

  const semesterName = getSemesterName();
  
  // If no valid name is available, only show the badge without the name
  return (
    <div className="d-flex align-items-center">
      <div className="semester-badge d-flex align-items-center">
        <span className="badge bg-primary-subtle text-primary rounded-pill me-2">
          <i className="bi bi-calendar-event me-1"></i>
          Semester Aktif
        </span>
        {semesterName && (
          <div className="fw-medium">
            {semesterName}
          </div>
        )}
      </div>
    </div>
  )
}

export default SemesterInfo 