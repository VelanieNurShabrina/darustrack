import React from 'react'

function SchoolStatsChart() {
  return (
    <div className="chart-container">
      <div className="chart-placeholder bg-light p-5 rounded d-flex justify-content-center align-items-center">
        <p className="text-muted mb-0">
          <i className="bi bi-pie-chart me-2"></i>
          Chart showing school academic statistics
        </p>
      </div>
      <div className="mt-3">
        <div className="row text-center">
          <div className="col-md-4">
            <div className="p-3 border rounded bg-light mb-3">
              <div className="display-4 text-primary">87%</div>
              <div className="text-muted">Passing Rate</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-3 border rounded bg-light mb-3">
              <div className="display-4 text-success">12%</div>
              <div className="text-muted">Honor Roll</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-3 border rounded bg-light mb-3">
              <div className="display-4 text-warning">8%</div>
              <div className="text-muted">Needs Support</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SchoolStatsChart
