import React from 'react'

function ClassPerformanceChart({ subjects = [] }) {
  const defaultSubjects = [
    { name: 'Mathematics', averageScore: 83.5 },
    { name: 'Science', averageScore: 87.2 },
    { name: 'Language', averageScore: 85.8 },
    { name: 'Social Studies', averageScore: 84.3 },
    { name: 'Art', averageScore: 90.1 },
  ]

  const subjectsToShow = subjects.length > 0 ? subjects : defaultSubjects

  return (
    <div className="chart-container">
      <div className="chart-placeholder bg-light p-5 rounded d-flex justify-content-center align-items-center">
        <p className="text-muted mb-0">
          <i className="bi bi-bar-chart-line me-2"></i>
          Chart showing performance by subject
        </p>
      </div>
      <div className="mt-3">
      {subjectsToShow.map((subject, index) => (
          <div key={index} className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span>{subject.name}</span>
              <span className="badge bg-primary">{subject.averageScore.toFixed(1)}</span>
            </div>
            <div className="progress" style={{ height: '8px' }}>
              <div
                className={`progress-bar ${
                  subject.averageScore >= 90 ? 'bg-success' :
                  subject.averageScore >= 80 ? 'bg-primary' :
                  subject.averageScore >= 70 ? 'bg-info' : 'bg-warning'
                }`}
                role="progressbar"
                style={{ width: `${subject.averageScore}%` }}
                aria-valuenow={subject.averageScore}
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ClassPerformanceChart
