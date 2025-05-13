import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { academicYearsAPI, studentsAPI, usersAPI, semesterAPI } from '../utils/api'
import { toast } from 'react-toastify'
import { useSemester } from '../contexts/SemesterContext'

function AcademicYearManagement() {
  const [academicYears, setAcademicYears] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(null)
  const [newAcademicYear, setNewAcademicYear] = useState({
    year: '',
    is_active: true
  })
  const [editAcademicYearForm, setEditAcademicYearForm] = useState({
    year: '',
    is_active: true
  })
  // Add state for classes
  const [showClassesModal, setShowClassesModal] = useState(false)
  const [showAddClassModal, setShowAddClassModal] = useState(false)
  const [showEditClassModal, setShowEditClassModal] = useState(false)
  const [showDeleteClassModal, setShowDeleteClassModal] = useState(false)
  const [classes, setClasses] = useState([])
  const [classesLoading, setClassesLoading] = useState(false)
  const [newClass, setNewClass] = useState({
    name: '',
    teacher_id: ''
  })
  const [editClassData, setEditClassData] = useState({
    id: null,
    name: '',
    teacher_id: ''
  })
  const [selectedClassForDelete, setSelectedClassForDelete] = useState(null)
  // Add state for students
  const [showStudentsModal, setShowStudentsModal] = useState(false)
  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [showDeleteStudentModal, setShowDeleteStudentModal] = useState(false)
  const [selectedClass, setSelectedClass] = useState(null)
  const [students, setStudents] = useState([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [selectedStudentForDelete, setSelectedStudentForDelete] = useState(null)
  
  // Add state for all available students for dropdown
  const [availableStudents, setAvailableStudents] = useState([])
  const [loadingAvailableStudents, setLoadingAvailableStudents] = useState(false)
  
  // Change to array of student IDs
  const [selectedStudentIds, setSelectedStudentIds] = useState([])
  
  // New state variables for teachers
  const [teachers, setTeachers] = useState([])
  const [loadingTeachers, setLoadingTeachers] = useState(false)
  
  // Semester management state
  const [showSemesterModal, setShowSemesterModal] = useState(false)
  const [semesterList, setSemesterList] = useState([])
  const [loadingSemesters, setLoadingSemesters] = useState(false)
  const [changingActiveSemester, setChangingActiveSemester] = useState(false)
  const { activeSemester, fetchSemesters } = useSemester()
  
  const { currentUser } = useAuth()
  const isAdmin = currentUser?.role === 'admin';

  const fetchAcademicYears = async () => {
    console.log('AcademicYearManagement: Starting to fetch academic years');
    try {
      setLoading(true)
      console.log('AcademicYearManagement: Calling academicYearsAPI.getAll()');
      const response = await academicYearsAPI.getAll()
      console.log('AcademicYearManagement: Received response from API:', response);
      setAcademicYears(Array.isArray(response) ? response : [])
      console.log('AcademicYearManagement: Academic years state updated with', Array.isArray(response) ? response.length : 0, 'items');
      setError(null)
    } catch (err) {
      console.error('AcademicYearManagement: Error fetching academic years:', err);
      setError('Gagal mengambil data tahun ajaran')
      toast.error('Gagal mengambil data tahun ajaran')
      setAcademicYears([])
    } finally {
      setLoading(false)
      console.log('AcademicYearManagement: Fetch operation completed');
    }
  }

  useEffect(() => {
    if (currentUser) {
      fetchAcademicYears()
    }
  }, [currentUser])

  // Load semester data when the semester modal is opened
  useEffect(() => {
    if (showSemesterModal) {
      fetchAvailableSemesters();
    }
  }, [showSemesterModal]);

  const handleManageSemestersClick = () => {
    setShowSemesterModal(true);
  };

  const handleAddClick = () => {
    setNewAcademicYear({
      year: '',
      is_active: true
    })
    setShowAddModal(true)
  }

  const handleEditClick = (academicYear) => {
    setSelectedAcademicYear(academicYear)
    setEditAcademicYearForm({
      year: academicYear.year,
      is_active: academicYear.is_active
    })
    setShowEditModal(true)
  }

  const handleDeleteClick = (academicYear) => {
    setSelectedAcademicYear(academicYear)
    setShowDeleteModal(true)
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    console.log('AcademicYearManagement: Adding new academic year:', newAcademicYear);
    try {
      setLoading(true)
      console.log('AcademicYearManagement: Calling academicYearsAPI.create()');
      const result = await academicYearsAPI.create(newAcademicYear)
      console.log('AcademicYearManagement: Successfully created academic year, received:', result);
      setShowAddModal(false)
      fetchAcademicYears()
      toast.success('Tahun ajaran berhasil ditambahkan')
    } catch (err) {
      console.error('AcademicYearManagement: Error creating academic year:', err);
      setError('Gagal menambahkan tahun ajaran')
      toast.error('Gagal menambahkan tahun ajaran')
    } finally {
      setLoading(false)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    console.log(`AcademicYearManagement: Updating academic year ID ${selectedAcademicYear.id} with:`, editAcademicYearForm);
    try {
      setLoading(true)
      console.log('AcademicYearManagement: Calling academicYearsAPI.update()');
      const result = await academicYearsAPI.update(selectedAcademicYear.id, editAcademicYearForm)
      console.log('AcademicYearManagement: Successfully updated academic year, received:', result);
      setShowEditModal(false)
      fetchAcademicYears()
      toast.success('Tahun ajaran berhasil diperbarui')
    } catch (err) {
      console.error('AcademicYearManagement: Error updating academic year:', err);
      setError('Gagal memperbarui tahun ajaran')
      toast.error('Gagal memperbarui tahun ajaran')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    console.log(`AcademicYearManagement: Deleting academic year ID ${selectedAcademicYear.id}`);
    try {
      setLoading(true)
      console.log('AcademicYearManagement: Calling academicYearsAPI.delete()');
      const result = await academicYearsAPI.delete(selectedAcademicYear.id)
      console.log('AcademicYearManagement: Successfully deleted academic year, received:', result);
      setShowDeleteModal(false)
      fetchAcademicYears()
      toast.success('Tahun ajaran berhasil dihapus')
    } catch (err) {
      console.error('AcademicYearManagement: Error deleting academic year:', err);
      setError('Gagal menghapus tahun ajaran')
      toast.error('Gagal menghapus tahun ajaran')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAcademicYear({
      ...newAcademicYear,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditAcademicYearForm({
      ...editAcademicYearForm,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  // Handler for viewing classes
  const handleViewClasses = async (academicYear) => {
    setSelectedAcademicYear(academicYear)
    setClassesLoading(true)
    setShowClassesModal(true)
    
    try {
      console.log(`AcademicYearManagement: Fetching classes for academic year ${academicYear.id}`);
      console.log(`AcademicYearManagement: Academic year details:`, academicYear);
      console.log(`AcademicYearManagement: API URL will be: /academic-years/${academicYear.id}/classes`);
      
      const academicYearData = await academicYearsAPI.getClasses(academicYear.id)
      
      console.log(`AcademicYearManagement: API response received for classes`);
      console.log(`AcademicYearManagement: Response type: ${typeof academicYearData}`);
      console.log(`AcademicYearManagement: Response structure:`, Object.keys(academicYearData));
      console.log(`AcademicYearManagement: Full API response:`, academicYearData);
      
      // Extract classes from the response based on the structure in the image
      const classesData = academicYearData.classes || [];
      console.log(`AcademicYearManagement: Extracted classes array:`, classesData);
      console.log(`AcademicYearManagement: Found ${classesData.length} classes`);
      
      if (classesData.length > 0) {
        console.log(`AcademicYearManagement: Sample class data:`, classesData[0]);
        console.log(`AcademicYearManagement: Available fields:`, Object.keys(classesData[0]));
      }
      
      setClasses(Array.isArray(classesData) ? classesData : [])
    } catch (err) {
      console.error('AcademicYearManagement: Error fetching classes:', err);
      console.error('AcademicYearManagement: Error details:', err.message);
      console.error('AcademicYearManagement: Error stack:', err.stack);
      toast.error('Gagal mengambil data kelas untuk tahun ajaran ini')
      setClasses([])
    } finally {
      setClassesLoading(false)
      console.log('AcademicYearManagement: Classes fetch operation completed');
    }
  }

  // Handler for viewing students in a class
  const handleViewStudents = async (classItem) => {
    setSelectedClass(classItem)
    setStudentsLoading(true)
    setShowStudentsModal(true)
    
    try {
      console.log(`AcademicYearManagement: Starting to fetch students for class ${classItem.id} in academic year ${selectedAcademicYear.id}`);
      console.log(`AcademicYearManagement: Class details:`, classItem);
      console.log(`AcademicYearManagement: Academic year details:`, selectedAcademicYear);
      console.log(`AcademicYearManagement: API URL will be: /academic-years/${selectedAcademicYear.id}/classes/${classItem.id}/students`);
      
      const data = await academicYearsAPI.getStudentsInClass(selectedAcademicYear.id, classItem.id)
      
      console.log(`AcademicYearManagement: API response received for students`);
      console.log(`AcademicYearManagement: Response type:`, typeof data);
      console.log(`AcademicYearManagement: Response structure:`, Object.keys(data));
      console.log(`AcademicYearManagement: Full API response:`, data);
      
      // Extract students from the response
      const studentsData = data.students || [];
      console.log(`AcademicYearManagement: Extracted students array:`, studentsData);
      console.log(`AcademicYearManagement: Found ${studentsData.length} students`);
      
      if (studentsData.length > 0) {
        console.log(`AcademicYearManagement: Sample student data:`, studentsData[0]);
        console.log(`AcademicYearManagement: Available fields:`, Object.keys(studentsData[0]));
      }
      
      setStudents(Array.isArray(studentsData) ? studentsData : [])
    } catch (err) {
      console.error('AcademicYearManagement: Error fetching students:', err);
      console.error('AcademicYearManagement: Error details:', err.message);
      console.error('AcademicYearManagement: Error stack:', err.stack);
      toast.error('Gagal mengambil data siswa untuk kelas ini')
      setStudents([])
    } finally {
      setStudentsLoading(false)
      console.log('AcademicYearManagement: Students fetch operation completed');
    }
  }

  // Fetch teachers for dropdown
  const fetchTeachers = async () => {
    setLoadingTeachers(true)
    try {
      console.log('AcademicYearManagement: Fetching all teachers for dropdown');
      // Use the usersAPI with role wali_kelas instead of teachersAPI
      const allTeachers = await usersAPI.getAll('wali_kelas');
      console.log('AcademicYearManagement: Received all teachers:', allTeachers);
      setTeachers(Array.isArray(allTeachers) ? allTeachers : []);
    } catch (err) {
      console.error('AcademicYearManagement: Error fetching teachers:', err);
      toast.error('Gagal mengambil data guru');
      setTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  };

  // Handler for adding a new class, update to fetch teachers
  const handleAddClassClick = () => {
    setNewClass({
      name: '',
      teacher_id: ''
    })
    setShowAddClassModal(true)
    fetchTeachers() // Fetch teachers when opening the modal
  }

  // Handler for class form input changes
  const handleClassInputChange = (e) => {
    const { name, value } = e.target;
    setNewClass({
      ...newClass,
      [name]: value
    })
  }

  // Handler for submitting new class
  const handleAddClassSubmit = async (e) => {
    e.preventDefault()
    try {
      setClassesLoading(true)
      console.log(`AcademicYearManagement: Adding class to academic year ${selectedAcademicYear.id}:`, newClass);
      
      const result = await academicYearsAPI.addClass(selectedAcademicYear.id, newClass)
      console.log(`AcademicYearManagement: Class added successfully, result:`, result);
      
      // Refresh the classes
      console.log(`AcademicYearManagement: Refreshing classes for academic year ${selectedAcademicYear.id}`);
      const academicYearData = await academicYearsAPI.getClasses(selectedAcademicYear.id)
      console.log(`AcademicYearManagement: Refreshed classes data:`, academicYearData);
      
      // Extract classes array from response
      const classesData = academicYearData.classes || [];
      setClasses(Array.isArray(classesData) ? classesData : [])
      
      setShowAddClassModal(false)
      toast.success('Kelas berhasil ditambahkan')
    } catch (err) {
      console.error('AcademicYearManagement: Error adding class:', err);
      toast.error('Gagal menambahkan kelas')
    } finally {
      setClassesLoading(false)
    }
  }

  // Handler for editing a class
  const handleEditClassClick = (classItem) => {
    setEditClassData({
      id: classItem.id,
      name: classItem.name,
      teacher_id: classItem.teacher_id || ''
    })
    setShowEditClassModal(true)
    fetchTeachers() // Fetch teachers for dropdown
  }

  // Handler for edit class form input changes
  const handleEditClassInputChange = (e) => {
    const { name, value } = e.target;
    setEditClassData({
      ...editClassData,
      [name]: value
    })
  }

  // Handler for submitting class edit
  const handleEditClassSubmit = async (e) => {
    e.preventDefault()
    try {
      setClassesLoading(true)
      console.log(`AcademicYearManagement: Updating class with id: ${editClassData.id}, data:`, editClassData);
      
      // Make a copy of edit data without the ID for the API payload
      const { id, ...updateData } = editClassData;
      const result = await academicYearsAPI.updateClass(id, updateData)
      console.log(`AcademicYearManagement: Class updated successfully, result:`, result);
      
      // Refresh the classes
      console.log(`AcademicYearManagement: Refreshing classes after update`);
      const academicYearData = await academicYearsAPI.getClasses(selectedAcademicYear.id)
      
      // Extract classes array from response
      const classesData = academicYearData.classes || [];
      setClasses(Array.isArray(classesData) ? classesData : [])
      
      setShowEditClassModal(false)
      toast.success('Kelas berhasil diperbarui')
    } catch (err) {
      console.error('AcademicYearManagement: Error updating class:', err);
      toast.error('Gagal memperbarui kelas')
    } finally {
      setClassesLoading(false)
    }
  }

  // Handler for deleting a class
  const handleDeleteClassClick = (classItem) => {
    setSelectedClassForDelete(classItem)
    setShowDeleteClassModal(true)
  }

  // Handler for confirming class deletion
  const handleDeleteClassConfirm = async () => {
    try {
      setClassesLoading(true)
      console.log(`AcademicYearManagement: Deleting class with id: ${selectedClassForDelete.id}`);
      
      await academicYearsAPI.deleteClass(selectedClassForDelete.id)
      console.log(`AcademicYearManagement: Class deleted successfully`);
      
      // Refresh the classes
      console.log(`AcademicYearManagement: Refreshing classes after deletion`);
      const academicYearData = await academicYearsAPI.getClasses(selectedAcademicYear.id)
      
      // Extract classes array from response
      const classesData = academicYearData.classes || [];
      setClasses(Array.isArray(classesData) ? classesData : [])
      
      setShowDeleteClassModal(false)
      toast.success('Kelas berhasil dihapus')
    } catch (err) {
      console.error('AcademicYearManagement: Error deleting class:', err);
      toast.error('Gagal menghapus kelas')
    } finally {
      setClassesLoading(false)
    }
  }

  // Fetch all available students for dropdown
  const fetchAvailableStudents = async () => {
    setLoadingAvailableStudents(true)
    try {
      console.log('AcademicYearManagement: Fetching all available students for dropdown');
      const allStudents = await studentsAPI.getAll();
      console.log('AcademicYearManagement: Received all students:', allStudents);
      setAvailableStudents(Array.isArray(allStudents) ? allStudents : []);
    } catch (err) {
      console.error('AcademicYearManagement: Error fetching available students:', err);
      toast.error('Gagal mengambil data siswa');
      setAvailableStudents([]);
    } finally {
      setLoadingAvailableStudents(false);
    }
  };

  // Handler for adding a new student
  const handleAddStudentClick = () => {
    setSelectedStudentIds([])
    setShowAddStudentModal(true)
    fetchAvailableStudents()
  }

  // Handler for checkbox change in student selection
  const handleStudentSelectionChange = (e) => {
    const studentId = e.target.value;
    
    if (e.target.checked) {
      // Add student ID to selected list
      setSelectedStudentIds(prev => [...prev, studentId]);
    } else {
      // Remove student ID from selected list
      setSelectedStudentIds(prev => prev.filter(id => id !== studentId));
    }
  }

  // Handler for submitting student assignments
  const handleAddStudentSubmit = async (e) => {
    e.preventDefault()
    try {
      setStudentsLoading(true)
      console.log(`AcademicYearManagement: Starting to add students to class ${selectedClass.id} in academic year ${selectedAcademicYear.id}`);
      console.log(`AcademicYearManagement: Selected student IDs:`, selectedStudentIds);
      console.log(`AcademicYearManagement: API URL will be: /academic-years/${selectedAcademicYear.id}/classes/${selectedClass.id}/students`);
      
      const result = await academicYearsAPI.addStudentToClass(
        selectedAcademicYear.id, 
        selectedClass.id, 
        selectedStudentIds
      )
      
      console.log(`AcademicYearManagement: API response for adding students:`);
      console.log(`AcademicYearManagement: Response type:`, typeof result);
      console.log(`AcademicYearManagement: Full response:`, result);
      
      // Refresh the students list
      console.log(`AcademicYearManagement: Refreshing students list after adding new students`);
      const data = await academicYearsAPI.getStudentsInClass(
        selectedAcademicYear.id, 
        selectedClass.id
      )
      
      console.log(`AcademicYearManagement: Received updated students list:`);
      console.log(`AcademicYearManagement: Updated response:`, data);
      
      // Extract students array from response
      const studentsData = data.students || [];
      console.log(`AcademicYearManagement: Updated student count: ${studentsData.length}`);
      
      setStudents(Array.isArray(studentsData) ? studentsData : [])
      
      setShowAddStudentModal(false)
      toast.success('Siswa berhasil ditambahkan ke kelas')
    } catch (err) {
      console.error('AcademicYearManagement: Error adding student:', err);
      console.error('AcademicYearManagement: Error details:', err.message);
      console.error('AcademicYearManagement: Error stack:', err.stack);
      toast.error('Gagal menambahkan siswa ke kelas')
    } finally {
      setStudentsLoading(false)
      console.log('AcademicYearManagement: Student add operation completed');
    }
  }

  // Handler for deleting a student from class
  const handleDeleteStudentClick = (student) => {
    setSelectedStudentForDelete(student)
    setShowDeleteStudentModal(true)
  }

  // Handler for confirming student deletion
  const handleDeleteStudentConfirm = async () => {
    try {
      setStudentsLoading(true)
      console.log(`AcademicYearManagement: Deleting student ${selectedStudentForDelete.id} from class ${selectedClass.id} in academic year ${selectedAcademicYear.id}`);
      
      await academicYearsAPI.removeStudentFromClass(
        selectedAcademicYear.id,
        selectedClass.id,
        selectedStudentForDelete.id
      )
      
      console.log(`AcademicYearManagement: Student deleted successfully`);
      
      // Refresh the students list
      console.log(`AcademicYearManagement: Refreshing students list after deletion`);
      const data = await academicYearsAPI.getStudentsInClass(
        selectedAcademicYear.id, 
        selectedClass.id
      )
      
      // Extract students array from response
      const studentsData = data.students || [];
      setStudents(Array.isArray(studentsData) ? studentsData : [])
      
      setShowDeleteStudentModal(false)
      toast.success('Siswa berhasil dihapus dari kelas')
    } catch (err) {
      console.error('AcademicYearManagement: Error deleting student:', err);
      console.error('AcademicYearManagement: Error details:', err.message);
      toast.error('Gagal menghapus siswa dari kelas')
    } finally {
      setStudentsLoading(false)
    }
  }

  // Calculate statistics for active/inactive years
  const totalYears = academicYears.length;
  const activeYears = academicYears.filter(year => year.is_active).length;
  const inactiveYears = totalYears - activeYears;
  const activePercentage = totalYears > 0 ? (activeYears / totalYears) * 100 : 0;
  const inactivePercentage = totalYears > 0 ? (inactiveYears / totalYears) * 100 : 0;

  // Fetch available semesters
  const fetchAvailableSemesters = async () => {
    try {
      setLoadingSemesters(true);
      console.log('AcademicYearManagement: Fetching all semesters');
      const data = await semesterAPI.getAll();
      console.log('AcademicYearManagement: Received semesters data:', data);
      
      if (Array.isArray(data)) {
        setSemesterList(data);
      } else {
        console.error('AcademicYearManagement: Unexpected semesters data format:', data);
        setSemesterList([]);
      }
    } catch (err) {
      console.error('AcademicYearManagement: Error fetching semesters:', err);
      toast.error('Gagal mengambil data semester');
    } finally {
      setLoadingSemesters(false);
    }
  };

  // Set active semester
  const setActiveSemester = async (semesterId) => {
    try {
      setChangingActiveSemester(true);
      console.log(`AcademicYearManagement: Setting semester ${semesterId} as active`);
      await academicYearsAPI.setActiveSemester(semesterId);
      toast.success('Semester aktif berhasil diubah');
      
      // Refresh the semester list and context
      await fetchSemesters();
      await fetchAvailableSemesters();
    } catch (err) {
      console.error('AcademicYearManagement: Error setting active semester:', err);
      toast.error('Gagal mengubah semester aktif');
    } finally {
      setChangingActiveSemester(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Manajemen Tahun Ajaran</h2>
        <div>
          {isAdmin && (
            <button
              className="btn btn-outline-primary me-2"
              onClick={handleManageSemestersClick}
            >
              <i className="bi bi-calendar3"></i> Kelola Semester
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={handleAddClick}
          >
            <i className="bi bi-plus-circle"></i> Tambah Tahun Ajaran
          </button>
        </div>
      </div>
      
      {/* Semester Management Modal */}
      {showSemesterModal && (
        <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Kelola Semester</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowSemesterModal(false)} 
                  disabled={changingActiveSemester}
                ></button>
              </div>
              <div className="modal-body">
                {!isAdmin && (
                  <div className="alert alert-warning mb-4">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <strong>Perhatian:</strong> Hanya admin yang dapat mengubah semester aktif. Anda dapat melihat daftar semester, tetapi tidak dapat mengubahnya.
                  </div>
                )}
                
                {/* Current Active Semester */}
                {activeSemester && (
                  <div className="mb-4">
                    <div className="alert alert-info">
                      <h6 className="fw-bold mb-0">Semester Aktif Saat Ini:</h6>
                      <p className="mb-0 mt-1">
                        <span className="badge bg-success me-2">
                          <i className="bi bi-check-circle me-1"></i>
                          Aktif
                        </span>
                        {activeSemester.name || `Semester ${activeSemester.semester}`}
                      </p>
                    </div>
                  </div>
                )}
                
                <h6 className="mb-3">Daftar Semester</h6>
                
                {loadingSemesters ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : semesterList.length > 0 ? (
                  <div className="row">
                    {semesterList.map((semester) => (
                      <div key={`semester-${semester.id}`} className="col-md-6 col-xl-4 mb-3">
                        <div className={`card h-100 ${activeSemester && activeSemester.id === semester.id ? 'border-primary' : ''}`}>
                          <div className="card-body d-flex flex-column">
                            <h5 className="card-title">
                              {semester.name}
                              {activeSemester && activeSemester.id === semester.id && (
                                <span className="badge bg-success ms-2">Aktif</span>
                              )}
                            </h5>
                            <p className="card-text text-muted mb-3">
                              {semester.description || `Semester ${semester.semester}`}
                            </p>
                            <div className="mt-auto text-end">
                              <button
                                className="btn btn-primary"
                                onClick={() => setActiveSemester(semester.id)}
                                disabled={
                                  changingActiveSemester || 
                                  (activeSemester && activeSemester.id === semester.id)
                                }
                              >
                                {changingActiveSemester ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Memproses...
                                  </>
                                ) : activeSemester && activeSemester.id === semester.id ? (
                                  'Aktif Saat Ini'
                                ) : (
                                  'Jadikan Aktif'
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="alert alert-info">
                    Tidak ada semester yang tersedia
                  </div>
                )}
                
                <div className="mt-3">
                  <button
                    className="btn btn-outline-primary me-2"
                    onClick={fetchAvailableSemesters}
                    disabled={loadingSemesters}
                  >
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Refresh
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowSemesterModal(false)}
                  disabled={changingActiveSemester}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Daftar Tahun Ajaran</h5>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Tahun Ajaran</th>
                        <th>Status</th>
                        <th>Dibuat Pada</th>
                        <th>Diperbarui Pada</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {academicYears.map(academicYear => (
                        <tr key={academicYear.id}>
                          <td>{academicYear.year}</td>
                          <td>
                            <span className={`badge ${
                              academicYear.is_active 
                                ? 'bg-success' 
                                : 'bg-secondary'
                            }`}>
                              {academicYear.is_active ? 'Aktif' : 'Non-aktif'}
                            </span>
                          </td>
                          <td>{new Date(academicYear.createdAt).toLocaleDateString('id-ID')}</td>
                          <td>{new Date(academicYear.updatedAt).toLocaleDateString('id-ID')}</td>
                          <td>
                            <div className="btn-group">
                              <button
                                onClick={() => handleViewClasses(academicYear)}
                                className="btn btn-sm btn-outline-info me-1"
                                title="Lihat Kelas"
                              >
                                <i className="bi bi-building"></i>
                              </button>
                              <button
                                onClick={() => handleEditClick(academicYear)}
                                className="btn btn-sm btn-outline-primary me-1"
                                disabled={loading}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                onClick={() => handleDeleteClick(academicYear)}
                                className="btn btn-sm btn-outline-danger"
                                disabled={loading}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {academicYears.length === 0 && !loading && (
                    <div className="text-center py-4 text-muted">
                      <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                      Tidak ada tahun ajaran ditemukan
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-header bg-white">
              <h5 className="card-title mb-0">Statistik Tahun Ajaran</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Tahun Ajaran Aktif</span>
                  <span className="badge bg-success">
                    {activeYears}
                  </span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div
                    className="progress-bar bg-success"
                    style={{ 
                      width: `${activePercentage}%` 
                    }}
                  ></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Tahun Ajaran Tidak Aktif</span>
                  <span className="badge bg-secondary">
                    {inactiveYears}
                  </span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div
                    className="progress-bar bg-secondary"
                    style={{ 
                      width: `${inactivePercentage}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Academic Year Modal */}
      {showAddModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Tambah Tahun Ajaran</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <form onSubmit={handleAddSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="year" className="form-label">Tahun Ajaran</label>
                    <input
                      type="text"
                      className="form-control"
                      id="year"
                      name="year"
                      placeholder="contoh: 2023/2024"
                      value={newAcademicYear.year}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="is_active"
                      name="is_active"
                      checked={newAcademicYear.is_active}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="is_active">
                      Aktif
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAddModal(false)}
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
                      'Simpan'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Academic Year Modal */}
      {showEditModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Tahun Ajaran</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="edit-year" className="form-label">Tahun Ajaran</label>
                    <input
                      type="text"
                      className="form-control"
                      id="edit-year"
                      name="year"
                      value={editAcademicYearForm.year}
                      onChange={handleEditInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="edit-is_active"
                      name="is_active"
                      checked={editAcademicYearForm.is_active}
                      onChange={handleEditInputChange}
                    />
                    <label className="form-check-label" htmlFor="edit-is_active">
                      Aktif
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowEditModal(false)}
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
                      'Simpan'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Academic Year Modal */}
      {showDeleteModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Konfirmasi Hapus</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Anda yakin ingin menghapus tahun ajaran ini?</p>
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Data yang dihapus tidak dapat dikembalikan.
                </div>
                <div className="mt-3">
                  <p className="mb-1"><strong>ID:</strong> {selectedAcademicYear?.id}</p>
                  <p className="mb-1"><strong>Tahun Ajaran:</strong> {selectedAcademicYear?.year}</p>
                  <p className="mb-0">
                    <strong>Status:</strong>{' '}
                    <span className={`badge ${
                      selectedAcademicYear?.is_active
                        ? 'bg-success' 
                        : 'bg-secondary'
                    }`}>
                      {selectedAcademicYear?.is_active ? 'Aktif' : 'Non-aktif'}
                    </span>
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={loading}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteConfirm}
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

      {/* View Classes Modal */}
      {showClassesModal && selectedAcademicYear && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Kelas untuk Tahun Ajaran: {selectedAcademicYear.year}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowClassesModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">Daftar Kelas</h6>
                  <button
                    onClick={handleAddClassClick}
                    className="btn btn-primary btn-sm"
                    disabled={classesLoading}
                  >
                    <i className="bi bi-plus-lg me-1"></i>
                    Tambah Kelas
                  </button>
                </div>

                {classesLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : classes.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <i className="bi bi-building fs-1 d-block mb-2"></i>
                    <p>Belum ada kelas untuk tahun ajaran ini</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Nama Kelas</th>
                          <th>Tingkat</th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classes.map(classItem => (
                          <tr key={classItem.id}>
                            <td>{classItem.name}</td>
                            <td>{classItem.grade_level}</td>
                            <td>
                              <button
                                onClick={() => handleViewStudents(classItem)}
                                className="btn btn-sm btn-outline-info me-1"
                                title="Lihat Siswa"
                              >
                                <i className="bi bi-people"></i>
                              </button>
                              <button
                                onClick={() => handleEditClassClick(classItem)}
                                className="btn btn-sm btn-outline-primary me-1"
                                title="Edit Kelas"
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                onClick={() => handleDeleteClassClick(classItem)}
                                className="btn btn-sm btn-outline-danger"
                                title="Hapus Kelas"
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
                  onClick={() => setShowClassesModal(false)}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Class Modal */}
      {showAddClassModal && selectedAcademicYear && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Tambah Kelas untuk {selectedAcademicYear.year}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddClassModal(false)}
                ></button>
              </div>
              <form onSubmit={handleAddClassSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">Nama Kelas</label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      name="name"
                      placeholder="contoh: Kelas 7A"
                      value={newClass.name}
                      onChange={handleClassInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="teacher_id" className="form-label">Guru</label>
                    <select
                      className="form-select"
                      id="teacher_id"
                      name="teacher_id"
                      value={newClass.teacher_id}
                      onChange={handleClassInputChange}
                      required
                      disabled={loadingTeachers}
                    >
                      <option value="">Pilih Guru</option>
                      {loadingTeachers ? (
                        <option value="" disabled>Memuat data guru...</option>
                      ) : (
                        teachers.map(teacher => (
                          <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                        ))
                      )}
                    </select>
                    {loadingTeachers && (
                      <div className="form-text text-muted">
                        <small><i className="bi bi-hourglass-split me-1"></i>Memuat data guru...</small>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAddClassModal(false)}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={classesLoading}
                  >
                    {classesLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Menyimpan...
                      </>
                    ) : (
                      'Tambah Kelas'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Students Modal */}
      {showStudentsModal && selectedClass && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Siswa di Kelas {selectedClass.name} - {selectedAcademicYear.year}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowStudentsModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">Daftar Siswa</h6>
                  <button
                    onClick={handleAddStudentClick}
                    className="btn btn-primary btn-sm"
                    disabled={studentsLoading}
                  >
                    <i className="bi bi-plus-lg me-1"></i>
                    Tambah Siswa
                  </button>
                </div>

                {studentsLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : students.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <i className="bi bi-people fs-1 d-block mb-2"></i>
                    <p>Belum ada siswa di kelas ini</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>NISN</th>
                          <th>Nama</th>
                          <th>Tanggal Lahir</th>
                          <th>ID Orang Tua</th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map(student => (
                          <tr key={student.id}>
                            <td>{student.nisn}</td>
                            <td>{student.name}</td>
                            <td>{student.birth_date ? new Date(student.birth_date).toLocaleDateString('id-ID') : '-'}</td>
                            <td>{student.parent_id || '-'}</td>
                            <td>
                              <button
                                onClick={() => handleDeleteStudentClick(student)}
                                className="btn btn-sm btn-outline-danger"
                                title="Hapus Siswa dari Kelas"
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
                  onClick={() => setShowStudentsModal(false)}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && selectedClass && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Tambah Siswa ke Kelas {selectedClass.name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddStudentModal(false)}
                ></button>
              </div>
              <form onSubmit={handleAddStudentSubmit}>
                <div className="modal-body">
                  <p className="mb-3">Pilih siswa yang ingin ditambahkan ke kelas ini:</p>
                  
                  {loadingAvailableStudents ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2">Memuat daftar siswa...</p>
                    </div>
                  ) : availableStudents.length === 0 ? (
                    <div className="alert alert-info">
                      Tidak ada siswa yang tersedia untuk ditambahkan.
                    </div>
                  ) : (
                    <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      <table className="table table-hover">
                        <thead className="sticky-top bg-white">
                          <tr>
                            <th width="50">Pilih</th>
                            <th>NISN</th>
                            <th>Nama</th>
                            <th>Tanggal Lahir</th>
                          </tr>
                        </thead>
                        <tbody>
                          {availableStudents.map(student => (
                            <tr key={student.id}>
                              <td>
                                <div className="form-check">
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id={`student-${student.id}`}
                                    value={student.id}
                                    checked={selectedStudentIds.includes(student.id)}
                                    onChange={handleStudentSelectionChange}
                                  />
                                </div>
                              </td>
                              <td>{student.nisn}</td>
                              <td>{student.name}</td>
                              <td>{student.birth_date ? new Date(student.birth_date).toLocaleDateString('id-ID') : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  {selectedStudentIds.length > 0 && (
                    <div className="mt-3 alert alert-info">
                      <i className="bi bi-info-circle me-2"></i>
                      {selectedStudentIds.length} siswa dipilih untuk ditambahkan ke kelas.
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAddStudentModal(false)}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={studentsLoading || selectedStudentIds.length === 0}
                  >
                    {studentsLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Menyimpan...
                      </>
                    ) : (
                      'Tambah Siswa'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {showEditClassModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Edit Kelas
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditClassModal(false)}
                ></button>
              </div>
              <form onSubmit={handleEditClassSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">Nama Kelas</label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      name="name"
                      value={editClassData.name}
                      onChange={handleEditClassInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="teacher_id" className="form-label">Guru</label>
                    <select
                      className="form-select"
                      id="teacher_id"
                      name="teacher_id"
                      value={editClassData.teacher_id}
                      onChange={handleEditClassInputChange}
                      required
                      disabled={loadingTeachers}
                    >
                      <option value="">Pilih Guru</option>
                      {loadingTeachers ? (
                        <option value="" disabled>Memuat data guru...</option>
                      ) : (
                        teachers.map(teacher => (
                          <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                        ))
                      )}
                    </select>
                    {loadingTeachers && (
                      <div className="form-text text-muted">
                        <small><i className="bi bi-hourglass-split me-1"></i>Memuat data guru...</small>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowEditClassModal(false)}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={classesLoading}
                  >
                    {classesLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Menyimpan...
                      </>
                    ) : (
                      'Simpan'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Class Modal */}
      {showDeleteClassModal && selectedClassForDelete && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Konfirmasi Hapus</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteClassModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Anda yakin ingin menghapus kelas ini?</p>
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Data yang dihapus tidak dapat dikembalikan.
                </div>
                <div className="mt-3">
                  <p className="mb-1"><strong>ID:</strong> {selectedClassForDelete.id}</p>
                  <p className="mb-1"><strong>Nama Kelas:</strong> {selectedClassForDelete.name}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteClassModal(false)}
                  disabled={classesLoading}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteClassConfirm}
                  disabled={classesLoading}
                >
                  {classesLoading ? (
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

      {/* Delete Student Modal */}
      {showDeleteStudentModal && selectedStudentForDelete && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Konfirmasi Hapus</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteStudentModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Anda yakin ingin menghapus siswa ini dari kelas ini?</p>
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Data yang dihapus tidak dapat dikembalikan.
                </div>
                <div className="mt-3">
                  <p className="mb-1"><strong>ID Siswa:</strong> {selectedStudentForDelete.id}</p>
                  <p className="mb-1"><strong>Nama Siswa:</strong> {selectedStudentForDelete.name}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteStudentModal(false)}
                  disabled={studentsLoading}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteStudentConfirm}
                  disabled={studentsLoading}
                >
                  {studentsLoading ? (
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
    </div>
  )
}

export default AcademicYearManagement 