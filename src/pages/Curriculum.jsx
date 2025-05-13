import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { curriculumsAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

const Curriculum = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [curriculumData, setCurriculumData] = useState({
    name: '',
    description: '',  // Changed from curriculum to description to match API
    createdAt: null,
    updatedAt: null
  });

  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    fetchCurriculum();
  }, []);

  const fetchCurriculum = async () => {
    try {
      setLoading(true);
      console.log('Attempting to fetch curriculum...');
      
      try {
        // Try to get existing curriculum
      const response = await curriculumsAPI.getAll();
      console.log('Raw API Response:', response);

        if (!response) {
          console.log('Empty response received, attempting to create default curriculum...');
          await createDefaultCurriculum();
          return;
        }

        // Handle potentially different response formats
        if (Array.isArray(response) && response.length > 0) {
          // If response is an array, use the first item
          const curriculum = response[0];
          console.log('Using first curriculum from array:', curriculum);
          setCurriculumData(prevData => ({
            ...prevData,
            id: curriculum.id || 0,
            name: curriculum.name || '',
            description: curriculum.description || ''
          }));
        } else if (response && typeof response === 'object' && (response.name || response.description)) {
          // If response is a single object with curriculum data
          console.log('Using single curriculum object:', response);
        setCurriculumData(prevData => ({
          ...prevData,
            id: response.id || 0,
            name: response.name || '',
            description: response.description || ''
        }));
      } else {
          // No valid curriculum found, try to create a default one
          console.log('No valid curriculum found in response, attempting to create a default one...');
          await createDefaultCurriculum();
        }
      } catch (fetchError) {
        console.error('Error fetching curriculum:', fetchError);
        console.log('Error message:', fetchError.message);
        
        if (fetchError.message.includes('not found') || fetchError.message.includes('404')) {
          console.log('Curriculum not found, attempting to create a default one...');
        } else {
          console.log('Unknown error, attempting to create a default curriculum anyway...');
        }
        
        await createDefaultCurriculum();
      }
    } catch (err) {
      console.error('Error in curriculum handling:', err);
      toast.error('Failed to load curriculum');
      // Initialize with empty data on error
      setCurriculumData({
        id: 0,
        name: 'Default Curriculum',
        description: '<p>Default curriculum description.</p>'
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultCurriculum = async () => {
    try {
      const defaultCurriculum = {
        name: 'Default Curriculum',
        description: '<p>Default curriculum description.</p>'
      };
      
      console.log('Creating default curriculum:', defaultCurriculum);
      
      // Try to create a default curriculum
      const response = await curriculumsAPI.create(defaultCurriculum);
      
      console.log('Create curriculum response:', response);
      
      if (response) {
        console.log('Default curriculum created successfully with ID:', response.id || 0);
        setCurriculumData({
          id: response.id || 0,
          name: response.name || defaultCurriculum.name,
          description: response.description || defaultCurriculum.description
        });
        toast.success('Default curriculum created');
      } else {
        console.warn('Empty response when creating default curriculum, using default values');
        // If response is empty, use the default data
        setCurriculumData({
          id: 0,
          name: defaultCurriculum.name,
          description: defaultCurriculum.description
        });
      }
      
      // Try to immediately fetch the curriculum to ensure we have the latest data
      try {
        const fetchResponse = await curriculumsAPI.getAll();
        if (fetchResponse && 
           ((Array.isArray(fetchResponse) && fetchResponse.length > 0) || 
            (typeof fetchResponse === 'object' && (fetchResponse.name || fetchResponse.description)))) {
          console.log('Successfully fetched curriculum after creation');
        }
      } catch (fetchError) {
        console.warn('Unable to fetch curriculum after creation:', fetchError.message);
      }
    } catch (createError) {
      console.error('Error creating default curriculum:', createError);
      console.error('Error message:', createError.message);
      toast.error('Failed to create default curriculum');
      // Use the default data anyway
      setCurriculumData({
        id: 0,
        name: 'Default Curriculum',
        description: '<p>Default curriculum description.</p>'
      });
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const payload = {
        name: curriculumData.name,
        description: curriculumData.description
      };

      console.log('Saving curriculum with payload:', payload);
      
      // Use update with id=0 as required by the API
      const response = await curriculumsAPI.update(0, payload);

      console.log('Curriculum save response:', response);

      if (response) {
        setIsEditing(false);
        toast.success('Curriculum updated successfully');
        
        // Reload curriculum data to ensure we have the latest version
        await fetchCurriculum();
      }
    } catch (err) {
      console.error('Error saving curriculum:', err);
      toast.error('Failed to update curriculum');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-4">
            {!isEditing ? (
              <h4 className="fw-bold mb-0">{curriculumData.name}</h4>
            ) : (
              <input
                type="text"
                className="form-control"
                value={curriculumData.name}
                onChange={(e) => setCurriculumData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Masukkan nama kurikulum"
                required
              />
            )}

            {isAdmin && (
              <div>
                {!isEditing ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => setIsEditing(true)}
                  >
                    <i className="bi bi-pencil me-2"></i>Edit
                  </button>
                ) : (
                  <div className="btn-group">
                    <button
                      className="btn btn-success"
                      onClick={handleSave}
                      disabled={!curriculumData.name}
                    >
                      <i className="bi bi-check-lg me-2"></i>Simpan
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setIsEditing(false);
                        fetchCurriculum(); // Reset to original data
                      }}
                    >
                      <i className="bi bi-x-lg me-2"></i>Batal
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {!isEditing ? (
            <div dangerouslySetInnerHTML={{ __html: curriculumData.description || '<p>No description available.</p>' }} />
          ) : (
            <CKEditor
              editor={ClassicEditor}
              data={curriculumData.description}
              onChange={(event, editor) => {
                const data = editor.getData();
                setCurriculumData(prev => ({ ...prev, description: data }));
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Curriculum;
