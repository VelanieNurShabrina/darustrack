import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import subjectsAPI from '../api/subjectsAPI';

function SubjectManagement() {
  const [subjects, setSubjects] = useState([]);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [learningOutcomes, setLearningOutcomes] = useState([]);
  const [newOutcome, setNewOutcome] = useState('');
  const [loadingOutcomes, setLoadingOutcomes] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await subjectsAPI.getSubjects();
      setSubjects(response.data || []);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      toast.error('Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  const fetchLearningOutcomes = async (subjectId) => {
    try {
      setLoadingOutcomes(true);
      const response = await subjectsAPI.getLearningOutcomes(subjectId);
      setLearningOutcomes(response.data || []);
    } catch (err) {
      console.error('Error fetching learning outcomes:', err);
      toast.error('Failed to fetch learning outcomes');
    } finally {
      setLoadingOutcomes(false);
    }
  };

  const handleAddOutcome = async (subjectId) => {
    if (!newOutcome.trim()) return;

    try {
      const response = await subjectsAPI.addLearningOutcome(subjectId, {
        description: newOutcome.trim()
      });

      setLearningOutcomes(prev => [...prev, response]);
      setNewOutcome('');
      toast.success('Learning outcome added successfully');
    } catch (err) {
      console.error('Error adding learning outcome:', err);
      toast.error('Failed to add learning outcome');
    }
  };

  const handleExpandDetail = async (subjectId) => {
    if (expandedSubject === subjectId) {
      setExpandedSubject(null);
    } else {
      setExpandedSubject(subjectId);
      await fetchLearningOutcomes(subjectId);
    }
  };

  return (
    <div>
      <h1>Subject Management</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul>
          {subjects.map((subject) => (
            <li key={subject.id}>
              <div onClick={() => handleExpandDetail(subject.id)}>
                {subject.name}
              </div>
              {expandedSubject === subject.id && (
                <div className="mt-4">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h5 className="card-title">Informasi Detail</h5>
                      <p>{subject.description}</p>

                      <div className="mt-4">
                        <h6 className="mb-3"><strong>Capaian Pembelajaran:</strong></h6>

                        {userRole === 'admin' && (
                          <div className="mb-3">
                            <div className="input-group">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Tambah capaian pembelajaran baru..."
                                value={newOutcome}
                                onChange={(e) => setNewOutcome(e.target.value)}
                              />
                              <button
                                className="btn btn-primary"
                                onClick={() => handleAddOutcome(subject.id)}
                                disabled={!newOutcome.trim() || loadingOutcomes}
                              >
                                <i className="bi bi-plus-lg"></i> Tambah
                              </button>
                            </div>
                          </div>
                        )}

                        {loadingOutcomes ? (
                          <div className="text-center py-3">
                            <div className="spinner-border spinner-border-sm" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          </div>
                        ) : learningOutcomes.length === 0 ? (
                          <p className="text-muted mb-0">Belum ada capaian pembelajaran yang ditambahkan.</p>
                        ) : (
                          <ul className="list-group">
                            {learningOutcomes.map((outcome, index) => (
                              <li key={outcome.id || index} className="list-group-item">
                                {index + 1}. {outcome.description}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SubjectManagement;
