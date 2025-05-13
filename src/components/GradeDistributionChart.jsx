import React from 'react'

function GradeDistributionChart() {
  return (
    <div className="chart-container">
      <div className="chart-placeholder bg-light p-5 rounded d-flex justify-content-center align-items-center">
        <p className="text-muted mb-0">
          <i className="bi bi-pie-chart me-2"></i>
          Chart showing grade distribution
        </p>
      </div>
      <div className="mt-3">
        <div className="row">
          <div className="col-6 col-md-4 text-center mb-3">
            <div className="p-2 border rounded bg-light">
              <div className="text-success">A</div>
              <div className="fw-bold">18%</div>
            </div>
          </div>
          <div className="col-6 col-md-4 text-center mb-3">
            <div className="p-2 border rounded bg-light">
              <div className="text-primary">B</div>
              <div className="fw-bold">42%</div>
            </div>
          </div>
          <div className="col-6 col-md-4 text-center mb-3">
            <div className="p-2 border rounded bg-light">
              <div className="text-info">C</div>
              <div className="fw-bold">27%</div>
            </div>
          </div>
          <div className="col-6 col-md-4 text-center mb-3">
            <div className="p-2 border rounded bg-light">
              <div className="text-warning">D</div>
              <div className="fw-bold">9%</div>
            </div>
          </div>
          <div className="col-6 col-md-4 text-center mb-3">
            <div className="p-2 border rounded bg-light">
              <div className="text-danger">F</div>
              <div className="fw-bold">4%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GradeDistributionChart
