import React, { useState, useEffect } from 'react';
import { parentsAPI, semesterAPI } from '../utils/api';
import { useSemester } from '../contexts/SemesterContext';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import id from 'date-fns/locale/id';

// Debug mode to show raw data structure
const DEBUG_MODE = false;

const ParentGrades = () => {
  const [gradesData, setGradesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentView, setCurrentView] = useState('semesters'); // 'semesters', 'subjects', 'categories', 'details'
  const { activeSemester } = useSemester();
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);

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
    setCurrentView('subjects');
    fetchGradesData(semester.id);
  };

  const fetchGradesData = async (semesterId) => {
    try {
      setLoading(true);
      const data = await parentsAPI.getGrades(semesterId);
      console.log('Parent grades data:', data);

      // Add detailed structure logging
      if (Array.isArray(data)) {
        if (data.length > 0) {
          console.log('First item structure:', JSON.stringify(data[0], null, 2));
        } else {
          console.log('API returned an empty array');
        }
      } else {
        console.log('API returned a non-array:', typeof data);
      }

      // Transform the data to match our expected structure if needed
      let transformedData = data;

      // If the data doesn't have the expected format, try to extract what we need
      if (Array.isArray(data) && data.length > 0 && data[0].id && data[0].name) {
        // This is likely a different structure than expected, let's transform it
        transformedData = data.map(subject => ({
          subject_id: subject.id,
          subject_name: subject.name,
          // Include any other fields we might need
        }));
      }

      setGradesData(Array.isArray(transformedData) ? transformedData : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching grades data:', err);
      setError('Failed to load grades data');
      toast.error('Gagal memuat data nilai');
    } finally {
      setLoading(false);
    }
  };

  // Group grades by subject
  const getSubjects = () => {
    const subjects = {};
    gradesData.forEach(grade => {
      if (grade && grade.subject_id) {
        if (!subjects[grade.subject_id]) {
          subjects[grade.subject_id] = {
            id: grade.subject_id,
            name: grade.subject_name || 'Undefined Subject',
            grades: []
          };
        }
        subjects[grade.subject_id].grades.push(grade);
      }
    });
    return Object.values(subjects);
  };

  // Updated to fetch categories from API
  const fetchCategories = async (subjectId) => {
    try {
      setLoading(true);
      
      // Use the correct endpoint to fetch categories for a specific subject
      const categories = await parentsAPI.getSubjectCategories(selectedSemester.id, subjectId);
      console.log('Categories for subject:', categories);

      return Array.isArray(categories) ? categories : [];
    } catch (err) {
      console.error(`Error fetching categories for subject ${subjectId}:`, err);
      toast.error('Gagal memuat kategori nilai');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get categories for a selected subject (now using API data)
  const getCategories = () => {
    if (!selectedSubject || !selectedSubject.categories) return [];

    return selectedSubject.categories;
  };

  // Handle subject selection with API call
  const handleSelectSubject = async (subject) => {
    try {
      setLoading(true);
      const categories = await fetchCategories(subject.id);

      // Update the subject with categories
      setSelectedSubject({
        ...subject,
        categories: categories.map(category => ({
          id: category.id || category.category_id,
          name: category.name || category.category_name || 'Unnamed Category',
          details: Array.isArray(category.details) ? category.details : []
        }))
      });

      setSelectedCategory(null);
      setCurrentView('categories');
    } catch (err) {
      console.error('Error in handleSelectSubject:', err);
      toast.error('Gagal memuat data penilaian');
    } finally {
      setLoading(false);
    }
  };

  // Updated to fetch category details from API
  const fetchCategoryDetails = async (categoryId) => {
    try {
      setLoading(true);
      
      console.log(`Fetching details for category ${categoryId}`);
      
      // Use the direct endpoint to get category scores
      const data = await parentsAPI.getCategoryScores(categoryId);
      console.log('Category scores data:', data);

      // If the API doesn't return the expected format, try to extract what we need
      if (!Array.isArray(data)) {
        console.log('API returned non-array data for category details, trying to extract details');
        // Check if the response has a 'details' property that contains the array
        if (data && Array.isArray(data.details)) {
          return data.details;
        }
        // If not, try other possible structures
        return [];
      }

      return data;
    } catch (err) {
      console.error(`Error fetching category details for category ${categoryId}:`, err);
      toast.error('Gagal memuat detail kategori nilai');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Handle category selection with API call
  const handleSelectCategory = async (category) => {
    try {
      setLoading(true);
      console.log('Selected category:', category);
      
      const details = await fetchCategoryDetails(category.id);
      console.log('Raw category details with scores:', details);

      // Safer data extraction with more detailed logging
      let processedDetails = [];
      
      if (Array.isArray(details)) {
        processedDetails = details.map(detail => {
          // Log each detail to see exactly what we're working with
          console.log('Processing detail:', detail);
          
          // Extract data with fallbacks for each property
          const detailObj = {
            id: detail.id || detail.detail_id || `detail-${Math.random()}`,
            name: detail.title || detail.name || detail.detail_name || detail.assessment_name || 'Unnamed Detail',
            date: detail.date || detail.detail_date || detail.assessment_date,
            score: detail.score !== undefined ? detail.score : null,
            studentName: detail.student_name || detail.studentName || '',
            studentId: detail.student_id || detail.studentId || '',
            day: detail.day || ''
          };
          
          console.log('Processed detail:', detailObj);
          return detailObj;
        });
      } else {
        console.warn('Details is not an array:', details);
      }

      // Update the category with processed details
      setSelectedCategory({
        ...category,
        details: processedDetails
      });
      
      setCurrentView('details');
    } catch (err) {
      console.error('Error in handleSelectCategory:', err);
      toast.error('Gagal memuat detail penilaian');
    } finally {
      setLoading(false);
    }
  };

  // Handle back button clicks with updated navigation flow
  const handleBack = () => {
    if (currentView === 'details') {
      setSelectedCategory(null);
      setCurrentView('categories');
    } else if (currentView === 'categories') {
      setSelectedSubject(null);
      setCurrentView('subjects');
    } else if (currentView === 'subjects') {
      setSelectedSemester(null);
      setGradesData([]);
      setCurrentView('semesters');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return format(date, 'EEEE, dd MMMM yyyy', { locale: id });
    } catch (error) {
      return dateString || '-';
    }
  };

  // Determine grade status and color
  const getScoreStatusAndColor = (score) => {
    if (score === null || score === undefined) return { status: 'Belum ada nilai', color: 'text-muted' };

    if (score >= 90) return { status: 'Sangat Baik', color: 'text-success' };
    if (score >= 75) return { status: 'Baik', color: 'text-primary' };
    if (score >= 60) return { status: 'Cukup', color: 'text-warning' };
    return { status: 'Perlu Perbaikan', color: 'text-danger' };
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

  if (loading && currentView === 'semesters') {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <i className="bi bi-exclamation-triangle me-2"></i>
        {error}
        {DEBUG_MODE && (
          <div className="mt-3">
            <h6>Debugging Info:</h6>
            <pre className="bg-light p-2 mt-2 rounded" style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
              {JSON.stringify(gradesData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  // Main component view based on the current state
  switch (currentView) {
    case 'semesters':
      return (
        <div className="container py-4">
          {renderSemesterList()}
        </div>
      );
    case 'subjects':
      if (!gradesData || gradesData.length === 0) {
        return (
          <div className="container py-4">
            <div className="d-flex align-items-center mb-4">
              <button
                className="btn btn-link text-decoration-none p-0 me-3"
                onClick={handleBack}
                style={{ color: '#000', fontSize: '1rem' }}
              >
                ← Kembali ke Daftar Semester
              </button>
              <h2 className="mb-0">Nilai Akademik - {selectedSemester?.name}</h2>
            </div>
            <div className="alert alert-info" role="alert">
              <i className="bi bi-info-circle me-2"></i>
              Belum ada data nilai yang tersedia.
            </div>
          </div>
        );
      }

      return (
        <div className="container py-4">
          <div className="d-flex align-items-center mb-4">
            <button
              className="btn btn-link text-decoration-none p-0 me-3"
              onClick={handleBack}
              style={{ color: '#000', fontSize: '1rem' }}
            >
              ← Kembali ke Daftar Semester
            </button>
            <h2 className="mb-0">Nilai Akademik - {selectedSemester?.name}</h2>
          </div>

          {loading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="row">
              {getSubjects().map((subject) => (
                <div key={subject.id} className="col-md-6 col-xl-4 mb-4">
                  <div className="card h-100 shadow-sm">
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title">{subject.name}</h5>
                      <div className="mt-auto text-end">
                        <button
                          className="btn btn-primary"
                          onClick={() => handleSelectSubject(subject)}
                        >
                          Lihat Kategori
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );

    case 'categories':
      // Subject detail view with categories
      if (selectedSubject) {
        const categories = getCategories();

        return (
          <div className="container-fluid py-4">
            <div className="d-flex align-items-center mb-4">
              <button
                className="btn btn-link text-decoration-none p-0 me-3"
                onClick={handleBack}
                style={{ color: '#000', fontSize: '1rem' }}
              >
                ← Kembali ke Mata Pelajaran
              </button>
              <h2 className="mb-0">{selectedSubject?.name || 'Subject Details'}</h2>
            </div>

            {loading ? (
              <div className="d-flex justify-content-center align-items-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : categories.length > 0 ? (
              categories.map((category) => (
                <div
                  key={category.id || `category-${Math.random()}`}
                  className="card mb-3 border rounded-3"
                >
                  <div className="card-body d-flex justify-content-between align-items-center p-3">
                    <div>
                      <h5 className="mb-1">{category.name}</h5>
                    </div>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleSelectCategory(category)}
                    >
                      Lihat Detail
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="alert alert-info">
                Belum ada kategori penilaian untuk mata pelajaran ini.
              </div>
            )}
          </div>
        );
      }
      return null;

    case 'details':
      // Category detail list view
      if (selectedCategory) {
        const categoryDetails = selectedCategory.details || [];

        return (
          <div className="container-fluid py-4">
            <div className="d-flex align-items-center mb-4">
              <button
                className="btn btn-link text-decoration-none p-0 me-3"
                onClick={handleBack}
                style={{ color: '#000', fontSize: '1rem' }}
              >
                ← Kembali ke Kategori
              </button>
              <h2 className="mb-0">Penilaian Akademik</h2>
            </div>

            <div className="card">
              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                <h5 className="mb-0">{selectedSubject?.name} - {selectedCategory.name}</h5>
              </div>
              <div className="card-body p-0">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : categoryDetails.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th scope="col" style={{ width: '50px' }}>No</th>
                          <th scope="col">Hari/Tanggal Quiz</th>
                          <th scope="col">Keterangan</th>
                          <th scope="col" className="text-center" style={{ width: '120px' }}>Penilaian</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryDetails.map((detail, index) => (
                          <tr key={detail.id || `detail-${index}`}>
                            <td>{index + 1}</td>
                            <td>{formatDate(detail.date)}</td>
                            <td>{detail.name}</td>
                            <td className="text-center">
                              {detail.score !== null && detail.score !== undefined ? (
                                <span
                                  className="badge bg-primary py-2 px-3"
                                  style={{
                                    borderRadius: '4px',
                                    fontSize: '1rem'
                                  }}
                                >
                                  {detail.score}
                                </span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="alert alert-info m-3">
                    Belum ada detail penilaian untuk kategori ini.
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }
      return null;
      
    default:
      return null;
  }
};

export default ParentGrades;
