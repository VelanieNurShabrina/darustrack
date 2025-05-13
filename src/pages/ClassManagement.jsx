import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { classesAPI, subjectsAPI } from '../utils/api'
import { toast } from 'react-toastify'

function ClassManagement() {
  const [classes, setClasses] = useState([])
  const [selectedLevel, setSelectedLevel] = useState('')
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { currentUser } = useAuth()
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false)
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false)
  const [showDeleteScheduleModal, setShowDeleteScheduleModal] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [selectedClass, setSelectedClass] = useState(null)
  const [schedules, setSchedules] = useState([])
  const [newSchedule, setNewSchedule] = useState({
    subject_id: '',
    day: '',
    start_time: '',
    end_time: ''
  })
  const [editScheduleForm, setEditScheduleForm] = useState({
    subject_id: '',
    day: '',
    start_time: '',
    end_time: ''
  })

  // Fetch classes from API with optional level filter
  const fetchClasses = async (level = '') => {
    try {
      setLoading(true)
      const filters = level ? { grade_level: level } : {}
      const response = await classesAPI.getAll(filters)
      const classesArray = Array.isArray(response) ? response : [];
      setClasses(classesArray)
      setError(null)
    } catch (err) {
      setError('Gagal mengambil data kelas')
      setClasses([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch subjects from API
  const fetchSubjects = async () => {
    try {
      const response = await subjectsAPI.getAll();
      setSubjects(Array.isArray(response) ? response : []);
    } catch (err) {
      setError('Gagal mengambil data mata pelajaran');
    }
  }

  // Fetch data when component mounts
  useEffect(() => {
    if (currentUser) {
      fetchSubjects();
    }
  }, [currentUser]);

  // Fetch classes when level changes
  useEffect(() => {
    if (currentUser) {
      fetchClasses(selectedLevel);
    }
  }, [currentUser, selectedLevel]);

  const handleLevelChange = (e) => {
    setSelectedLevel(e.target.value)
  }

  const checkTimeOverlap = (start1, end1, start2, end2) => {
    return start1 < end2 && start2 < end1;
  }

  const checkScheduleOverlap = (newSchedule, existingSchedules) => {
    return existingSchedules.some(schedule => 
      schedule.day === newSchedule.day &&
      checkTimeOverlap(
        newSchedule.start_time,
        newSchedule.end_time,
        schedule.start_time,
        schedule.end_time
      )
    );
  }

  const handleAddScheduleClick = async (classItem) => {
    setSelectedClass(classItem)
    try {
      setLoading(true)
      const response = await classesAPI.getSchedule(classItem.id)
      setSchedules(Array.isArray(response) ? response : [])
    } catch (err) {
      setError('Gagal mengambil jadwal')
      toast.error('Gagal mengambil jadwal')
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleInputChange = (e) => {
    setNewSchedule({
      ...newSchedule,
      [e.target.name]: e.target.value
    })
  }

const handleAddScheduleSubmit = async (e) => {
    e.preventDefault()

    if (checkScheduleOverlap(newSchedule, schedules)) {
      setError('Jadwal bertabrakan dengan jadwal yang sudah ada')
      toast.error('Jadwal bertabrakan dengan jadwal yang sudah ada')
      return
    }

    try {
      setLoading(true)
      await classesAPI.addSchedule(selectedClass.id, newSchedule)
      const response = await classesAPI.getSchedule(selectedClass.id)
      setSchedules(Array.isArray(response) ? response : [])
      setShowAddScheduleModal(false)
      setNewSchedule({
        subject_id: '',
        day: '',
        start_time: '',
        end_time: ''
      })
      toast.success('Jadwal berhasil ditambahkan')
    } catch (err) {
      console.error('Add schedule error:', err);
      
      // Check for the exact error message from the backend about overlapping schedules
      if (err && err.message === 'Terdapat jadwal lain yang bentrok pada hari dan jam tersebut') {
        setError('Terdapat jadwal lain yang bentrok pada hari dan jam tersebut');
        toast.error('Terdapat jadwal lain yang bentrok pada hari dan jam tersebut');
      } else {
        // Generic error message as fallback
        setError(err.message || 'Gagal menambahkan jadwal');
        toast.error(err.message || 'Gagal menambahkan jadwal');
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEditScheduleClick = async (schedule) => {
    setSelectedSchedule(schedule)
    setEditScheduleForm({
      subject_id: schedule.subject_id,
      day: schedule.day,
      start_time: schedule.start_time,
      end_time: schedule.end_time
    })
    setShowEditScheduleModal(true)
  }

  const handleEditScheduleSubmit = async (e) => {
    e.preventDefault()

    const otherSchedules = schedules.filter(s => s.id !== selectedSchedule.id)
    if (checkScheduleOverlap(editScheduleForm, otherSchedules)) {
      setError('Jadwal bertabrakan dengan jadwal yang sudah ada')
      toast.error('Jadwal bertabrakan dengan jadwal yang sudah ada')
      return
    }

    try {
      setLoading(true)
      const scheduleData = {};
      if (editScheduleForm.subject_id !== selectedSchedule.subject_id) {
        scheduleData.subject_id = editScheduleForm.subject_id;
      }
      if (editScheduleForm.day !== selectedSchedule.day) {
        scheduleData.day = getDayInIndonesian(editScheduleForm.day);
      }
      if (editScheduleForm.start_time !== selectedSchedule.start_time) {
        scheduleData.start_time = editScheduleForm.start_time;
      }
      if (editScheduleForm.end_time !== selectedSchedule.end_time) {
        scheduleData.end_time = editScheduleForm.end_time;
      }

      await classesAPI.updateSchedule(selectedSchedule.id, scheduleData)
      const response = await classesAPI.getSchedule(selectedClass.id)
      setSchedules(Array.isArray(response) ? response : [])
      setShowEditScheduleModal(false)
      toast.success('Jadwal berhasil diperbarui')
    } catch (err) {
      console.error('Edit schedule error:', err);
      
      if (err && err.message === 'Terdapat jadwal lain yang bentrok pada hari dan jam tersebut') {
        setError('Terdapat jadwal lain yang bentrok pada hari dan jam tersebut');
        toast.error('Terdapat jadwal lain yang bentrok pada hari dan jam tersebut');
      } else {
        setError(err.message || 'Gagal memperbarui jadwal');
        toast.error(err.message || 'Gagal memperbarui jadwal');
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteScheduleClick = (schedule) => {
    setSelectedSchedule(schedule)
    setShowDeleteScheduleModal(true)
  }

  const handleDeleteScheduleConfirm = async () => {
    try {
      setLoading(true)
      await classesAPI.deleteSchedule(selectedClass.id, selectedSchedule.id)
      const response = await classesAPI.getSchedule(selectedClass.id)
      setSchedules(Array.isArray(response) ? response : [])
      setShowDeleteScheduleModal(false)
      toast.success('Jadwal berhasil dihapus')
    } catch (err) {
      setError('Gagal menghapus jadwal')
      toast.error('Gagal menghapus jadwal')
    } finally {
      setLoading(false)
    }
  }

  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId)
    return subject ? subject.name : ''
  }

  // Calculate statistics
  const totalClasses = classes.length
  const classStatsByLevel = {}

  // Group classes by level
  classes.forEach(cls => {
    const level = cls.grade_level || 'Unknown'
    if (!classStatsByLevel[level]) {
      classStatsByLevel[level] = 0
    }
    classStatsByLevel[level]++
  })

  // Days of week translation
  const getDayInIndonesian = (day) => {
    const days = {
      'Monday': 'Senin',
      'Tuesday': 'Selasa',
      'Wednesday': 'Rabu',
      'Thursday': 'Kamis',
      'Friday': 'Jumat'
    }
    return days[day] || day
  }

  const getEnglishDay = (indonesianDay) => {
    const days = {
      'Senin': 'Monday',
      'Selasa': 'Tuesday',
      'Rabu': 'Wednesday',
      'Kamis': 'Thursday',
      'Jumat': 'Friday'
    }
    return days[indonesianDay] || indonesianDay
  }

  // Add a new handler for clicking the "Add Schedule" button in the schedule list modal
  const handleOpenAddScheduleModal = () => {
    setNewSchedule({
      subject_id: '',
      day: '',
      start_time: '',
      end_time: ''
    })
    setShowAddScheduleModal(true)
  }

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Kelola Kelas</h2>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-white">
              <h5 className="card-title mb-0">Filter Tingkat</h5>
            </div>
            <div className="card-body">
                  <select
                    value={selectedLevel}
                    onChange={handleLevelChange}
                className="form-select"
                  >
                    <option value="">Semua Tingkat</option>
                    <option value="1">Kelas 1</option>
                    <option value="2">Kelas 2</option>
                    <option value="3">Kelas 3</option>
                    <option value="4">Kelas 4</option>
                    <option value="5">Kelas 5</option>
                    <option value="6">Kelas 6</option>
                  </select>
                </div>
              </div>
        </div>
        
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-white">
              <h5 className="card-title mb-0">Statistik Kelas</h5>
            </div>
            <div className="card-body">
              <h6 className="text-muted mb-2">Total Kelas</h6>
              <h3 className="mb-3">{totalClasses}</h3>
              {Object.entries(classStatsByLevel).map(([level, count]) => (
                <div className="mb-2" key={level}>
                  <div className="d-flex justify-content-between mb-1">
                    <span>Kelas {level}</span>
                    <span>{count} kelas</span>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div
                      className="progress-bar bg-primary"
                      role="progressbar"
                      style={{ width: `${(count / totalClasses) * 100}%` }}
                      aria-valuenow={(count / totalClasses) * 100}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    ></div>
                </div>
                              </div>
              ))}
              </div>
            </div>
          </div>
        </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-white">
              <h5 className="card-title mb-0">Daftar Kelas</h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                </div>
              ) : classes.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-building text-muted" style={{ fontSize: '3rem' }}></i>
                  <p className="mt-3 text-muted">Belum ada data kelas</p>
                </div>
              ) : (
                <div className="row g-3">
                  {classes.map(classItem => (
                    <div key={classItem.id} className="col-md-4 col-lg-3">
                      <div className="card h-100">
                        <div className="card-body">
                          <h5 className="card-title">{classItem.name}</h5>
                          <p className="text-muted">Tingkat: {classItem.grade_level}</p>
                  </div>
                        <div className="card-footer bg-white border-top-0">
                <button
                            onClick={() => handleAddScheduleClick(classItem)}
                            className="btn btn-primary btn-sm w-100"
                  disabled={loading}
                >
                            <i className="bi bi-calendar-week me-2"></i>
                            Kelola Jadwal
                </button>
            </div>
          </div>
                    </div>
                  ))}
        </div>
        )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Schedule Modal */}
      {showAddScheduleModal && (
        <div className="modal fade show" style={{ display: 'block', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Tambah Jadwal - {selectedClass?.name}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddScheduleModal(false)}
                ></button>
              </div>
              <form onSubmit={handleAddScheduleSubmit}>
                <div className="modal-body">
                <div className="mb-3">
                    <label className="form-label">Mata Pelajaran</label>
                    <select
                      name="subject_id"
                      value={newSchedule.subject_id}
                      onChange={handleScheduleInputChange}
                      className="form-select"
                    required
                    >
                      <option value="">Pilih Mata Pelajaran</option>
                      {subjects.map(subject => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                </div>
                <div className="mb-3">
                    <label className="form-label">Hari</label>
                    <select
                      name="day"
                      value={newSchedule.day}
                      onChange={handleScheduleInputChange}
                      className="form-select"
                      required
                    >
                      <option value="">Pilih Hari</option>
                      <option value="Senin">Senin</option>
                      <option value="Selasa">Selasa</option>
                      <option value="Rabu">Rabu</option>
                      <option value="Kamis">Kamis</option>
                      <option value="Jumat">Jumat</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Waktu Mulai</label>
                      <input
                      type="time"
                      name="start_time"
                      value={newSchedule.start_time}
                      onChange={handleScheduleInputChange}
                        className="form-control"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Waktu Selesai</label>
                    <input
                      type="time"
                      name="end_time"
                      value={newSchedule.end_time}
                      onChange={handleScheduleInputChange}
                    className="form-control"
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAddScheduleModal(false)}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Menyimpan...
                      </>
                    ) : (
                      'Tambah Jadwal'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {showEditScheduleModal && (
        <div className="modal fade show" style={{ display: 'block', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Jadwal - {selectedClass?.name}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditScheduleModal(false)}
                ></button>
              </div>
              <form onSubmit={handleEditScheduleSubmit}>
              <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Mata Pelajaran</label>
                    <select
                      name="subject_id"
                      value={editScheduleForm.subject_id}
                      onChange={(e) => setEditScheduleForm({...editScheduleForm, subject_id: e.target.value})}
                      className="form-select"
                      required
                    >
                      <option value="">Pilih Mata Pelajaran</option>
                      {subjects.map(subject => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                </div>
                  <div className="mb-3">
                    <label className="form-label">Hari</label>
                    <select
                      name="day"
                      value={editScheduleForm.day}
                      onChange={(e) => setEditScheduleForm({...editScheduleForm, day: e.target.value})}
                      className="form-select"
                        required
                    >
                      <option value="">Pilih Hari</option>
                      <option value="Senin">Senin</option>
                      <option value="Selasa">Selasa</option>
                      <option value="Rabu">Rabu</option>
                      <option value="Kamis">Kamis</option>
                      <option value="Jumat">Jumat</option>
                    </select>
                      </div>
                  <div className="mb-3">
                    <label className="form-label">Waktu Mulai</label>
                    <input
                      type="time"
                      name="start_time"
                      value={editScheduleForm.start_time}
                      onChange={(e) => setEditScheduleForm({...editScheduleForm, start_time: e.target.value})}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Waktu Selesai</label>
                    <input
                      type="time"
                      name="end_time"
                      value={editScheduleForm.end_time}
                      onChange={(e) => setEditScheduleForm({...editScheduleForm, end_time: e.target.value})}
                      className="form-control"
                      required
                    />
                  </div>
                  </div>
                <div className="modal-footer">
                              <button
                                type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowEditScheduleModal(false)}
                              >
                    Batal
                              </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Menyimpan...
                      </>
                    ) : (
                      'Simpan Perubahan'
                    )}
                    </button>
                  </div>
                </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Schedule Modal */}
      {showDeleteScheduleModal && (
        <div className="modal fade show" style={{ display: 'block', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Hapus Jadwal</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDeleteScheduleModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Apakah Anda yakin ingin menghapus jadwal ini?</p>
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Data yang dihapus tidak dapat dikembalikan.
                </div>
                <div className="mt-3">
                  <p className="mb-1"><strong>Mata Pelajaran:</strong> {getSubjectName(selectedSchedule?.subject_id)}</p>
                  <p className="mb-1"><strong>Hari:</strong> {getDayInIndonesian(selectedSchedule?.day)}</p>
                  <p className="mb-1"><strong>Waktu Mulai:</strong> {selectedSchedule?.start_time}</p>
                  <p className="mb-0"><strong>Waktu Selesai:</strong> {selectedSchedule?.end_time}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteScheduleModal(false)}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteScheduleConfirm}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Menghapus...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-trash me-2"></i>
                      Hapus
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule List Modal */}
      {selectedClass && (
        <div className="modal fade show" style={{ display: 'block', zIndex: 1050 }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Jadwal Kelas: {selectedClass.name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setSelectedClass(null)
                    setSchedules([])
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="d-flex justify-content-between mb-3">
                  <h6>Daftar Jadwal</h6>
                              <button
                    onClick={handleOpenAddScheduleModal}
                    className="btn btn-primary btn-sm"
                    disabled={loading}
                  >
                    <i className="bi bi-plus-lg me-1"></i>
                    Tambah Jadwal
                              </button>
                    </div>
                
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                      </div>
                  </div>
                ) : schedules.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="bi bi-calendar-x text-muted" style={{ fontSize: '3rem' }}></i>
                    <p className="mt-3 text-muted">Belum ada jadwal untuk kelas ini</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Mata Pelajaran</th>
                          <th>Hari</th>
                          <th>Waktu Mulai</th>
                          <th>Waktu Selesai</th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schedules.map(schedule => (
                          <tr key={schedule.id}>
                            <td>{getSubjectName(schedule.subject_id)}</td>
                            <td>{getDayInIndonesian(schedule.day)}</td>
                            <td>{schedule.start_time}</td>
                            <td>{schedule.end_time}</td>
                              <td>
                                  <button
                                    onClick={() => handleEditScheduleClick(schedule)}
                                className="btn btn-sm btn-outline-primary me-2"
                                    disabled={loading}
                                  >
                                    <i className="bi bi-pencil"></i>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteScheduleClick(schedule)}
                                className="btn btn-sm btn-outline-danger"
                                    disabled={loading}
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                              </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
        </div>
      )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setSelectedClass(null)
                    setSchedules([])
                  }}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClassManagement
