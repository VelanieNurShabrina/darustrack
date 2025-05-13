import { useState, useEffect } from 'react'

function Reports() {
  const [classAverages, setClassAverages] = useState([])
  const [selectedTerm, setSelectedTerm] = useState('Semester 1')
  const [selectedYear, setSelectedYear] = useState('2024/2025')

  // Simulating fetching class averages data
  useEffect(() => {
    // In a real app, this would be an API call
    const fetchClassAverages = () => {
      const mockData = [
        { class: '1A', teacher: 'Ahmad Yusuf, S.Pd', students: 28, average: 82.5, attendance: 96.2 },
        { class: '1B', teacher: 'Siti Rahayu, S.Pd', students: 30, average: 80.8, attendance: 94.5 },
        { class: '2A', teacher: 'Budiono, S.Pd', students: 32, average: 85.4, attendance: 95.8 },
        { class: '2B', teacher: 'Maya Indah, S.Pd', students: 31, average: 83.6, attendance: 93.2 },
        { class: '3A', teacher: 'Rudi Hartono, S.Pd', students: 29, average: 84.7, attendance: 95.6 },
        { class: '3B', teacher: 'Diana Puspita, S.Pd', students: 30, average: 81.9, attendance: 94.8 },
        { class: '4A', teacher: 'Budi Santoso, S.Pd', students: 28, average: 86.2, attendance: 96.5 },
        { class: '4B', teacher: 'Lina Wati, S.Pd', students: 27, average: 83.3, attendance: 95.0 },
      ]
      setClassAverages(mockData)
    }

    fetchClassAverages()
  }, [selectedTerm, selectedYear])

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-md-6">
          <h2>Laporan Nilai Rata-rata Kelas</h2>
        </div>
        <div className="col-md-6 d-flex justify-content-end">
          <div className="me-2">
            <select
              className="form-select"
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
            >
              <option value="Semester 1">Semester 1</option>
              <option value="Semester 2">Semester 2</option>
            </select>
          </div>
          <div>
            <select
              className="form-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="2023/2024">2023/2024</option>
              <option value="2024/2025">2024/2025</option>
            </select>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header bg-white">
              <h5 className="card-title mb-0">Nilai Rata-rata Kelas - {selectedTerm} - {selectedYear}</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Kelas</th>
                      <th>Wali Kelas</th>
                      <th>Jumlah Siswa</th>
                      <th>Rata-rata Nilai</th>
                      <th>Kehadiran</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classAverages.map((classData) => (
                      <tr key={classData.class}>
                        <td>{classData.class}</td>
                        <td>{classData.teacher}</td>
                        <td>{classData.students}</td>
                        <td>
                          <span className={`badge px-3 py-2 ${classData.average >= 85 ? 'bg-success' : classData.average >= 80 ? 'bg-primary' : 'bg-warning'}`}>
                            {classData.average.toFixed(1)}
                          </span>
                        </td>
                        <td>{classData.attendance}%</td>
                        <td>
                          {classData.average >= 85 ? (
                            <span className="badge bg-success">Sangat Baik</span>
                          ) : classData.average >= 80 ? (
                            <span className="badge bg-primary">Baik</span>
                          ) : classData.average >= 75 ? (
                            <span className="badge bg-info">Cukup</span>
                          ) : (
                            <span className="badge bg-warning">Perlu Perhatian</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-header bg-white">
              <h5 className="card-title mb-0">Ringkasan</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <h6>Rata-rata Sekolah</h6>
                <h2>{(classAverages.reduce((sum, c) => sum + c.average, 0) / classAverages.length).toFixed(1)}</h2>
              </div>
              <div className="mb-3">
                <h6>Kelas Terbaik</h6>
                <h4>{classAverages.length > 0 ? classAverages.sort((a, b) => b.average - a.average)[0].class : '-'}</h4>
              </div>
              <div className="mb-3">
                <h6>Kehadiran Rata-rata</h6>
                <h4>{(classAverages.reduce((sum, c) => sum + c.attendance, 0) / classAverages.length).toFixed(1)}%</h4>
              </div>
              <div className="mb-3">
                <h6>Total Siswa</h6>
                <h4>{classAverages.reduce((sum, c) => sum + c.students, 0)}</h4>
              </div>
              <div className="d-grid gap-2 mt-4">
                <button className="btn btn-primary">
                  <i className="bi bi-file-earmark-pdf me-2"></i>
                  Download Laporan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports
