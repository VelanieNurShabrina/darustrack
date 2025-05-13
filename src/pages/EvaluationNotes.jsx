import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSemester } from '../contexts/SemesterContext';
import { teachersAPI, semesterAPI } from '../utils/api';
import { toast } from 'react-toastify';

// Import constants and helper functions for direct API calls
const API_BASE_URL = 'https://darustrack-backend-production.up.railway.app';
const getCommonOptions = () => ({
  credentials: 'include',
  mode: 'cors',
  headers: {
    'Access-Control-Allow-Credentials': 'true'
  }
});
const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const EvaluationNotes = () => {
  const { userRole } = useAuth();
  const { activeSemester } = useSemester();
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [evaluations, setEvaluations] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [students, setStudents] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editDescription, setEditDescription] = useState('');
  const [viewingEvaluation, setViewingEvaluation] = useState(null);
  const [evaluationDetails, setEvaluationDetails] = useState(null);
  const [newNote, setNewNote] = useState({
    title: ''
  });
  // Track the current view
  const [currentView, setCurrentView] = useState('semesters'); // 'semesters', 'list', 'details', 'student'
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);

  const isWaliKelas = userRole === 'wali_kelas';

  useEffect(() => {
    fetchSemesters();
  }, []);

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      const response = await semesterAPI.getAll();
      setSemesters(Array.isArray(response) ? response : []);
      
      // Mark the active semester but don't automatically navigate to it
      if (activeSemester) {
        const activeSem = response.find(sem => sem.id === activeSemester.id);
        if (activeSem) {
          activeSem.is_active = true;
        }
      }
    } catch (err) {
      console.error('Error fetching semesters:', err);
      toast.error('Gagal mengambil data semester');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSemester = (semester) => {
    setSelectedSemester(semester);
    // Set loading to true before changing view
    setLoading(true);
    // Clear existing evaluations to avoid showing "Belum ada evaluasi" during loading
    setEvaluations([]);
    // Change the view to list
    setCurrentView('list');
    // Then fetch the evaluations
    fetchEvaluations(semester.id);
  };

  const fetchEvaluations = async (semesterId) => {
    try {
      // Loading is already set to true in handleSelectSemester
      console.log('Fetching evaluations:', semesterId);
      
      // Fetch data from API
      const response = await teachersAPI.getEvaluations(semesterId);
      console.log('Fetched evaluations:', response);
      console.log('Response type:', typeof response);
      console.log('Is array:', Array.isArray(response));
      
      // Process the response
      if (response && typeof response === 'object' && response.evaluations) {
        console.log('Found evaluations property:', response.evaluations);
        setEvaluations(Array.isArray(response.evaluations) ? response.evaluations : []);
      }
      // Check if response is directly an array
      else if (Array.isArray(response)) {
        setEvaluations(response);
      }
      // Otherwise try to extract evaluations from object
      else if (response && typeof response === 'object') {
        const evaluationsArray = Object.values(response).find(val => Array.isArray(val));
        if (evaluationsArray) {
          console.log('Found evaluations array in response object:', evaluationsArray);
          setEvaluations(evaluationsArray);
        } else {
          console.log('No evaluations array found in response, using empty array');
          setEvaluations([]);
        }
      } else {
        console.log('Unknown response format, using empty array');
        setEvaluations([]);
      }
    } catch (err) {
      console.error('Error fetching evaluations:', err);
      toast.error('Gagal mengambil data evaluasi');
      setEvaluations([]);
    } finally {
      console.log('Finished fetching evaluations, setting loading to false');
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setIsAdding(true);
  };

  const handleSaveNew = async (e) => {
    e.preventDefault();
    try {
      if (!newNote.title) {
        toast.error('Judul evaluasi harus diisi');
        return;
      }

      if (!selectedSemester) {
        toast.error('Semester tidak ditemukan');
        return;
      }

      const response = await teachersAPI.createEvaluation(selectedSemester.id, newNote);
      console.log('API Response:', response);
      setIsAdding(false);
      setNewNote({ title: '' });
      toast.success(response.message || 'Evaluasi berhasil ditambahkan');
      fetchEvaluations(selectedSemester.id); // Refresh the list
    } catch (err) {
      console.error('Error adding evaluation:', err);
      toast.error(err.message || 'Gagal menambahkan evaluasi');
    }
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewNote({ title: '' });
  };

  const handleEdit = (evaluation) => {
    console.log('Handling edit for evaluation:', evaluation);
    try {
      setEditingId(evaluation.id);
      setEditTitle(evaluation.title || '');
      console.log('Set editingId to:', evaluation.id);
      console.log('Set editTitle to:', evaluation.title);
    } catch (err) {
      console.error('Error in handleEdit:', err);
      toast.error('Error while entering edit mode');
    }
  };

  const handleUpdate = async (id) => {
    console.log('Handling update for evaluation ID:', id);
    console.log('Current editTitle:', editTitle);
    
    try {
      if (!editTitle.trim()) {
        toast.error('Judul evaluasi harus diisi');
        return;
      }

      console.log(`Making API call to update evaluation ${id} with title "${editTitle}"`);
      const response = await teachersAPI.updateEvaluation(null, id, { title: editTitle });
      console.log('Update evaluation response:', response);
      
      toast.success('Evaluasi berhasil diperbarui');
      setEditingId(null);
      
      // Refresh the evaluations
      if (selectedSemester) {
        fetchEvaluations(selectedSemester.id);
      }
    } catch (err) {
      console.error('Error updating evaluation:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      toast.error(err.message || 'Gagal memperbarui evaluasi');
    }
  };

  const handleViewDetails = async (evaluation) => {
    try {
      setLoading(true);
      setViewingEvaluation(evaluation);
      setCurrentView('details'); // Change to details view immediately to show loading spinner
      console.log('===== FETCHING EVALUATION DETAILS =====');
      console.log('Evaluation object:', evaluation);
      console.log('Evaluation ID:', evaluation.id);

      if (!selectedSemester) {
        console.log('No selected semester found');
        toast.error('Semester tidak ditemukan');
        return;
      }

      console.log('Selected semester:', selectedSemester);

      // Clear any existing evaluation details to ensure a fresh view
      setEvaluationDetails(null);

      // Try the semester-scoped endpoint first
      try {
        console.log(`Attempting to fetch via semester-scoped endpoint: /teachers/semesters/${selectedSemester.id}/evaluations/${evaluation.id}`);
      const response = await teachersAPI.getEvaluationById(selectedSemester.id, evaluation.id);
        console.log('Response status from semester-scoped endpoint:', 'success');
        console.log('Evaluation details from semester-scoped endpoint:', response);
        console.log('Response type:', typeof response);
        console.log('Is response an object?', typeof response === 'object');
        console.log('Response keys:', response ? Object.keys(response) : 'null response');
        
        if (response && typeof response === 'object') {
          console.log('Has students property?', 'students' in response);
          if ('students' in response) {
            console.log('Students array length:', Array.isArray(response.students) ? response.students.length : 'not an array');
            if (Array.isArray(response.students) && response.students.length > 0) {
              console.log('First student object:', response.students[0]);
              console.log('Student properties:', Object.keys(response.students[0]));
            }
          }
        }
        
      setEvaluationDetails(response);
      // We already changed to details view at the beginning
    } catch (err) {
        console.log('Error details from semester-scoped endpoint:', err);
        console.log('Error name:', err.name);
        console.log('Error message:', err.message);
        
        // Fall back to the direct endpoint if the first one fails
        try {
          console.log(`Attempting to fetch via direct endpoint: /teachers/evaluations/${evaluation.id}`);
          const directResponse = await teachersAPI.getEvaluation(evaluation.id);
          console.log('Response status from direct endpoint:', 'success');
          console.log('Evaluation details from direct endpoint:', directResponse);
          console.log('Response type:', typeof directResponse);
          console.log('Is response an object?', typeof directResponse === 'object');
          console.log('Response keys:', directResponse ? Object.keys(directResponse) : 'null response');
          
          if (directResponse && typeof directResponse === 'object') {
            console.log('Has students property?', 'students' in directResponse);
            if ('students' in directResponse) {
              console.log('Students array length:', Array.isArray(directResponse.students) ? directResponse.students.length : 'not an array');
              if (Array.isArray(directResponse.students) && directResponse.students.length > 0) {
                console.log('First student object:', directResponse.students[0]);
                console.log('Student properties:', Object.keys(directResponse.students[0]));
              }
            }
          }
          
          setEvaluationDetails(directResponse);
          // We already changed to details view at the beginning
        } catch (directErr) {
          console.log('Error details from direct endpoint:', directErr);
          console.log('Error name:', directErr.name);
          console.log('Error message:', directErr.message);
          
          // Try one more endpoint format as a last resort
          try {
            console.log(`Attempting to fetch via detail endpoint: /teachers/evaluations/detail/${evaluation.id}`);
            const detailResponse = await teachersAPI.getEvaluationDetail(evaluation.id);
            console.log('Response status from detail endpoint:', 'success');
            console.log('Evaluation details from detail endpoint:', detailResponse);
            console.log('Response type:', typeof detailResponse);
            console.log('Response keys:', detailResponse ? Object.keys(detailResponse) : 'null response');
            
            if (detailResponse && typeof detailResponse === 'object') {
              console.log('Has students property?', 'students' in detailResponse);
              if ('students' in detailResponse) {
                console.log('Students array length:', Array.isArray(detailResponse.students) ? detailResponse.students.length : 'not an array');
                if (Array.isArray(detailResponse.students) && detailResponse.students.length > 0) {
                  console.log('First student object:', detailResponse.students[0]);
                  console.log('Student properties:', Object.keys(detailResponse.students[0]));
                }
              }
            }
            
            setEvaluationDetails(detailResponse);
            // We already changed to details view at the beginning
          } catch (detailErr) {
            console.log('Error details from detail endpoint:', detailErr);
            console.log('Error name:', detailErr.name);
            console.log('Error message:', detailErr.message);
            console.log('Failed to load evaluation details from all endpoints');
            toast.error('Gagal memuat detail evaluasi');
            
            // If all endpoints fail, go back to the list view
            setCurrentView('list');
          }
        }
      }
    } catch (err) {
      console.error('Error viewing evaluation details:', err);
      toast.error('Gagal memuat detail evaluasi');
      setCurrentView('list');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudentDescription = async (student, evaluationId) => {
    try {
      setLoading(true);
      // Change to student edit view immediately
      setCurrentView('student');
      
      console.log('===== EDITING STUDENT DESCRIPTION =====');
      console.log('Student object:', student);
      console.log('Evaluation ID:', evaluationId);

      const studentId = student.id || student.student_id;
      const studentEvalId = student.student_evaluation_id;
      
      console.log('Student ID:', studentId);
      console.log('Student Evaluation ID:', studentEvalId);
      
      let studentEval = null;
      
      // The current evaluationDetails is an array format (direct endpoint)
      if (Array.isArray(evaluationDetails)) {
        console.log('Current evaluation details is an array, using student object directly');
        studentEval = student;
      }
      // Otherwise, try to fetch the student evaluation
      else if (!studentEval && studentEvalId) {
        // If we have a direct student evaluation ID, use that (most reliable)
        try {
          console.log(`Fetching student evaluation using direct endpoint with ID: ${studentEvalId}`);
          studentEval = await teachersAPI.getStudentEvaluationDirect(studentEvalId);
          console.log('Student evaluation from direct endpoint:', studentEval);
        } catch (err) {
          console.log('Direct student-evaluations endpoint failed:', err);
      }
      }
      else if (!studentEval && selectedSemester && studentId && evaluationId) {
        // Try the semester-scoped endpoint
        try {
          console.log(`Fetching student evaluation using semester endpoint: semester=${selectedSemester.id}, evaluation=${evaluationId}, student=${studentId}`);
          studentEval = await teachersAPI.getStudentEvaluation(
        selectedSemester.id,
            evaluationId,
            studentId
          );
          console.log('Student evaluation from semester-scoped endpoint:', studentEval);
        } catch (err) {
          console.log('Semester-scoped student endpoint failed:', err);
        }
      }
      else if (!studentEval && studentId && evaluationId) {
        // Try the direct evaluations endpoint
        try {
          console.log(`Fetching student evaluation using direct evaluations endpoint: evaluation=${evaluationId}, student=${studentId}`);
          const response = await fetch(`${API_BASE_URL}/teachers/evaluations/${evaluationId}/students/${studentId}`, {
            ...getCommonOptions(),
            headers: getHeaders()
          });
          if (!response.ok) throw new Error('Direct evaluations endpoint failed');
          studentEval = await response.json();
          console.log('Student evaluation from direct evaluations endpoint:', studentEval);
        } catch (err) {
          console.log('Direct evaluations endpoint failed:', err);
        }
      }

      // If we still don't have a student evaluation, just use what we have
      if (!studentEval) {
        console.log('Could not fetch student evaluation, using existing student data');
        studentEval = student;
      }

      setEditingStudent(student);
      // Use the description from the API response if available
      setEditDescription(studentEval?.description || student.description || '');
      // Already set current view to 'student' at the beginning of the function
      console.log('===== FINISHED EDITING STUDENT DESCRIPTION =====');
    } catch (err) {
      console.error('Error fetching student evaluation:', err);
      toast.error('Gagal mengambil data evaluasi siswa');
      // Fall back to using the description from the student object
      setEditingStudent(student);
      setEditDescription(student.description || '');
      // We already set the view at the beginning, don't need to set it again
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStudentDescription = async (evaluationId, studentId) => {
    try {
      setLoading(true);
      // Set the current view to 'details' immediately to show loading state
      setCurrentView('details');
      
      console.log('===== SAVING STUDENT DESCRIPTION =====');
      console.log('Saving description for evaluation:', evaluationId, 'student:', studentId);
      console.log('Student being edited:', editingStudent);
      console.log('Description value being saved:', editDescription);
      
      if (!editDescription.trim()) {
        setEditDescription('');
      }

      // Determine the proper ID to use
      const actualStudentId = studentId || editingStudent?.id || editingStudent?.student_id;
      const studentEvalId = editingStudent?.student_evaluation_id;
      
      console.log('Using student ID:', actualStudentId);
      console.log('Using student evaluation ID:', studentEvalId);

      if (!evaluationId && !studentEvalId) {
        toast.error('ID evaluasi tidak ditemukan');
        return;
      }

      let updateSuccess = false;
      
      // If we have a student_evaluation_id, use that directly first (most reliable)
      if (studentEvalId) {
        try {
          console.log(`Attempting to update via student-evaluations endpoint with ID: ${studentEvalId}`);
          const response = await fetch(`${API_BASE_URL}/teachers/student-evaluations/${studentEvalId}`, {
            method: 'PUT',
            ...getCommonOptions(),
            headers: getHeaders(),
            body: JSON.stringify({ description: editDescription })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to update student evaluation: ${errorText}`);
            throw new Error(`Server returned ${response.status}: ${errorText}`);
          }
          
          const resultData = await response.json();
          console.log('Update response:', resultData);
          console.log('Description updated via student-evaluations endpoint');
          updateSuccess = true;
        } catch (err) {
          console.log('Student-evaluations endpoint failed:', err);
      }
      }

      // Try semester-scoped endpoint if the direct method failed
      if (!updateSuccess && selectedSemester && evaluationId && actualStudentId) {
        try {
          console.log(`Attempting to update via semester-scoped endpoint: semester=${selectedSemester.id}, evaluation=${evaluationId}, student=${actualStudentId}`);
          const response = await fetch(`${API_BASE_URL}/teachers/semesters/${selectedSemester.id}/evaluations/${evaluationId}/students/${actualStudentId}`, {
            method: 'PUT',
            ...getCommonOptions(),
            headers: getHeaders(),
            body: JSON.stringify({ description: editDescription })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to update via semester-scoped endpoint: ${errorText}`);
            throw new Error(`Server returned ${response.status}: ${errorText}`);
          }
          
          const resultData = await response.json();
          console.log('Update response:', resultData);
          console.log('Description updated via semester-scoped endpoint');
          updateSuccess = true;
        } catch (err) {
          console.log('Semester-scoped endpoint failed:', err);
        }
      }

      // If both previous methods failed, try direct evaluation endpoint
      if (!updateSuccess && evaluationId && actualStudentId) {
        try {
          console.log(`Attempting to update via direct evaluations endpoint: evaluation=${evaluationId}, student=${actualStudentId}`);
          const response = await fetch(`${API_BASE_URL}/teachers/evaluations/${evaluationId}/students/${actualStudentId}`, {
            method: 'PUT',
            ...getCommonOptions(),
            headers: getHeaders(),
            body: JSON.stringify({ description: editDescription })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to update via direct evaluation endpoint: ${errorText}`);
            throw new Error(`Server returned ${response.status}: ${errorText}`);
          }
          
          const resultData = await response.json();
          console.log('Update response:', resultData);
          console.log('Description updated via direct evaluation endpoint');
          updateSuccess = true;
        } catch (err) {
          console.log('Direct evaluation endpoint failed:', err);
        }
      }

      if (!updateSuccess) {
        throw new Error('All update methods failed');
      }

      toast.success('Deskripsi berhasil diperbarui');

      // Always reload evaluation details from the server after successful update
      console.log('Reloading evaluation details after successful update');
      
      try {
        // First determine which endpoint to use for reloading
        let reloadedDetails = null;
        
        if (viewingEvaluation && selectedSemester) {
          console.log(`Reloading with semester-scoped endpoint: semester=${selectedSemester.id}, evaluation=${viewingEvaluation.id}`);
          try {
            reloadedDetails = await teachersAPI.getEvaluationById(selectedSemester.id, viewingEvaluation.id);
            console.log('Successfully reloaded with semester-scoped endpoint');
          } catch (err) {
            console.log('Failed to reload with semester-scoped endpoint:', err);
          }
        }
        
        if (!reloadedDetails && viewingEvaluation) {
          console.log(`Reloading with direct endpoint: ${viewingEvaluation.id}`);
          try {
            reloadedDetails = await teachersAPI.getEvaluation(viewingEvaluation.id);
            console.log('Successfully reloaded with direct endpoint');
          } catch (err) {
            console.log('Failed to reload with direct endpoint:', err);
            
            // Try the detail endpoint as a last resort
            try {
              console.log(`Reloading with detail endpoint: ${viewingEvaluation.id}`);
              reloadedDetails = await teachersAPI.getEvaluationDetail(viewingEvaluation.id);
              console.log('Successfully reloaded with detail endpoint');
            } catch (detailErr) {
              console.log('Failed to reload with detail endpoint:', detailErr);
            }
          }
        }
        
        if (reloadedDetails) {
          // Successfully reloaded, update the state
          console.log('Setting reloaded evaluation details:', reloadedDetails);
          setEvaluationDetails(reloadedDetails);
        } else {
          console.log('Could not reload evaluation details from any endpoint');
          
          // Fall back to updating in memory
          if (Array.isArray(evaluationDetails)) {
            // If evaluationDetails is an array, update it directly
            const updatedEvaluationDetails = evaluationDetails.map(student => {
              if ((student.id === actualStudentId) || 
                  (student.student_id === actualStudentId) ||
                  (student.student_evaluation_id === studentEvalId)) {
                console.log(`Updating student in array with ID: ${student.id || student.student_id}`);
                return { ...student, description: editDescription };
              }
              return student;
            });
            
            console.log('Updated evaluation details array in-place - Before:', 
              evaluationDetails.map(s => ({ id: s.id || s.student_id, desc: s.description })));
            console.log('After:', 
              updatedEvaluationDetails.map(s => ({ id: s.id || s.student_id, desc: s.description })));
              
            setEvaluationDetails(updatedEvaluationDetails);
          } else if (evaluationDetails && evaluationDetails.students) {
            // If evaluationDetails is an object with students array
            const updatedStudents = evaluationDetails.students.map(student => {
              if ((student.id === actualStudentId) || 
                  (student.student_id === actualStudentId) ||
                  (student.student_evaluation_id === studentEvalId)) {
                console.log(`Updating student in object with ID: ${student.id || student.student_id}`);
                return { ...student, description: editDescription };
              }
              return student;
            });
            
            setEvaluationDetails({
              ...evaluationDetails,
              students: updatedStudents
            });
          }
        }
      } catch (reloadErr) {
        console.error('Error reloading evaluation details:', reloadErr);
        // If we can't reload, at least show a success message
        toast.info('Deskripsi disimpan, tetapi gagal memuat ulang data evaluasi');
      }

      // Return to details view - we already set this at the beginning
      setEditingStudent(null);
      console.log('===== FINISHED SAVING STUDENT DESCRIPTION =====');
    } catch (err) {
      console.error('Error updating student description:', err);
      toast.error('Gagal memperbarui deskripsi: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudents = async (evaluation) => {
    try {
      setLoading(true);
      setSelectedEvaluation(evaluation);

      if (!selectedSemester) {
        toast.error('Semester tidak ditemukan');
        return;
      }

      const response = await teachersAPI.getStudentEvaluations(selectedSemester.id, evaluation.id);
      setStudents(response || []);
      // For non-wali_kelas, we continue using the modal
      if (!isWaliKelas) {
        // The modal will be shown automatically since selectedEvaluation is set
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      toast.error('Gagal mengambil data siswa');
    } finally {
      setLoading(false);
    }
  };

  const handleEditDescription = (student) => {
    setEditingStudent(student);
    setEditDescription(student.description || '');
  };

  const handleUpdateDescription = async () => {
    try {
      setLoading(true);

      if (!selectedSemester) {
        toast.error('Semester tidak ditemukan');
        return;
      }

      await teachersAPI.updateStudentEvaluation(
        selectedSemester.id,
        selectedEvaluation.id,
        editingStudent.id,
        { description: editDescription }
      );
      toast.success('Deskripsi berhasil diperbarui');
      setEditingStudent(null);
      // Refresh student list
      handleViewStudents(selectedEvaluation);
    } catch (err) {
      console.error('Error updating description:', err);
      toast.error('Gagal memperbarui deskripsi');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus evaluasi ini?')) {
      try {
        setLoading(true);
        let deleteSuccess = false;

        // Try semester-scoped endpoint first
        if (selectedSemester) {
          try {
            console.log(`Attempting to delete evaluation via semester endpoint: semester=${selectedSemester.id}, evaluation=${id}`);
            await teachersAPI.deleteEvaluation(selectedSemester.id, id);
            console.log('Evaluation deleted via semester endpoint');
            deleteSuccess = true;
          } catch (err) {
            console.log('Semester-scoped delete endpoint failed:', err);
          }
        }

        // If semester-scoped delete failed, try direct endpoint
        if (!deleteSuccess) {
          try {
            console.log(`Attempting to delete evaluation via direct endpoint: evaluation=${id}`);
            await teachersAPI.deleteEvaluationDirect(id);
            console.log('Evaluation deleted via direct endpoint');
            deleteSuccess = true;
          } catch (err) {
            console.log('Direct delete endpoint failed:', err);
          }
        }

        if (!deleteSuccess) {
          throw new Error('All delete methods failed');
        }

        toast.success('Evaluasi berhasil dihapus');
        // Return to list view if we were viewing the deleted evaluation
        if (viewingEvaluation?.id === id || selectedEvaluation?.id === id) {
          setViewingEvaluation(null);
          setSelectedEvaluation(null);
          setCurrentView('list');
        }
        
        // Refresh the evaluations list if semester is selected
        if (selectedSemester) {
          fetchEvaluations(selectedSemester.id);
        }
      } catch (err) {
        console.error('Error deleting evaluation:', err);
        toast.error(err.message || 'Gagal menghapus evaluasi');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBackToSemesters = () => {
    setCurrentView('semesters');
    setSelectedSemester(null);
    setEvaluations([]);
  };

  const handleBackToList = () => {
    setViewingEvaluation(null);
    setEvaluationDetails(null);
    setSelectedEvaluation(null);
    setEditingStudent(null);
    setCurrentView('list');
  };

  const handleBackToDetails = () => {
    setEditingStudent(null);
    setCurrentView('details');
  };

  // Render semester selection view
  const renderSemesterList = () => {
    return (
      <>
        <div className="row mb-4">
          <div className="col">
            <h2>Pilih Semester</h2>
          </div>
          <div className="col-auto">
            <button
              className="btn btn-outline-primary"
              onClick={fetchSemesters}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Refresh
            </button>
          </div>
        </div>

        {/* Semesters List */}
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : semesters.length > 0 ? (
          <div className="row">
            {semesters.map((semester) => (
              <div key={`semester-${semester.id}`} className="col-md-6 col-xl-4 mb-4">
                <div className="card h-100 shadow-sm">
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">
                      {semester.name}
                      {semester.is_active && (
                        <span className="badge bg-success ms-2">Aktif</span>
                      )}
                    </h5>
                   
                    <div className="mt-auto text-end">
                      <button
                        className="btn btn-primary"
                        onClick={() => handleSelectSemester(semester)}
                      >
                        Pilih Semester
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="alert alert-info">
            Belum ada semester yang tersedia
          </div>
        )}
      </>
    );
  };

  // Render evaluation list view
  const renderEvaluationList = () => {
    return (
      <>
        <div className="row mb-4">
          <div className="col">
            <div className="d-flex align-items-center">
              <button
                className="btn btn-link text-decoration-none p-0 me-3"
                onClick={handleBackToSemesters}
                style={{ color: '#000', fontSize: '1rem' }}
              >
                ← Kembali ke Daftar Semester
              </button>
              <h2 className="mb-0">
                Catatan Evaluasi
                {selectedSemester?.name && ` - ${selectedSemester.name}`}
                {!selectedSemester?.name && selectedSemester?.number && ` - Semester ${selectedSemester.number}`}
              </h2>
            </div>
          </div>
          {isWaliKelas && !loading && (
            <div className="col-auto">
              <button
                className="btn btn-primary"
                onClick={handleAddClick}
                disabled={isAdding || loading}
              >
                <i className="bi bi-plus"></i> Tambah Catatan
              </button>
            </div>
          )}
        </div>

        {/* Add title form */}
        {isAdding && !loading && (
          <div className="card mb-4">
            <div className="card-body">
              <form onSubmit={handleSaveNew}>
                <div className="mb-3">
                  <label htmlFor="noteTitle" className="form-label">Judul Evaluasi</label>
                  <input
                    type="text"
                    className="form-control"
                    id="noteTitle"
                    value={newNote.title}
                    onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                    required
                    placeholder="Masukkan judul evaluasi"
                  />
                </div>
                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancelAdd}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Evaluations List with Loading State */}
        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
            <div className="text-center">
              <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted">Memuat data evaluasi...</p>
            </div>
          </div>
        ) : evaluations.length > 0 ? (
          <div className="row">
            {evaluations.map((evaluation) => (
              <div key={`eval-${evaluation.id}`} className="col-12 mb-3">
                <div className="card">
                  <div className="card-body">
                    {editingId === evaluation.id ? (
                      <div className="d-flex gap-2 align-items-center">
                        <input
                          type="text"
                          className="form-control"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Masukkan judul baru"
                          autoFocus
                        />
                        <div className="btn-group">
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleUpdate(evaluation.id)}
                            title="Simpan perubahan"
                          >
                            <i className="bi bi-check-lg"></i> Simpan
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              console.log('Cancelling edit mode');
                              setEditingId(null);
                            }}
                            title="Batalkan perubahan"
                          >
                            <i className="bi bi-x-lg"></i> Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h5 className="card-title">{evaluation.title}</h5>
                        <div className="d-flex justify-content-between align-items-center">
                          <p className="card-text text-muted mb-0">
                            ID: {evaluation.id}
                          </p>
                          <div className="btn-group">
                            {isWaliKelas && (
                              <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => handleEdit(evaluation)}
                              >
                                Edit
                              </button>
                            )}
                            <button
                              className="btn btn-outline-info btn-sm"
                              onClick={() => handleViewDetails(evaluation)}
                            >
                              Detail
                            </button>
                            {isWaliKelas && (
                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => handleDelete(evaluation.id)}
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="alert alert-info">
            Belum ada evaluasi
          </div>
        )}

        {/* Student List Modal - Only shown for non-wali_kelas users */}
        {!isWaliKelas && selectedEvaluation && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Daftar Siswa - {selectedEvaluation.title}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setSelectedEvaluation(null);
                      setStudents([]);
                      setEditingStudent(null);
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  {students.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Nama Siswa</th>
                            <th>Deskripsi</th>
                            <th>Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((student) => (
                            <tr key={`list-${student.id}`}>
                              <td>{student.name}</td>
                              <td>
                                {editingStudent?.id === student.id ? (
                                  <div className="d-flex gap-2">
                                    <textarea
                                      className="form-control"
                                      value={editDescription}
                                      onChange={(e) => setEditDescription(e.target.value)}
                                      rows="2"
                                    />
                                    <div className="d-flex flex-column gap-1">
                                      <button
                                        className="btn btn-success btn-sm"
                                        onClick={handleUpdateDescription}
                                      >
                                        Simpan
                                      </button>
                                      <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => setEditingStudent(null)}
                                      >
                                        Batal
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  student.description || '-'
                                )}
                              </td>
                              <td>
                                {editingStudent?.id !== student.id && (
                                  <button
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => handleEditDescription(student)}
                                  >
                                    Edit Deskripsi
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="alert alert-info">
                      Belum ada data siswa
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  // Render evaluation details view
  const renderEvaluationDetails = () => {
    // Show loading spinner if loading is true, even without evaluation details
    if (loading) {
    return (
      <div className="container py-4">
        <div className="d-flex align-items-center mb-4">
          <button
            className="btn btn-link text-decoration-none p-0 me-3"
            onClick={handleBackToList}
            style={{ color: '#000', fontSize: '1rem' }}
          >
            ← Kembali ke Daftar Evaluasi
          </button>
            <h2 className="mb-0">
              Detail Evaluasi: {viewingEvaluation ? viewingEvaluation.title : ""}
            </h2>
        </div>

          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      );
    }

    if (!evaluationDetails) return null;

    // Check if evaluationDetails is an array (which is the format from direct endpoint)
    const isArrayResponse = Array.isArray(evaluationDetails);
    console.log('Rendering evaluation details, isArrayResponse:', isArrayResponse);
    
    // Get the students array based on response format
    let studentsArray = [];
    
    if (isArrayResponse) {
      // If evaluationDetails is an array, it IS the students array
      studentsArray = evaluationDetails;
      console.log('Using array response directly as students array:', studentsArray.length);
    } else if (evaluationDetails.students && Array.isArray(evaluationDetails.students)) {
      // If evaluationDetails has a students property that is an array
      studentsArray = evaluationDetails.students;
      console.log('Using students array from object response:', studentsArray.length);
    } else {
      console.log('No valid students array found in evaluation details');
    }

    return (
      <div className="container py-4">
        <div className="d-flex align-items-center mb-4">
          <button
            className="btn btn-link text-decoration-none p-0 me-3"
            onClick={handleBackToList}
            style={{ color: '#000', fontSize: '1rem' }}
          >
            ← Kembali ke Daftar Evaluasi
          </button>
          <h2 className="mb-0">
            Detail Evaluasi: {viewingEvaluation ? viewingEvaluation.title : ""}
          </h2>
        </div>

          <div className="row">
            <div className="col-12 mb-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Daftar Siswa</h5>
                </div>
                <div className="card-body">
                {studentsArray && studentsArray.length > 0 ? (
                    <div className="list-group">
                    {studentsArray.map((student) => (
                      <div 
                        key={`detail-${student.student_evaluation_id || student.id || student.student_id}`} 
                        className="list-group-item d-flex justify-content-between align-items-center"
                      >
                          <div className="ms-2 me-auto">
                            <div className="fw-bold">{student.name || student.student_name}</div>
                          <small className="text-muted">
                            {student.description ? `"${student.description}"` : "Belum ada deskripsi"}
                          </small>
                          <br />
                          <small className="text-muted">NISN: {student.nisn || "N/A"}</small>
                          </div>
                          <button
                            className="btn btn-primary"
                            onClick={() => {
                            handleEditStudentDescription(student, evaluationDetails?.id);
                            }}
                          >
                          PILIH
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="alert alert-info">
                      Belum ada data siswa
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
      </div>
    );
  };

  // Render student description edit view
  const renderStudentEdit = () => {
    // Show loading spinner if loading is true
    if (loading) {
    return (
      <div className="container py-4">
        <div className="d-flex align-items-center mb-4">
          <button
            className="btn btn-link text-decoration-none p-0 me-3"
            onClick={handleBackToDetails}
            style={{ color: '#000', fontSize: '1rem' }}
          >
            ← Kembali ke Detail Evaluasi
          </button>
          <h2 className="mb-0">Edit Deskripsi Siswa</h2>
        </div>

          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      );
    }
    
    if (!editingStudent) return null;

    console.log('Rendering student edit view:', {
      student: editingStudent.name || editingStudent.student_name,
      studentId: editingStudent.id || editingStudent.student_id,
      studentEvalId: editingStudent.student_evaluation_id,
      currentDescription: editDescription
    });

    return (
      <div className="container py-4">
        <div className="d-flex align-items-center mb-4">
          <button
            className="btn btn-link text-decoration-none p-0 me-3"
            onClick={handleBackToDetails}
            style={{ color: '#000', fontSize: '1rem' }}
          >
            ← Kembali ke Detail Evaluasi
          </button>
          <h2 className="mb-0">Edit Deskripsi Siswa</h2>
        </div>

          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                {editingStudent.name || editingStudent.student_name}
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <label className="form-label">Deskripsi Evaluasi</label>
                <textarea
                  className="form-control"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows="6"
                  placeholder="Masukkan deskripsi evaluasi untuk siswa ini"
                ></textarea>
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                  // If evaluationDetails is an array, we need to use viewingEvaluation.id
                  const evalId = Array.isArray(evaluationDetails)
                    ? viewingEvaluation?.id
                    : evaluationDetails?.id || viewingEvaluation?.id;
                  
                    const studentId = editingStudent?.id || editingStudent?.student_id;
                  
                  console.log('Saving student description:', {
                    student: editingStudent.name || editingStudent.student_name,
                    studentId: studentId,
                    studentEvalId: editingStudent.student_evaluation_id,
                    evaluationId: evalId,
                    description: editDescription
                  });
                  
                    handleSaveStudentDescription(evalId, studentId);
                  }}
                >
                  Simpan Deskripsi
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleBackToDetails}
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
      </div>
    );
  };

  // Main render logic based on current view
  if (isWaliKelas) {
    // For wali_kelas, use page-based navigation
    switch (currentView) {
      case 'semesters':
        return (
          <div className="container py-4">
            {renderSemesterList()}
          </div>
        );
      case 'details':
        return renderEvaluationDetails();
      case 'student':
        return renderStudentEdit();
      case 'list':
      default:
        return (
          <div className="container py-4">
            {renderEvaluationList()}
          </div>
        );
    }
  } else {
    // For other roles, keep using the original modal-based approach with semester selection
    switch (currentView) {
      case 'semesters':
        return (
          <div className="container py-4">
            {renderSemesterList()}
          </div>
        );
      case 'list':
      default:
    return (
      <div className="container py-4">
        {renderEvaluationList()}

        {/* Evaluation Details Modal */}
        {viewingEvaluation && evaluationDetails && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Detail Evaluasi</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setViewingEvaluation(null);
                      setEvaluationDetails(null);
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  {evaluationDetails.class_id && (
                    <div className="mb-3">
                      <label className="fw-bold">Kelas:</label>
                      <p>{evaluationDetails.class_id}</p>
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="fw-bold">Dibuat:</label>
                    <p>{new Date(evaluationDetails.createdAt).toLocaleString('id-ID')}</p>
                  </div>
                  <div className="mb-3">
                    <label className="fw-bold">Diperbarui:</label>
                    <p>{new Date(evaluationDetails.updatedAt).toLocaleString('id-ID')}</p>
                  </div>

                  {/* Students section */}
                  {evaluationDetails.students && Array.isArray(evaluationDetails.students) && evaluationDetails.students.length > 0 && (
                    <div className="mb-3">
                      {editingStudent ? (
                        <div className="card">
                          <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Edit Deskripsi Siswa</h5>
                            <button
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => setEditingStudent(null)}
                            >
                              Kembali ke Daftar Siswa
                            </button>
                          </div>
                          <div className="card-body">
                            <div className="mb-3">
                              <label className="form-label">Nama Siswa</label>
                              <input
                                type="text"
                                className="form-control"
                                value={editingStudent.name || editingStudent.student_name}
                                disabled
                              />
                            </div>
                            <div className="mb-3">
                              <label className="form-label">Deskripsi</label>
                              <textarea
                                className="form-control"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                rows="4"
                                placeholder="Masukkan deskripsi evaluasi untuk siswa ini"
                              />
                            </div>
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-primary"
                                onClick={() => {
                                  const evalId = evaluationDetails?.id;
                                  const studentId = editingStudent?.id || editingStudent?.student_id;
                                  console.log('Saving with evalId:', evalId, 'studentId:', studentId);
                                  handleSaveStudentDescription(evalId, studentId);
                                }}
                              >
                                Simpan Deskripsi
                              </button>
                              <button
                                className="btn btn-secondary"
                                onClick={() => setEditingStudent(null)}
                              >
                                Batal
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="list-group">
                          {evaluationDetails.students.map((student) => (
                            <div key={`detail-${student.id || student.student_id}`} className="list-group-item d-flex justify-content-between align-items-center">
                              <div className="ms-2 me-auto">
                                <div className="fw-bold">{student.name || student.student_name}</div>
                              </div>
                              <button
                                className="btn btn-primary"
                                onClick={() => {
                                  handleEditStudentDescription(student, evaluationDetails?.id);
                                }}
                              >
                                PILIH
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
    }
  }
};

export default EvaluationNotes;
