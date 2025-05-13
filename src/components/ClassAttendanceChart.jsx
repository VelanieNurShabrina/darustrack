import React from 'react'

function ClassAttendanceChart() {
  return (
    <div className="chart-container">
      <div className="chart-placeholder bg-light p-5 rounded d-flex justify-content-center align-items-center">
        <p className="text-muted mb-0">
          <i className="bi bi-calendar-check me-2"></i>
          Chart showing attendance trends over the last 30 days
        </p>
      </div>
      <div className="mt-3">
        <div className="row">
          <div className="col-md-4 text-center">
            <h6 className="text-muted">Present</h6>
            <h3 className="text-primary">94%</h3>
          </div>
          <div className="col-md-4 text-center">
            <h6 className="text-muted">Absent</h6>
            <h3 className="text-danger">4%</h3>
          </div>
          <div className="col-md-4 text-center">
            <h6 className="text-muted">Late</h6>
            <h3 className="text-warning">2%</h3>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClassAttendanceChart
