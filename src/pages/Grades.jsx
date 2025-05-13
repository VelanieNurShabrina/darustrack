import { useState, useEffect } from 'react'

function Grades() {
  const [students, setStudents] = useState([])
  const [selectedClass, setSelectedClass] = useState('2A')
  const [selectedSubject, setSelectedSubject] = useState('Matematika')

  // Simulating fetching students data
  useEffect(() => {
    // In a real app, this would be an API call
    const fetchStudents = () => {
      const mockStudents = [
        { id: 1, name: 'Andre Setiawan', quizzes: 85, midterm: 80, final: 88, project: 90 },
        { id: 2, name: 'Budi Santoso', quizzes: 75, midterm: 82, final: 78, project: 85 },
        { id: 3, name: 'Citra Dewi', quizzes: 90, midterm: 88, final: 92, project: 95 },
        { id: 4, name: 'Deni Pratama', quizzes: 82, midterm: 79, final: 85, project: 88 },
        { id: 5, name: 'Eva Sari', quizzes: 78, midterm: 83, final: 80, project: 85 },
        { id: 6, name: 'Fajar Ramadhan', quizzes: 88, midterm: 85, final: 90, project: 92 },
        { id: 7, name: 'Gita Sukmawati', quizzes: 95, midterm: 90, final: 93, project: 97 },
        { id: 8, name: 'Hadi Nugroho', quizzes: 72, midterm: 75, final: 78, project: 80 },
      ]
      setStudents(mockStudents)
    }

    fetchStudents()
  }, [selectedClass, selectedSubject])

  const handleGradeChange = (studentId, category, value) => {
    const updatedStudents = students.map(student => {
      if (student.id === studentId) {
        return { ...student, [category]: parseInt(value, 10) || 0 }
      }
      return student
    })
    setStudents(updatedStudents)
  }

  const calculateFinalGrade = (student) => {
    return Math.round((student.quizzes * 0.2) + (student.midterm * 0.25) + (student.final * 0.35) + (student.project * 0.2))
  }

  const handleSubmit = () => {
    // In a real app, this would send the updated grades to an API
    alert('Grades saved successfully!')
  }

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-md-6">
          <h2>Input Nilai Siswa</h2>
        </div>
        <div className="col-md-6 d-flex justify-content-end">
          <div className="me-2">
            <select
              className="form-select"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="1A">Kelas 1A</option>
              <option value="1B">Kelas 1B</option>
              <option value="2A">Kelas 2A</option>
              <option value="2B">Kelas 2B</option>
              <option value="3A">Kelas 3A</option>
            </select>
          </div>
          <div>
            <select
              className="form-select"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="Matematika">Matematika</option>
              <option value="Bahasa Indonesia">Bahasa Indonesia</option>
              <option value="IPA">IPA</option>
              <option value="IPS">IPS</option>
              <option value="Bahasa Inggris">Bahasa Inggris</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-white">
          <h5 className="card-title mb-0">Daftar Siswa - Kelas {selectedClass} - {selectedSubject}</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Tugas/Kuis (20%)</th>
                  <th>UTS (25%)</th>
                  <th>UAS (35%)</th>
                  <th>Projek (20%)</th>
                  <th>Nilai Akhir</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={student.quizzes}
                        min="0"
                        max="100"
                        onChange={(e) => handleGradeChange(student.id, 'quizzes', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={student.midterm}
                        min="0"
                        max="100"
                        onChange={(e) => handleGradeChange(student.id, 'midterm', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={student.final}
                        min="0"
                        max="100"
                        onChange={(e) => handleGradeChange(student.id, 'final', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={student.project}
                        min="0"
                        max="100"
                        onChange={(e) => handleGradeChange(student.id, 'project', e.target.value)}
                      />
                    </td>
                    <td>
                      <span className="badge bg-primary px-3 py-2">
                        {calculateFinalGrade(student)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="d-flex justify-content-end mt-3">
            <button className="btn btn-primary" onClick={handleSubmit}>
              <i className="bi bi-save me-2"></i>
              Simpan Nilai
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Grades
