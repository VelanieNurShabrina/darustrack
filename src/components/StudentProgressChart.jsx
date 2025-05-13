import React from 'react'

function StudentProgressChart() {
  return (
    <div className="chart-container">
      <h6 className="text-center mb-3">Kinerja dalam Mata Pelajaran</h6>
      <div className="chart-placeholder bg-light p-5 rounded d-flex justify-content-center align-items-center">
        <p className="text-muted mb-0">
          <i className="bi bi-bar-chart-line me-2"></i>
          Chart showing student performance in different subjects
        </p>
      </div>
      <div className="mt-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span>Matematika</span>
          <span className="badge bg-primary">87%</span>
        </div>
        <div className="progress mb-3" style={{ height: '8px' }}>
          <div className="progress-bar bg-primary" role="progressbar" style={{ width: '87%' }} aria-valuenow="87" aria-valuemin="0" aria-valuemax="100"></div>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-2">
          <span>IPA</span>
          <span className="badge bg-success">92%</span>
        </div>
        <div className="progress mb-3" style={{ height: '8px' }}>
          <div className="progress-bar bg-success" role="progressbar" style={{ width: '92%' }} aria-valuenow="92" aria-valuemin="0" aria-valuemax="100"></div>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-2">
          <span>Bahasa</span>
          <span className="badge bg-info">84%</span>
        </div>
        <div className="progress mb-3" style={{ height: '8px' }}>
          <div className="progress-bar bg-info" role="progressbar" style={{ width: '84%' }} aria-valuenow="84" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
      </div>
    </div>
  )
}

export default StudentProgressChart
