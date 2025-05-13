import React from 'react'

function AttendanceTrendChart({ attendanceData = [] }) {
  const defaultData = [
    { month: 'Sep', attendance: 97.5 },
    { month: 'Oct', attendance: 96.8 },
    { month: 'Nov', attendance: 95.2 },
    { month: 'Dec', attendance: 94.5 },
    { month: 'Jan', attendance: 93.8 },
    { month: 'Feb', attendance: 95.6 },
    { month: 'Mar', attendance: 96.0 },
  ]

  const data = attendanceData.length > 0 ? attendanceData : defaultData

  return (
    <div className="chart-container">
      <div className="chart-placeholder bg-light p-5 rounded d-flex justify-content-center align-items-center">
        <p className="text-muted mb-0">
          <i className="bi bi-calendar-check me-2"></i>
          Chart showing attendance trends
        </p>
      </div>
      <div className="mt-3">
        <div className="table-responsive">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Month</th>
                <th>Attendance</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index}>
                  <td>{item.month}</td>
                  <td>
                    <div className="d-flex align-items-center">
                      <div className="progress flex-grow-1 me-2" style={{ height: '6px' }}>
                        <div
                          className={`progress-bar ${item.attendance >= 96 ? 'bg-success' : 'bg-primary'}`}
                          role="progressbar"
                          style={{ width: `${item.attendance}%` }}
                          aria-valuenow={item.attendance}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                      <span>{item.attendance}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AttendanceTrendChart
