import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { teachersAPI } from '../utils/api';

const AttendanceForm = ({ onSuccess }) => {
  const { currentUser } = useAuth();
  console.log('Current user:', currentUser);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateSubmitted, setDateSubmitted] = useState(false);

  const fetchAttendanceByDate = async (date) => {
    try {
      setLoading(true);
      console.log('Fetching attendance for date:', date);

      const response = await teachersAPI.getAttendance(date);
      console.log('Fetched attendance response:', response);

      // The response itself is the data we want
      const attendanceData = response;
      console.log('Attendance data:', attendanceData);

      if (attendanceData && Array.isArray(attendanceData)) {
        console.log('Setting attendance data');
        // Make sure we have access to student_class_id in the response
        setAttendanceData(attendanceData);
        setDateSubmitted(true);
      } else {
        console.log('No attendance data found');
        setAttendanceData([]);
        setDateSubmitted(false);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      // Check if this is a network error (CORS or other connection issues)
      if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
        toast.error('Gagal terhubung ke server. Periksa koneksi atau ada masalah CORS.');
      } else {
        toast.error('Data kehadiran belum ada');
      }
      setAttendanceData([]);
      setDateSubmitted(false);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch attendance data when component mounts
  useEffect(() => {
    // Ensure we have a current user and a selected date before fetching
    if (currentUser) {
      const today = format(new Date(), 'yyyy-MM-dd');
      fetchAttendanceByDate(today);
    }
  }, [currentUser]);

  const addAttendanceDate = async (date) => {
    try {
      setLoading(true);
      console.log('Adding attendance date:', date);

      // Post the date to create attendance
      const response = await teachersAPI.saveAttendance(date);
      console.log('Attendance date response:', response);

      if (response.data) {
        // Show success message
        toast.success('Data kehadiran berhasil ditambahkan');

        // Fetch attendance data for the date
        await fetchAttendanceByDate(date);
      } else {
        toast.error('Gagal menambahkan data kehadiran');
      }
    } catch (error) {
      toast.error('Gagal menambahkan data kehadiran');
      console.error('Error adding attendance date:', error);
      setDateSubmitted(false);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentClassId, newStatus) => {
    console.log(`Changing status for student ${studentClassId} to ${newStatus}`);
    
    // Only update the specific student's status
    setAttendanceData(prev =>
      prev.map(record =>
        record.student_class_id === studentClassId
          ? { ...record, status: newStatus }
          : record
      )
    );
  };

  const handleSaveAttendance = async () => {
    try {
      setLoading(true);

      // Filter out invalid attendance records and records with "Not Set" status
      const validAttendanceData = attendanceData.filter(attendance => 
        attendance.student_class_id && attendance.status && attendance.status !== 'Not Set'
      );

      if (validAttendanceData.length === 0) {
        toast.warning('Tidak ada data kehadiran valid untuk disimpan');
        setLoading(false);
        return;
      }

      // Format the data to match API requirements:
      // attendance as array of { student_class_id, status }
      const attendanceUpdates = validAttendanceData.map(attendance => ({
        student_class_id: attendance.student_class_id,
        status: attendance.status || 'hadir'
      }));

      console.log('Sending attendance updates:', attendanceUpdates);

      // Send the updates to /teachers/attendances?date={selectedDate}
      const response = await teachersAPI.updateAttendance(selectedDate, attendanceUpdates);

      if (response) {
        toast.success('Status kehadiran berhasil diperbarui');
        // Don't fetch attendance data again to maintain button states
        // await fetchAttendanceByDate(selectedDate);
      } else {
        toast.error('Gagal menyimpan status kehadiran');
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      if (error.message && error.message.includes('student_class_id tidak terdaftar')) {
        toast.error('Beberapa siswa tidak terdaftar di kelas ini pada tanggal tersebut');
      } else {
      toast.error('Gagal menyimpan status kehadiran');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        date: selectedDate,
        data: attendanceData.map(item => ({
          student_id: item.student_id,
          class_id: item.class_id,
          date: selectedDate,
          status: item.status || 'hadir' // Set default status if not set
        }))
      };
      await teachersAPI.saveAttendance(selectedDate, payload);
      toast.success('Attendance saved successfully');
      // Refresh the attendance data
      await fetchAttendanceByDate(selectedDate);
    } catch (error) {
      toast.error('Failed to save attendance');
      console.error('Error saving attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSubmit = async (e) => {
    e.preventDefault();
    console.log('Date submit clicked', { selectedDate, currentUser });

    if (!currentUser) {
      toast.error('Please log in first');
      return;
    }

    if (currentUser.role !== 'wali_kelas') {
      toast.error('Only wali kelas can access this feature');
      return;
    }

    try {
      await addAttendanceDate(selectedDate);
    } catch (error) {
      console.error('Error in handleDateSubmit:', error);
    }
  };

  const isWaliKelas = currentUser?.role === 'wali_kelas';
  const isStudent = currentUser?.role === 'student';

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">Kehadiran</h5>
        </div>
        <div className="card-body">
          {isWaliKelas ? (
            // Wali Kelas View - Can add attendance dates
            <div className="mb-4">
              <div className="row">
                <div className="col-md-4">
                  <label htmlFor="date" className="form-label">Pilih Tanggal</label>
                  <input
                    type="date"
                    id="date"
                    className="form-control"
                    value={selectedDate}
                    onChange={async (e) => {
                      const newDate = e.target.value;
                      setSelectedDate(newDate);
                      setDateSubmitted(false);
                      await fetchAttendanceByDate(newDate);
                    }}
                    required
                  />
                </div>
                {!dateSubmitted && (
                  <div className="col-md-2 d-flex align-items-end">
                    <button
                      onClick={handleDateSubmit}
                      className="btn btn-primary"
                      disabled={loading || !selectedDate}
                    >
                      {loading ? 'Loading...' : 'Tambah Tanggal Kehadiran'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : isStudent ? (
            // Student View - Can only view attendance
            <div className="mb-4">
              <div className="row">
                <div className="col-md-4">
                  <label htmlFor="date" className="form-label">Select Date</label>
                  <input
                    type="date"
                    id="date"
                    className="form-control"
                    value={selectedDate}
                    onChange={async (e) => {
                      const newDate = e.target.value;
                      setSelectedDate(newDate);
                      await fetchAttendanceByDate(newDate);
                    }}
                    required
                  />
                </div>
              </div>
            </div>
          ) : (
            // Other roles - Show access denied
            <div className="alert alert-warning">
              Anda tidak memiliki akses ke halaman ini
            </div>
          )}

          {loading ? (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : attendanceData.length > 0 ? (
            <div className="mt-4">
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Nama</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.map((attendance, index) => (
                      <tr key={attendance.student_class_id || index}>
                        <td>{index + 1}.</td>
                        <td className="text-uppercase">
                          {attendance.student ? attendance.student.name : 
                           attendance.studentName || 'Unknown'}
                        </td>
                        <td>
                          {isWaliKelas ? (
                            <div className="d-flex justify-content-end gap-2">
                              <button
                                className={`btn btn-sm ${attendance.status === 'hadir' ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => handleStatusChange(attendance.student_class_id, 'hadir')}
                              >
                                Hadir
                              </button>
                              <button
                                className={`btn btn-sm ${attendance.status === 'izin' ? 'btn-warning' : 'btn-outline-warning'}`}
                                onClick={() => handleStatusChange(attendance.student_class_id, 'izin')}
                              >
                                Izin
                              </button>
                              <button
                                className={`btn btn-sm ${attendance.status === 'sakit' ? 'btn-danger' : 'btn-outline-danger'}`}
                                onClick={() => handleStatusChange(attendance.student_class_id, 'sakit')}
                              >
                                Sakit
                              </button>
                              <button
                                className={`btn btn-sm ${attendance.status === 'alpha' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                                onClick={() => handleStatusChange(attendance.student_class_id, 'alpha')}
                              >
                                Alpha
                              </button>
                            </div>
                          ) : (
                            <span className={`badge ${{
                              'hadir': 'bg-primary',
                              'izin': 'bg-warning',
                              'sakit': 'bg-danger',
                              'alpha': 'bg-secondary'
                            }[attendance.status] || 'bg-light text-dark'}`}>
                              {attendance.status || 'Not Set'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {isWaliKelas && (
                <div className="mt-3 d-flex justify-content-end">
                  <button
                    className="btn btn-primary px-4"
                    onClick={handleSaveAttendance}
                    disabled={loading}
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          ) : (
            !loading && (
              <div className="alert alert-info mt-3">
                Tanggal ini belum ada data kehadiran
              </div>
            )
          )}
          {dateSubmitted && attendanceData.length === 0 ? (
            <form onSubmit={handleSubmit}>
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Student Name</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => {
                      console.log('Rendering student:', student);
                      const attendance = attendanceData.find(a => a.student_id === student.id);
                      console.log('Student attendance:', attendance);
                      return (
                        <tr key={student.id}>
                          <td>{student.name || student.nisn || student.id}</td>
                          <td>
                            <select
                              className="form-select"
                              value={attendance?.status || ''}
                              onChange={(e) => handleStatusChange(student.id, e.target.value)}
                            >
                              <option value="">Select Status</option>
                              <option value="hadir">Hadir</option>
                              <option value="alpha">Alpha</option>
                              <option value="sakit">Sakit</option>
                              <option value="izin">Izin</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="text-end mt-3">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : 'Save Attendance'}
                </button>
              </div>
            </form>
          ) : dateSubmitted ? (
            <div className="text-center">
              <p>No students found in this class.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default AttendanceForm;
