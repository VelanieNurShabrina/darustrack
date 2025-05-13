import React, { useState, useEffect } from 'react';
import { parentsAPI, semesterAPI } from '../utils/api';
import { useSemester } from '../contexts/SemesterContext';
import { toast } from 'react-toastify';

const ParentEvaluations = () => {
  const [loading, setLoading] = useState(true);
  const [evaluations, setEvaluations] = useState([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [evaluationDetails, setEvaluationDetails] = useState(null);
  const [currentView, setCurrentView] = useState('semesters'); // 'semesters', 'list', or 'details'
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

  const fetchEvaluations = async (semesterId) => {
    try {
      setLoading(true);
      const response = await parentsAPI.getEvaluations(semesterId);
      console.log('Fetched parent evaluations:', response);
      setEvaluations(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('Error fetching evaluations:', err);
      toast.error('Gagal mengambil data evaluasi');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvaluationTitles = async (semesterId) => {
    try {
      setLoading(true);
      const response = await parentsAPI.getEvaluationTitles(semesterId);
      console.log('Fetched evaluation titles:', response);
      setEvaluations(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('Error fetching evaluation titles:', err);
      toast.error('Gagal mengambil data judul evaluasi');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSemester = (semester) => {
    setSelectedSemester(semester);
    setCurrentView('list');
    // Try to fetch titles first, fall back to regular evaluations if that fails
    fetchEvaluationTitles(semester.id).catch(() => fetchEvaluations(semester.id));
  };

  const handleViewDetails = async (evaluation) => {
    if (!selectedSemester) {
      toast.error('Semester tidak ditemukan');
      return;
    }

    try {
      setLoading(true);
      setSelectedEvaluation(evaluation);

      console.log('Evaluation data:', evaluation);

      // If description is directly in the evaluation object
      if (evaluation.description || evaluation.notes || evaluation.catatan) {
        setEvaluationDetails({
          title: evaluation.title,
          description: evaluation.description || evaluation.notes || evaluation.catatan
        });
      } else {
        // Try to fetch from the new direct endpoint first
        try {
          const detailResponse = await parentsAPI.getEvaluationDetail(selectedSemester.id, evaluation.id);
          console.log('Fetched evaluation detail from direct endpoint:', detailResponse);
          setEvaluationDetails(detailResponse);
        } catch (directErr) {
          console.log('Direct endpoint failed, falling back to legacy endpoint:', directErr);
          // Fall back to the legacy endpoint if the direct one fails
        const response = await parentsAPI.getEvaluationDetails(selectedSemester.id, evaluation.id);
          console.log('Fetched evaluation details from legacy endpoint:', response);
        setEvaluationDetails(response);
        }
      }

      setCurrentView('details');
    } catch (err) {
      console.error('Error handling evaluation details:', err);
      toast.error('Gagal mengambil detail evaluasi');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSemesters = () => {
    setCurrentView('semesters');
    setSelectedSemester(null);
    setEvaluations([]);
  };

  const handleBackToList = () => {
    setSelectedEvaluation(null);
    setEvaluationDetails(null);
    setCurrentView('list');
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
                    <p className="card-text text-muted mb-3">
                      {semester.description || 'Semester ' + semester.number}
                    </p>
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
              <h2 className="mb-0">Catatan Evaluasi Siswa - {selectedSemester?.name}</h2>
            </div>
          </div>
          <div className="col-auto">
            <button
              className="btn btn-outline-primary"
              onClick={() => fetchEvaluations(selectedSemester.id)}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Refresh
            </button>
          </div>
        </div>

        {/* Evaluations List */}
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : evaluations.length > 0 ? (
          <div className="row">
            {evaluations.map((evaluation) => (
              <div key={`eval-${evaluation.id}`} className="col-md-6 col-xl-4 mb-4">
                <div className="card h-100 shadow-sm">
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{evaluation.title}</h5>
                    <p className="card-text text-muted mb-3">
                    </p>
                    <div className="mt-auto text-end">
                      <button
                        className="btn btn-primary"
                        onClick={() => handleViewDetails(evaluation)}
                      >
                        Lihat Detail
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="alert alert-info">
            Belum ada evaluasi yang tersedia
          </div>
        )}
      </>
    );
  };

  // Render evaluation details view
  const renderEvaluationDetails = () => {
    if (!evaluationDetails) return null;

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
          <h2 className="mb-0">Detail Evaluasi</h2>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">{selectedEvaluation?.title || 'Catatan Evaluasi'}</h5>
            </div>
            <div className="card-body">
              {/* Description */}
              <div className="mb-4">
                <label className="fw-bold fs-5 mb-2">Deskripsi Evaluasi:</label>
                <div className="p-3 bg-light rounded">
                  {evaluationDetails.description ? (
                    <p className="mb-0">{evaluationDetails.description}</p>
                  ) : (
                    <p className="text-muted mb-0">Belum ada catatan evaluasi</p>
                  )}
                </div>
              </div>
              
              {/* Category if available */}
              {evaluationDetails.category && (
                <div className="mb-3">
                  <label className="fw-bold">Kategori:</label>
                  <p>{evaluationDetails.category}</p>
                </div>
              )}
              
              {/* Student-specific information if available */}
              {evaluationDetails.student_name && (
                <div className="mb-3">
                  <label className="fw-bold">Siswa:</label>
                  <p>{evaluationDetails.student_name}</p>
                </div>
              )}
              
              {/* Score if available */}
              {evaluationDetails.score !== undefined && (
                <div className="mb-3">
                  <label className="fw-bold">Nilai:</label>
                  <p>{evaluationDetails.score}</p>
                </div>
              )}
              
              {/* Notes if different from description */}
              {evaluationDetails.notes && evaluationDetails.notes !== evaluationDetails.description && (
                <div className="mb-3">
                  <label className="fw-bold">Catatan Tambahan:</label>
                  <p>{evaluationDetails.notes}</p>
                </div>
              )}
              
              {/* Metadata */}
              <div className="row mt-4">
                {evaluationDetails.created_at && (
                  <div className="col-md-6 mb-3">
                    <label className="fw-bold">Dibuat:</label>
                    <p>{new Date(evaluationDetails.created_at).toLocaleString('id-ID')}</p>
                  </div>
                )}
                
                {evaluationDetails.updated_at && (
                  <div className="col-md-6 mb-3">
                    <label className="fw-bold">Diperbarui:</label>
                    <p>{new Date(evaluationDetails.updated_at).toLocaleString('id-ID')}</p>
                  </div>
                )}
                
                {evaluationDetails.evaluation_date && (
                  <div className="col-md-6 mb-3">
                    <label className="fw-bold">Tanggal Evaluasi:</label>
                    <p>{new Date(evaluationDetails.evaluation_date).toLocaleDateString('id-ID')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Main render logic based on current view
  switch (currentView) {
    case 'semesters':
      return (
        <div className="container py-4">
          {renderSemesterList()}
        </div>
      );
    case 'details':
      return renderEvaluationDetails();
    case 'list':
    default:
      return (
        <div className="container py-4">
          {renderEvaluationList()}
        </div>
      );
  }
};

export default ParentEvaluations;
