import React, { useState, useEffect } from 'react';
import { format, parseISO, getMonth, isAfter, startOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { teachersAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useSemester } from '../contexts/SemesterContext';

const WaliKelasAttendances = () => {
  const { userRole } = useAuth();
  const { activeSemester } = useSemester();
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [filter, setFilter] = useState({
    student: '',
    status: ''
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addDate, setAddDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isCreating, setIsCreating] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentAttendance, setCurrentAttendance] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingChanges, setPendingChanges] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [noDataForDate, setNoDataForDate] = useState(false);
  
  // Get today's date for validation
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Check if current user is admin
  const isAdmin = userRole === 'admin';
  
  // Define attendance status options
  const statusOptions = [
    { value: 'Hadir', label: 'Hadir', color: 'success' },
    { value: 'Izin', label: 'Izin', color: 'warning' },
    { value: 'Sakit', label: 'Sakit', color: 'danger' },
    { value: 'Alpha', label: 'Alpha', color: 'secondary' }
  ];
  
  // Define Indonesian month names
  const months = [
    { value: 'all', label: 'Semua Bulan' },
    { value: '0', label: 'Januari' },
    { value: '1', label: 'Februari' },
    { value: '2', label: 'Maret' },
    { value: '3', label: 'April' },
    { value: '4', label: 'Mei' },
    { value: '5', label: 'Juni' },
    { value: '6', label: 'Juli' },
    { value: '7', label: 'Agustus' },
    { value: '8', label: 'September' },
    { value: '9', label: 'Oktober' },
    { value: '10', label: 'November' },
    { value: '11', label: 'Desember' }
  ];
  
  useEffect(() => {
    fetchAllAttendances(selectedDate);
  }, [selectedDate]);
  
  // Validate date to ensure it's not in the future
  const validateDate = (date) => {
    // Check if the date is after today
    const dateObj = new Date(date);
    const todayObj = new Date();
    todayObj.setHours(23, 59, 59, 999); // Set to end of day to allow current day entries
    
    console.log('Date validation:', {
      dateToValidate: date,
      dateObj: dateObj.toISOString(),
      todayObj: todayObj.toISOString(),
      isAfter: dateObj > todayObj
    });
    
    return dateObj <= todayObj;
  };
  
  const fetchAllAttendances = async (date) => {
    try {
      setLoading(true);
      setNoDataForDate(false);
      
      // Format the date to ensure consistency (yyyy-MM-dd)
      const formattedDate = format(new Date(date), 'yyyy-MM-dd');
      
      console.log(`Fetching attendances for date: ${formattedDate} (original: ${date})`);
      
      const data = await teachersAPI.getAllAttendances(formattedDate);
      console.log(`All attendances data for date ${formattedDate}:`, data);
      
      // Ensure we're handling the response data correctly with student_class_id
      if (Array.isArray(data)) {
        if (data.length === 0) {
          // No attendance data found for this date
          toast.warning("Tidak ada data kehadiran untuk tanggal tersebut");
          setAttendances([]);
          setNoDataForDate(true);
        } else {
          // Data is in the correct format with student_class_id fields
          setAttendances(data);
          setNoDataForDate(false);
        }
      } else {
        // Handle unexpected response format
        console.error('Unexpected attendance data format:', data);
        setAttendances([]);
        setNoDataForDate(true);
        toast.warning("Tidak ada data kehadiran untuk tanggal tersebut");
      }
      
      setError(null);
    } catch (err) {
      console.error(`Error fetching attendances for date ${date}:`, err);
      
      // Extract the error message from the API response if available
      if (err.message && err.message.includes("Tidak ada data kehadiran untuk tanggal tersebut")) {
        toast.warning("Tidak ada data kehadiran untuk tanggal tersebut");
        setAttendances([]);
        setNoDataForDate(true);
      } else {
      setError('Gagal mengambil data kehadiran');
      toast.error('Gagal mengambil data kehadiran');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddAttendance = async () => {
    try {
      // Validate the date is not in the future
      if (!validateDate(addDate)) {
        toast.error("Tanggal kehadiran tidak boleh melebihi tanggal hari ini");
        return;
      }
      
      setIsCreating(true);
      
      // Format the date to ensure consistency (yyyy-MM-dd)
      const formattedDate = format(new Date(addDate), 'yyyy-MM-dd');
      
      console.log(`Adding attendance for date: ${formattedDate} (original: ${addDate})`);
      
      // Call the API to create new attendance records for this date
      const response = await teachersAPI.saveAttendance(formattedDate);
      
      // Show success message
      toast.success(`Berhasil menambahkan data kehadiran untuk tanggal ${formattedDate}`);
      
      // Refresh the data if we're viewing the same date
      if (addDate === selectedDate) {
        await fetchAllAttendances(selectedDate);
      }
      
      // Close the modal
      setIsAddModalOpen(false);
    } catch (err) {
      console.error(`Error adding attendance for date ${addDate}:`, err);
      toast.error(err.message || 'Gagal menambahkan data kehadiran');
    } finally {
      setIsCreating(false);
    }
  };
  
  const openEditModal = (attendance) => {
    console.log('Opening edit modal for attendance:', attendance);
    setCurrentAttendance(attendance);
    setEditStatus(attendance.status || 'Hadir');
    setIsEditModalOpen(true);
  };
  
  const handleStatusSelect = (attendance, status) => {
    console.log(`Setting status for ${attendance.studentName} to ${status}`);
    
    // Add to pending changes
    setPendingChanges(prev => ({
      ...prev,
      [attendance.student_class_id]: status
    }));
    
    setHasChanges(true);
  };
  
  const saveAllChanges = async () => {
    if (!Object.keys(pendingChanges).length) {
      toast.info('No changes to save');
      return;
    }
    
    try {
      console.log('Selected date for attendance update:', selectedDate);
      
      // Validate the date is not in the future
      if (!validateDate(selectedDate)) {
        console.error('Date validation failed. Cannot use future dates.');
        toast.error("Tanggal kehadiran tidak boleh melebihi tanggal hari ini");
        return;
      }
      
      setLoading(true);
      
      // Format the updates for the API
      const attendanceUpdates = Object.entries(pendingChanges).map(([student_class_id, status]) => ({
        student_class_id,
        status
      }));
      
      // Format the date to ensure consistency (yyyy-MM-dd)
      const formattedDate = format(new Date(selectedDate), 'yyyy-MM-dd');
      
      console.log('Saving multiple attendance updates:', {
        originalDate: selectedDate,
        formattedDate: formattedDate,
        updates: attendanceUpdates,
        requestStructure: {
          attendanceUpdates: attendanceUpdates
        }
      });
      
      // Call the API to update the attendance using query parameter format
      await teachersAPI.updateAttendance(formattedDate, attendanceUpdates);
      
      // Show success message
      toast.success('Status kehadiran siswa berhasil diperbarui');
      
      // Update the local state to reflect all the changes
      const updatedAttendances = attendances.map(item => {
        if (pendingChanges[item.student_class_id]) {
          return { ...item, status: pendingChanges[item.student_class_id] };
        }
        return item;
      });
      
      setAttendances(updatedAttendances);
      
      // Clear pending changes
      setPendingChanges({});
      setHasChanges(false);
      
    } catch (err) {
      console.error('Error saving attendance changes:', err);
      if (err.message && err.message.includes('student_class_id tidak terdaftar')) {
        toast.error('Beberapa siswa tidak terdaftar di kelas ini pada tanggal tersebut');
      } else if (err.message && err.message.includes('Tanggal kehadiran tidak boleh melebihi tanggal hari ini')) {
        toast.error('Tanggal kehadiran tidak boleh melebihi tanggal hari ini');
      } else {
        toast.error(err.message || 'Gagal menyimpan status kehadiran');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };
  
  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };
  
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    
    // Check if the date is in the future
    if (!validateDate(newDate)) {
      toast.warning("Tidak bisa memilih tanggal masa depan");
      return;
    }
    
    setSelectedDate(newDate);
  };
  
  const handleAddDateChange = (e) => {
    const newDate = e.target.value;
    
    // Check if the date is in the future
    if (!validateDate(newDate)) {
      toast.warning("Tidak bisa memilih tanggal masa depan");
      return;
    }
    
    setAddDate(newDate);
  };
  
  const filteredAttendances = attendances.filter(attendance => {
    // Apply student and status filters
    const matchesStudent = !filter.student || 
      (attendance.studentName?.toLowerCase().includes(filter.student.toLowerCase()));
    
    const matchesStatus = !filter.status || 
      attendance.status === filter.status;
    
    // Apply month filter if a specific month is selected
    let matchesMonth = true;
    if (selectedMonth !== 'all' && attendance.date) {
      const attendanceMonth = getMonth(new Date(attendance.date));
      matchesMonth = attendanceMonth.toString() === selectedMonth;
    }
    
    return matchesStudent && matchesStatus && matchesMonth;
  });
  
  // Only wali kelas can access this view
  if (userRole !== 'wali_kelas') {
    return (
      <div className="alert alert-warning">
        Anda tidak memiliki akses ke halaman ini
      </div>
    );
  }
  
  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          {activeSemester && (
            <div className="me-3">
              <span className="badge bg-primary-subtle text-primary rounded-pill me-2">
                <i className="bi bi-calendar-event me-1"></i>
                Semester Aktif
                {activeSemester.name && `: ${activeSemester.name}`}
                {!activeSemester.name && activeSemester.semester && `: Semester ${activeSemester.semester}`}
              </span>
            </div>
          )}
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => setIsAddModalOpen(true)}
        >
          Tambah Tanggal Kehadiran
        </button>
      </div>
      
      {/* Date and Filter controls */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-4">
              <label htmlFor="selectedDate" className="form-label">Tanggal Kehadiran</label>
              <input
                type="date"
                className="form-control"
                id="selectedDate"
                name="selectedDate"
                value={selectedDate}
                onChange={handleDateChange}
                max={today}
              />
            </div>
            <div className="col-md-4">
              <label htmlFor="selectedMonth" className="form-label">Bulan</label>
              <select
                className="form-select"
                id="selectedMonth"
                value={selectedMonth}
                onChange={handleMonthChange}
              >
                {months.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="row g-3">
            <div className="col-md-5">
              <label htmlFor="student" className="form-label">Nama Siswa</label>
              <input
                type="text"
                className="form-control"
                id="student"
                name="student"
                value={filter.student}
                onChange={handleFilterChange}
                placeholder="Cari siswa..."
              />
            </div>
            <div className="col-md-4">
              <label htmlFor="status" className="form-label">Status</label>
              <select
                className="form-select"
                id="status"
                name="status"
                value={filter.status}
                onChange={handleFilterChange}
              >
                <option value="">Semua Status</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button 
                className="btn btn-secondary w-100"
                onClick={() => {
                  setFilter({ student: '', status: '' });
                  setSelectedMonth('all');
                }}
              >
                Reset Filter
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : noDataForDate ? (
        <div className="card">
          <div className="card-body">
            <div className="text-center py-5">
              <i className="bi bi-calendar-x fs-1 text-muted mb-3"></i>
              <h5 className="text-muted">Tidak ada data kehadiran</h5>
              <p className="text-muted">Tidak ada data kehadiran untuk tanggal {format(new Date(selectedDate), 'dd MMMM yyyy', { locale: id })}</p>
              <button 
                className="btn btn-primary mt-3" 
                onClick={() => {
                  setAddDate(selectedDate);
                  setIsAddModalOpen(true);
                }}
              >
                Buat Data Kehadiran untuk Tanggal Ini
              </button>
            </div>
          </div>
        </div>
      ) : filteredAttendances.length === 0 ? (
        <div className="alert alert-info">Tidak ada data kehadiran yang sesuai dengan filter</div>
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>No.</th>
                    <th>Nama</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendances.map((attendance, index) => {
                    // Check if this record has pending changes
                    const hasPendingChanges = pendingChanges[attendance.student_class_id];
                    const currentStatus = hasPendingChanges || attendance.status;
                    
                    return (
                      <tr 
                        key={attendance.student_class_id || index}
                        className={hasPendingChanges ? 'table-info' : ''}
                      >
                      <td>{index + 1}</td>
                        <td className="text-uppercase">{attendance.studentName || '-'}</td>
                      <td>
                          <div className="d-flex justify-content-end gap-2">
                            <button 
                              className={`btn btn-sm ${currentStatus === 'Hadir' ? 'btn-primary' : 'btn-outline-primary'}`}
                              onClick={() => {
                                const updatedAttendance = {...attendance};
                                setCurrentAttendance(updatedAttendance);
                                setEditStatus('Hadir');
                                handleStatusSelect(updatedAttendance, 'Hadir');
                              }}
                            >
                              Hadir
                            </button>
                            <button 
                              className={`btn btn-sm ${currentStatus === 'Izin' ? 'btn-warning' : 'btn-outline-warning'}`}
                              onClick={() => {
                                const updatedAttendance = {...attendance};
                                setCurrentAttendance(updatedAttendance);
                                setEditStatus('Izin');
                                handleStatusSelect(updatedAttendance, 'Izin');
                              }}
                            >
                              Izin
                            </button>
                            <button 
                              className={`btn btn-sm ${currentStatus === 'Sakit' ? 'btn-danger' : 'btn-outline-danger'}`}
                              onClick={() => {
                                const updatedAttendance = {...attendance};
                                setCurrentAttendance(updatedAttendance);
                                setEditStatus('Sakit');
                                handleStatusSelect(updatedAttendance, 'Sakit');
                              }}
                            >
                              Sakit
                            </button>
                        <button 
                              className={`btn btn-sm ${currentStatus === 'Alpha' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                              onClick={() => {
                                const updatedAttendance = {...attendance};
                                setCurrentAttendance(updatedAttendance);
                                setEditStatus('Alpha');
                                handleStatusSelect(updatedAttendance, 'Alpha');
                              }}
                            >
                              Alpha
                        </button>
                          </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Save Changes Button */}
            {hasChanges && (
              <div className="mt-3 d-flex justify-content-end">
                <div>
                  <button 
                    className="btn btn-secondary me-2"
                    onClick={() => {
                      setPendingChanges({});
                      setHasChanges(false);
                    }}
                  >
                    Batal
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={saveAllChanges}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Memproses...
                      </>
                    ) : (
                      'Simpan Perubahan'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Add Attendance Modal */}
      {isAddModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Tambah Data Kehadiran</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setIsAddModalOpen(false)} 
                  disabled={isCreating}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="addDate" className="form-label">Tanggal Kehadiran</label>
                  <input
                    type="date"
                    className="form-control"
                    id="addDate"
                    value={addDate}
                    onChange={handleAddDateChange}
                    max={today}
                    disabled={isCreating}
                  />
                  <small className="text-muted">
                    Tanggal tidak boleh melebihi tanggal hari ini.
                  </small>
                </div>
                <p className="text-muted">
                  Sistem akan membuat daftar kehadiran untuk seluruh siswa di kelas Anda pada tanggal yang dipilih.
                </p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isCreating}
                >
                  Batal
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleAddAttendance}
                  disabled={isCreating || !addDate}
                >
                  {isCreating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Memproses...
                    </>
                  ) : (
                    'Tambah Kehadiran'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Attendance Modal */}
      {isEditModalOpen && currentAttendance && (
        <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Status Kehadiran</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setIsEditModalOpen(false)} 
                  disabled={isUpdating}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>Nama Siswa:</strong> {currentAttendance.studentName}
                </p>
                <p>
                  <strong>Tanggal:</strong> {format(new Date(currentAttendance.date), 'dd MMMM yyyy', { locale: id })}
                </p>
                <div className="mb-3">
                  <label htmlFor="editStatus" className="form-label">Status Kehadiran</label>
                  <select
                    className="form-select"
                    id="editStatus"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    disabled={isUpdating}
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isUpdating}
                >
                  Batal
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => {
                    handleStatusSelect(currentAttendance, editStatus);
                    setIsEditModalOpen(false);
                  }}
                  disabled={isUpdating || !editStatus}
                >
                  {isUpdating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Memproses...
                    </>
                  ) : (
                    'Simpan Perubahan'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaliKelasAttendances; 