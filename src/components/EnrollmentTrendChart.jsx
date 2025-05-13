import React from 'react'

function EnrollmentTrendChart() {
  return (
    <div className="chart-container">
      <div className="chart-placeholder bg-light p-5 rounded d-flex justify-content-center align-items-center">
        <p className="text-muted mb-0">
          <i className="bi bi-graph-up me-2"></i>
          Chart showing enrollment trends over time
        </p>
      </div>
      <div className="mt-3">
        <div className="row">
          <div className="col-md-3 text-center">
            <h6 className="text-muted">New Enrollments</h6>
            <h3 className="text-primary">+12</h3>
          </div>
          <div className="col-md-3 text-center">
            <h6 className="text-muted">Withdrawals</h6>
            <h3 className="text-danger">-3</h3>
          </div>
          <div className="col-md-3 text-center">
            <h6 className="text-muted">Net Growth</h6>
            <h3 className="text-success">+9</h3>
          </div>
          <div className="col-md-3 text-center">
            <h6 className="text-muted">Capacity</h6>
            <h3 className="text-info">86%</h3>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnrollmentTrendChart
