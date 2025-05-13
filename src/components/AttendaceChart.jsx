// AttendanceChart.jsx
import React from 'react'

function AttendanceChart({ attendance = 95 }) {
  return (
    <div className="chart-container text-center">
      <h6 className="mb-3">Tingkat Absen</h6>
      <div className="position-relative">
        <div className="chart-placeholder bg-light rounded-circle mx-auto" style={{ width: '120px', height: '120px' }}>
          <div className="position-absolute top-50 start-50 translate-middle">
            <h3 className="mb-0">{attendance}%</h3>
            <small className="text-muted">Hadir</small>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <div className="d-flex justify-content-between">
          <div>
            <h6 className="mb-1">Kehadiran</h6>
            <p className="mb-0 text-primary">57 Hari</p>
          </div>
          <div>
            <h6 className="mb-1">Absen</h6>
            <p className="mb-0 text-danger">3 Hari</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AttendanceChart
