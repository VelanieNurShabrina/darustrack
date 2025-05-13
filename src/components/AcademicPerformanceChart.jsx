import React from 'react'

function AcademicPerformanceChart() {
  return (
    <div className="chart-container">
      <div className="chart-placeholder bg-light p-5 rounded d-flex justify-content-center align-items-center">
        <p className="text-muted mb-0">
          <i className="bi bi-bar-chart-line me-2"></i>
          Chart showing academic performance by grade level
        </p>
      </div>
      <div className="mt-3">
        <div className="table-responsive">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Grade</th>
                <th>Average</th>
                <th>Last Year</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Grade 1</td>
                <td>82.5</td>
                <td>80.2</td>
                <td className="text-success">+2.3%</td>
              </tr>
              <tr>
                <td>Grade 2</td>
                <td>83.7</td>
                <td>82.5</td>
                <td className="text-success">+1.2%</td>
              </tr>
              <tr>
                <td>Grade 3</td>
                <td>84.4</td>
                <td>85.1</td>
                <td className="text-danger">-0.7%</td>
              </tr>
              <tr>
                <td>Grade 4</td>
                <td>87.9</td>
                <td>84.8</td>
                <td className="text-success">+3.1%</td>
              </tr>
              <tr>
                <td>Grade 5</td>
                <td>80.2</td>
                <td>81.5</td>
                <td className="text-danger">-1.3%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AcademicPerformanceChart
