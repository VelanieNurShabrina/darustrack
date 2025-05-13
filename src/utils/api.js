const API_BASE_URL = 'https://darustrack-backend-production.up.railway.app';

// Store for any pending requests during token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to get headers with auth token
const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Common fetch options
const getCommonOptions = () => ({
  credentials: 'include',
  mode: 'cors',
  headers: {
    'Access-Control-Allow-Credentials': 'true'
  }
});

// Helper function to handle API responses
const handleResponse = async (response) => {
  console.log(`[handleResponse] Processing response: ${response.url}, status: ${response.status}`);

  if (!response.ok) {
    console.error('API Error Response Status:', response.status, response.statusText);

    // Handle 401 Unauthorized errors (expired token)
    if (response.status === 401) {
      const originalRequest = response.url;

      // If we're already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            // Retry the request with new token
            return fetch(originalRequest, {
              ...getCommonOptions(),
              headers: getHeaders()
            }).then(handleResponse);
          })
          .catch(err => {
            throw err;
          });
      }

      isRefreshing = true;

      // Try to refresh the token
      try {
        // Check if we're not already on the refresh-token endpoint to avoid loops
        if (!originalRequest.includes('/auth/refresh-token')) {
          const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            ...getCommonOptions(),
            headers: getHeaders()
          }).then(res => {
            if (!res.ok) {
              throw new Error('Failed to refresh token');
            }
            return res.json();
          });

          if (refreshResponse && refreshResponse.accessToken) {
            localStorage.setItem('token', refreshResponse.accessToken);
            isRefreshing = false;
            processQueue(null, refreshResponse.accessToken);

            // Retry the original request that failed
            return fetch(originalRequest, {
              ...getCommonOptions(),
              headers: getHeaders()
            }).then(handleResponse);
          }
        } else {
          // If we're already trying to refresh the token and got 401, token is invalid
          // Use window.toast to avoid circular dependency
          if (window?.Toastify) {
            window.Toastify({
              text: 'Your session has expired. Please log in again.',
              duration: 3000,
              close: true,
              gravity: 'top',
              position: 'right',
              backgroundColor: 'linear-gradient(to right, #ff5f6d, #ffc371)',
              stopOnFocus: true
            }).showToast();
          }

          // Clear local storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');

          // Redirect to login after a short delay
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        }
      } catch (error) {
        // Display error notification via a custom event
        const event = new CustomEvent('auth:error', {
          detail: { message: 'Authentication failed. Please log in again.' }
        });
        window.dispatchEvent(event);

        isRefreshing = false;
        processQueue(error, null);

        // Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);

        throw error;
      }
    }

    let errorBody = 'Could not read error body';
    try {
      errorBody = await response.text();
      console.error('API Error Response Body:', errorBody);
      const errorJson = JSON.parse(errorBody);
      throw new Error(errorJson.message || errorBody || 'Something went wrong');
    } catch (e) {
      throw new Error(errorBody || 'Something went wrong');
    }
  }
  try {
    console.log(`[handleResponse] Parsing JSON response for: ${response.url}`);
    const jsonData = await response.json();

    // Log detailed information about classes data
    if (response.url.includes('/classes')) {
      console.log(`[handleResponse] Classes data:`, {
        url: response.url,
        dataType: Array.isArray(jsonData) ? 'array' : typeof jsonData,
        length: Array.isArray(jsonData) ? jsonData.length : 'not an array',
        data: jsonData
      });
    }

    return jsonData;
  } catch (e) {
    if (response.status === 204) {
      console.log(`[handleResponse] No content response (204) for: ${response.url}`);
      return null;
    }
    console.error(`[handleResponse] Failed to parse response for: ${response.url}`, e);
    throw new Error('Received invalid response format from server');
  }
};

// Auth API
export const authAPI = {
  login: (credentials) =>
    fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      ...getCommonOptions(),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(credentials)
    }).then(handleResponse),

  logout: () =>
    fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    }).then(handleResponse),

  register: (userData) =>
    fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    }).then(handleResponse),

  requestPasswordReset: (email) => {
    console.log(`[API] Sending password reset request for email: ${email}`);
    return fetch(`${API_BASE_URL}/auth/request-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    .then(response => {
      console.log(`[API] Password reset request response status: ${response.status}`);
      return handleResponse(response);
    })
    .then(data => {
      console.log('[API] Password reset request successful:', data);
      return data;
    })
    .catch(error => {
      console.error('[API] Password reset request failed:', error);
      throw error;
    });
  },

  resetPassword: (token, newPassword) =>
    fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password: newPassword })
    }).then(handleResponse),

  getProfile: () =>
    fetch(`${API_BASE_URL}/auth/profile`, {
      ...getCommonOptions(),
      headers: getHeaders()
    }).then(handleResponse),

  updateProfile: (profileData) =>
    fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      ...getCommonOptions(),
      headers: getHeaders(),
      body: JSON.stringify({
        password: profileData.password
      })
    }).then(handleResponse),

  changePassword: (passwordData) =>
    fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      ...getCommonOptions(),
      headers: getHeaders(),
      body: JSON.stringify(passwordData)
    }).then(handleResponse),

  refreshToken: () =>
    fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      ...getCommonOptions(),
      headers: getHeaders()
    }).then(handleResponse)
};

// Users API
export const usersAPI = {
  getAll: (role) => {
    const url = role
      ? `${API_BASE_URL}/users?role=${role}`
      : `${API_BASE_URL}/users`;

    return fetch(url, {
      ...getCommonOptions(),
      headers: getHeaders()
    }).then(handleResponse);
  },

  getById: (id) =>
    fetch(`${API_BASE_URL}/users/${id}`, {
      ...getCommonOptions(),
      headers: getHeaders()
    }).then(handleResponse),

  create: (userData) =>
    fetch(`${API_BASE_URL}/users`, {
      ...getCommonOptions(),
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    }).then(handleResponse),

  update: (id, userData) =>
    fetch(`${API_BASE_URL}/users/${id}`, {
      ...getCommonOptions(),
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    }).then(handleResponse),

  delete: (id) =>
    fetch(`${API_BASE_URL}/users/${id}`, {
      ...getCommonOptions(),
      method: 'DELETE',
      headers: getHeaders()
    }).then(handleResponse)
};

// Teachers API
export const teachersAPI = {
  getMyClass: () =>
    fetch(`${API_BASE_URL}/teachers/my-class`, {
      ...getCommonOptions(),
      headers: getHeaders()
    }).then(handleResponse),

  getAll: () =>
    fetch(`${API_BASE_URL}/teachers`, {
      credentials: 'include'
    }).then(handleResponse),

  getById: (id) =>
    fetch(`${API_BASE_URL}/teachers/${id}`, {
      credentials: 'include'
    }).then(handleResponse),

  create: (teacherData) =>
    fetch(`${API_BASE_URL}/teachers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(teacherData)
    }).then(handleResponse),

  update: (id, teacherData) =>
    fetch(`${API_BASE_URL}/teachers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(teacherData)
    }).then(handleResponse),

  delete: (id) =>
    fetch(`${API_BASE_URL}/teachers/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    }).then(handleResponse),

  // Attendance endpoints
  getAttendance: (date) =>
    fetch(`${API_BASE_URL}/teachers/attendances/${date}`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'include',
      headers: {
        ...getHeaders(),
        'Accept': 'application/json'
      }
    })
    .then(handleResponse)
    .catch(error => {
      console.error(`[API] Error fetching attendance for date ${date}:`, error);
      throw error;
    }),
    
  getAllAttendances: (date) => {
    console.log(`[API] getAllAttendances: Fetching for date ${date}`);
    return fetch(`${API_BASE_URL}/teachers/attendances?date=${date}`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'include',
      headers: {
        ...getHeaders(),
        'Accept': 'application/json'
      }
    })
    .then(response => {
      console.log(`[API] getAllAttendances: Response status: ${response.status}`);
      return handleResponse(response);
    })
    .catch(error => {
      console.error(`[API] Error fetching all attendances for date ${date}:`, error);
      throw error;
    });
  },

  saveAttendance: (date) =>
    fetch(`${API_BASE_URL}/teachers/attendances`, {
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
      headers: {
        ...getHeaders(),
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        date: date
      })
    })
    .then(handleResponse)
    .catch(error => {
      console.error(`[API] Error saving attendance for date ${date}:`, error);
      throw error;
    }),

  updateAttendance: (date, attendances) => {
    console.log(`[API] updateAttendance: Updating attendance for date ${date}`, {
      date: date,
      attendancesCount: attendances.length,
      firstAttendance: attendances.length > 0 ? attendances[0] : null,
      requestBody: { attendanceUpdates: attendances }
    });
    
    return fetch(`${API_BASE_URL}/teachers/attendances?date=${date}`, {
      method: 'PUT',
      mode: 'cors',
      credentials: 'include',
      headers: {
        ...getHeaders(),
        'Accept': 'application/json'
      },
      body: JSON.stringify({ attendanceUpdates: attendances })
    })
    .then(async response => {
      console.log(`[API] updateAttendance: Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Gagal memperbarui kehadiran';
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            errorMessage = errorData.message;
          }
          console.error(`[API] Error response from updateAttendance:`, errorData);
        } catch (e) {
          console.error(`[API] Failed to parse error response:`, errorText);
        }
        
        throw new Error(errorMessage);
      }
      return handleResponse(response);
    })
    .catch(error => {
      console.error(`[API] Error updating attendance for date ${date}:`, error);
      throw error;
    });
  },

  getAttendanceHistory: (studentId) =>
    fetch(`${API_BASE_URL}/teachers/attendances/history/${studentId}`, {
      headers: getHeaders(),
      credentials: 'include'
    }).then(handleResponse),

  // Schedule endpoints
  getSchedule: (day) =>
    fetch(`${API_BASE_URL}/teachers/schedules?day=${day}`, {
      ...getCommonOptions(),
      headers: getHeaders()
    }).then(handleResponse),

  // Evaluation endpoints
  getEvaluations: (semesterId) =>
    fetch(`${API_BASE_URL}/teachers/semesters/${semesterId}/evaluations`, {
      ...getCommonOptions(),
      headers: getHeaders()
    })
    .then(handleResponse)
    .catch(error => {
      console.error(`[API] Error fetching evaluations for semester ${semesterId}:`, error);
      throw error;
    }),

  createEvaluation: (semesterId, data) =>
    fetch(`${API_BASE_URL}/teachers/semesters/${semesterId}/evaluations`, {
      method: 'POST',
      ...getCommonOptions(),
      headers: getHeaders(),
      body: JSON.stringify(data)
    })
    .then(handleResponse)
    .catch(error => {
      console.error(`[API] Error creating evaluation for semester ${semesterId}:`, error);
      throw error;
    }),

  updateEvaluation: (semesterId, id, data) => {
    console.log(`[API] updateEvaluation: Updating evaluation ${id} for semester ${semesterId} with data:`, data);
    return fetch(`${API_BASE_URL}/teachers/evaluations/${id}`, {
      method: 'PUT',
      ...getCommonOptions(),
      headers: getHeaders(),
      body: JSON.stringify(data)
    })
    .then(response => {
      console.log(`[API] updateEvaluation: Response status:`, response.status);
      if (!response.ok) {
        console.log(`[API] updateEvaluation: Error response:`, response.statusText);
      }
      return handleResponse(response);
    })
    .then(data => {
      console.log(`[API] updateEvaluation: Success response:`, data);
      return data;
    })
    .catch(error => {
      console.error(`[API] Error updating evaluation ${id}:`, error);
      console.error(`[API] Error details:`, {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      throw error;
    });
  },

  deleteEvaluation: (semesterId, id) =>
    fetch(`${API_BASE_URL}/teachers/semesters/${semesterId}/evaluations/${id}`, {
      method: 'DELETE',
      ...getCommonOptions(),
      headers: getHeaders()
    })
    .then(handleResponse)
    .catch(error => {
      console.error(`[API] Error deleting evaluation ${id} for semester ${semesterId}:`, error);
      throw error;
    }),

  getStudentEvaluations: (semesterId, evaluationId) =>
    fetch(`${API_BASE_URL}/teachers/semesters/${semesterId}/evaluations/${evaluationId}/students`, {
      ...getCommonOptions(),
      headers: getHeaders()
    })
    .then(handleResponse)
    .catch(error => {
      console.error(`[API] Error fetching students for evaluation ${evaluationId}, semester ${semesterId}:`, error);
      throw error;
    }),

  getStudentEvaluation: (semesterId, evaluationId, studentId) => {
    console.log(`[API] getStudentEvaluation: Fetching student ${studentId} for evaluation ${evaluationId} in semester ${semesterId}`);
    return fetch(`${API_BASE_URL}/teachers/semesters/${semesterId}/evaluations/${evaluationId}/students/${studentId}`, {
      ...getCommonOptions(),
      headers: getHeaders()
    })
    .then(response => {
      console.log(`[API] getStudentEvaluation: Response status:`, response.status);
      if (!response.ok) {
        console.log(`[API] getStudentEvaluation: Error response:`, response.statusText);
      }
      return handleResponse(response);
    })
    .then(data => {
      console.log(`[API] getStudentEvaluation: Student evaluation data:`, data);
      return data;
    })
    .catch(error => {
      console.error(`[API] Error fetching student ${studentId} for evaluation ${evaluationId}:`, error);
      throw error;
    });
  },

  updateStudentEvaluation: (semesterId, evaluationId, studentId, data) =>
    fetch(`${API_BASE_URL}/teachers/semesters/${semesterId}/evaluations/${evaluationId}/students/${studentId}`, {
      method: 'PUT',
      ...getCommonOptions(),
      headers: getHeaders(),
      body: JSON.stringify(data)
    })
    .then(handleResponse)
    .catch(error => {
      console.error(`[API] Error updating student ${studentId} for evaluation ${evaluationId}:`, error);
      throw error;
    }),

  getEvaluationById: (semesterId, id) => {
    console.log(`[API] getEvaluationById: Fetching evaluation with id ${id} for semester ${semesterId}`);
    return fetch(`${API_BASE_URL}/teachers/semesters/${semesterId}/evaluations/${id}`, {
      ...getCommonOptions(),
      headers: getHeaders()
    })
    .then(response => {
      console.log(`[API] getEvaluationById: Response status for evaluation ${id}:`, response.status);
      if (!response.ok) {
        console.log(`[API] getEvaluationById: Error response for evaluation ${id}:`, response.statusText);
      }
      return handleResponse(response);
    })
    .then(data => {
      console.log(`[API] getEvaluationById: Successfully processed response for evaluation ${id}`);
      console.log(`[API] getEvaluationById: Response data type:`, typeof data);
      console.log(`[API] getEvaluationById: Response keys:`, data ? Object.keys(data) : 'null response');
      return data;
    })
    .catch(error => {
      console.error(`[API] Error getting evaluation ${id} for semester ${semesterId}:`, error);
      throw error;
    });
  },

  getGrades: () =>
    fetch(`${API_BASE_URL}/teachers/grades/subjects`, {
      ...getCommonOptions(),
      headers: getHeaders()
    }).then(handleResponse),

  getCategories: (subjectId, semesterId) =>
    fetch(`${API_BASE_URL}/teachers/grades/${subjectId}/${semesterId}/categories`, {
      ...getCommonOptions(),
      headers: getHeaders()
    }).then(handleResponse),

  createCategory: (subjectId, semesterId, categoryData) =>
    fetch(`${API_BASE_URL}/teachers/grades/${subjectId}/${semesterId}/categories`, {
      method: 'POST',
      ...getCommonOptions(),
      headers: getHeaders(),
      body: JSON.stringify(categoryData)
    }).then(handleResponse),

  updateCategory: (categoryId, categoryData) =>
    fetch(`${API_BASE_URL}/teachers/grades/categories/${categoryId}`, {
      method: 'PUT',
      ...getCommonOptions(),
      headers: getHeaders(),
      body: JSON.stringify(categoryData)
    }).then(handleResponse),

  deleteCategory: (categoryId) =>
    fetch(`${API_BASE_URL}/teachers/grades/categories/${categoryId}`, {
      method: 'DELETE',
      ...getCommonOptions(),
      headers: getHeaders()
    }).then(handleResponse),

  createCategoryDetails: (categoryId, detailsData) =>
    fetch(`${API_BASE_URL}/teachers/grades/categories/${categoryId}/details`, {
      method: 'POST',
      ...getCommonOptions(),
      headers: getHeaders(),
      body: JSON.stringify(detailsData)
    }).then(handleResponse),

  getCategoryDetails: (categoryId) =>
    fetch(`${API_BASE_URL}/teachers/grades/categories/${categoryId}/details`, {
      ...getCommonOptions(),
      headers: getHeaders()
    })
    .then(response => {
      console.log(`[API] getCategoryDetails: Response status for category ${categoryId}:`, response.status);
      return handleResponse(response);
    })
    .then(data => {
      console.log(`[API] getCategoryDetails: Received data for category ${categoryId}:`, data);
      return data;
    })
    .catch(error => {
      console.error(`[API] getCategoryDetails: Error fetching details for category ${categoryId}:`, error);
      throw error;
    }),

  updateCategoryDetail: (detailId, detailData) =>
    fetch(`${API_BASE_URL}/teachers/grades/details/${detailId}`, {
      method: 'PUT',
      ...getCommonOptions(),
      headers: getHeaders(),
      body: JSON.stringify(detailData)
    }).then(handleResponse),

  deleteCategoryDetail: (detailId) =>
    fetch(`${API_BASE_URL}/teachers/grades/details/${detailId}`, {
      method: 'DELETE',
      ...getCommonOptions(),
      headers: getHeaders()
    }).then(handleResponse),

  getDetailStudents: (detailId) => {
    console.log(`[API] getDetailStudents: Fetching students for detail ${detailId}`);
    return fetch(`${API_BASE_URL}/teachers/grades/details/${detailId}/students`, {
      ...getCommonOptions(),
      headers: getHeaders()
    })
    .then(response => {
      console.log(`[API] getDetailStudents: Response status for detail ${detailId}:`, response.status);
      return handleResponse(response);
    })
    .then(data => {
      console.log(`[API] getDetailStudents: Received data for detail ${detailId}:`, data);
      // Log structure of first item if available
      if (Array.isArray(data) && data.length > 0) {
        console.log(`[API] getDetailStudents: First item structure:`, {
          keys: Object.keys(data[0]),
          hasStudent: !!data[0].student,
          hasStudents: !!data[0].students,
          studentKeys: data[0].student ? Object.keys(data[0].student) : 
                       data[0].students ? Object.keys(data[0].students) : 
                       null
        });
      }
      return data;
    })
    .catch(error => {
      console.error(`[API] getDetailStudents: Error fetching students for detail ${detailId}:`, error);
      throw error;
    });
  },

  updateStudentScore: (studentGradeId, data) => {
    console.log(`[API] updateStudentScore: Updating score for student grade ${studentGradeId} with data:`, data);
    return fetch(`${API_BASE_URL}/teachers/grades/students/${studentGradeId}`, {
      ...getCommonOptions(),
      method: 'PATCH',
      headers: {
        ...getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    .then(response => {
      console.log(`[API] updateStudentScore: Response status for student grade ${studentGradeId}:`, response.status);
      return handleResponse(response);
    })
    .then(data => {
      console.log(`[API] updateStudentScore: Response data:`, data);
      return data;
    })
    .catch(error => {
      console.error(`[API] updateStudentScore: Error updating score for student grade ${studentGradeId}:`, error);
      throw error;
    });
  },

  // Additional direct evaluation endpoint
  getEvaluation: (id) =>
    fetch(`${API_BASE_URL}/teachers/evaluations/${id}`, {
      ...getCommonOptions(),
      headers: getHeaders()
    })
    .then(handleResponse)
    .catch(error => {
      console.error(`[API] Error getting evaluation with direct path ${id}:`, error);
      throw error;
    }),

  // Direct student evaluation update endpoint
  updateStudentEvaluationDirect: (studentEvaluationId, data) =>
    fetch(`${API_BASE_URL}/teachers/student-evaluations/${studentEvaluationId}`, {
      method: 'PUT',
      ...getCommonOptions(),
      headers: getHeaders(),
      body: JSON.stringify(data)
    })
    .then(handleResponse)
    .catch(error => {
      console.error(`[API] Error updating student evaluation directly ${studentEvaluationId}:`, error);
      throw error;
    }),

  // Get student evaluation directly
  getStudentEvaluationDirect: (studentEvaluationId) =>
    fetch(`${API_BASE_URL}/teachers/student-evaluations/${studentEvaluationId}`, {
      ...getCommonOptions(),
      headers: getHeaders()
    })
    .then(handleResponse)
    .catch(error => {
      console.error(`[API] Error getting student evaluation directly ${studentEvaluationId}:`, error);
      throw error;
    }),

  // Get evaluation via detail endpoint
  getEvaluationDetail: (id) =>
    fetch(`${API_BASE_URL}/teachers/evaluations/detail/${id}`, {
      ...getCommonOptions(),
      headers: getHeaders()
    })
    .then(handleResponse)
    .catch(error => {
      console.error(`[API] Error getting evaluation detail with id ${id}:`, error);
      throw error;
    }),

  // Delete evaluation directly
  deleteEvaluationDirect: (id) =>
    fetch(`${API_BASE_URL}/teachers/evaluations/${id}`, {
      method: 'DELETE',
      ...getCommonOptions(),
      headers: getHeaders()
    })
    .then(handleResponse)
    .catch(error => {
      console.error(`[API] Error deleting evaluation directly with id ${id}:`, error);
      throw error;
    }),
};

// Parents API
export const parentsAPI = {
  getAll: () =>
    fetch(`${API_BASE_URL}/parents`, {
      credentials: 'include'
    }).then(handleResponse),

  getById: (id) =>
    fetch(`${API_BASE_URL}/parents/${id}`, {
      credentials: 'include'
    }).then(handleResponse),

  create: (parentData) =>
    fetch(`${API_BASE_URL}/parents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(parentData)
    }).then(handleResponse),

  update: (id, parentData) =>
    fetch(`${API_BASE_URL}/parents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(parentData)
    }).then(handleResponse),

  delete: (id) =>
    fetch(`${API_BASE_URL}/parents/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    }).then(handleResponse),

  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      ...getCommonOptions(),
      headers: getHeaders()
    }).then(handleResponse);
    return response;
  },

  getStudentData: async () => {
    const response = await fetch(`${API_BASE_URL}/parents/student`, {
      ...getCommonOptions(),
      headers: getHeaders()
    }).then(handleResponse);
    return response;
  },

  getChildDetail: (childId) =>
    fetch(`${API_BASE_URL}/parents/children/${childId}`, {
      ...getCommonOptions(),
      headers: getHeaders()
    }).then(handleResponse),

  getAttendance: async (semesterId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/parents/attendances/${semesterId}`, {
        ...getCommonOptions(),
        headers: getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch attendance data');
      }

      return response.json();
    } catch (error) {
      console.error('Attendance API error:', error);
      throw error;
    }
  },

  getGrades: async (semesterId) => {
    const response = await fetch(`${API_BASE_URL}/parents/grades/${semesterId}/subjects`, {
      ...getCommonOptions(),
      headers: getHeaders()
    }).then(handleResponse);
    return response;
  },

  getSubjects: (semesterId) =>
    fetch(`${API_BASE_URL}/parents/grades/${semesterId}/subjects`, {
      ...getCommonOptions(),
      headers: getHeaders()
    }).then(handleResponse),

  getSubjectCategories: (semesterId, subjectId) =>
    fetch(`${API_BASE_URL}/parents/grades/${semesterId}/${subjectId}/categories`, {
      ...getCommonOptions(),
      headers: getHeaders()
    }).then(handleResponse),

  getCategoryScores: (categoryId) =>
    fetch(`${API_BASE_URL}/parents/grades/categories/${categoryId}/details`, {
      ...getCommonOptions(),
      headers: getHeaders()
    }).then(handleResponse),

  getCategoryDetails: (semesterId, subjectId, categoryId) =>
    fetch(`${API_BASE_URL}/parents/grades/${semesterId}/subjects/${subjectId}/categories/${categoryId}/details`, {
      ...getCommonOptions(),
      headers: getHeaders()
    }).then(handleResponse),

  getSchedule: async (day) => {
    try {
      const response = await fetch(`${API_BASE_URL}/parents/schedule?day=${day}`, {
        ...getCommonOptions(),
        headers: getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch schedule');
      }

      return response.json();
    } catch (error) {
      throw new Error(error.message || 'Network error while fetching schedule');
    }
  },

  getEvaluations: async (semesterId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/parents/evaluations/${semesterId}`, {
      ...getCommonOptions(),
      headers: getHeaders()
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      throw error;
    }
  },

  getEvaluationTitles: async (semesterId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/parents/evaluations/titles/${semesterId}`, {
        ...getCommonOptions(),
        headers: getHeaders()
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching evaluation titles:', error);
      throw error;
    }
  },

  getEvaluationDetail: async (semesterId, evaluationId) => {
    try {
      console.log(`Fetching evaluation detail for semester ${semesterId}, evaluation ${evaluationId}`);
      const response = await fetch(`${API_BASE_URL}/parents/evaluations/${semesterId}/${evaluationId}`, {
        ...getCommonOptions(),
        headers: getHeaders()
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching evaluation detail:', error);
      throw error;
    }
  },

  getEvaluationDetails: async (semesterId, evaluationId) => {
    const response = await fetch(`${API_BASE_URL}/parents/semesters/${semesterId}/evaluations/${evaluationId}`, {
      ...getCommonOptions(),
      headers: getHeaders()
    }).then(handleResponse);
    return response;
  }
};

// Students API
export const studentsAPI = {
  getAll: async () => {
    console.log('[API] studentsAPI.getAll: Fetching all students');
    try {
      const url = `${API_BASE_URL}/students`;
      const headers = getHeaders();
      console.log(`[API] studentsAPI.getAll: Request URL: ${url}`);
      console.log(`[API] studentsAPI.getAll: Request headers:`, headers);
      
      const response = await fetch(url, {
        ...getCommonOptions(),
        headers: headers
      });
      
      console.log(`[API] studentsAPI.getAll: Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`[API] studentsAPI.getAll: Error response: ${response.status} ${response.statusText}`);
      }
      
      const data = await handleResponse(response);
      console.log('[API] studentsAPI.getAll: Received data:', data);
      console.log('[API] studentsAPI.getAll: Data structure:', {
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 'not an array',
        sampleItem: Array.isArray(data) && data.length > 0 ? data[0] : 'no items',
        keys: Array.isArray(data) && data.length > 0 ? Object.keys(data[0]) : 'no keys',
        sampleFields: Array.isArray(data) && data.length > 0 ? {
          id: data[0].id,
          name: data[0].name,
          nisn: data[0].nisn,
          birth_date: data[0].birth_date,
          parent_id: data[0].parent_id
        } : 'no sample fields'
      });
      return data;
    } catch (error) {
      console.error('[API] studentsAPI.getAll: Exception:', error);
      throw error;
    }
  },
  
  getById: async (id) => {
    console.log(`[API] studentsAPI.getById: Fetching student with id: ${id}`);
    try {
      const response = await fetch(`${API_BASE_URL}/students/${id}`, {
        ...getCommonOptions(),
        headers: getHeaders()
      });
      
      console.log(`[API] studentsAPI.getById: Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`[API] studentsAPI.getById: Error response: ${response.status} ${response.statusText}`);
      }
      
      const data = await handleResponse(response);
      console.log('[API] studentsAPI.getById: Received data:', data);
      return data;
    } catch (error) {
      console.error(`[API] studentsAPI.getById: Exception for id ${id}:`, error);
      throw error;
    }
  },
  
  create: async (studentData) => {
    console.log('[API] studentsAPI.create: Creating new student with data:', studentData);
    try {
      const url = `${API_BASE_URL}/students`;
      const headers = getHeaders();
      const requestBody = JSON.stringify(studentData);
      
      console.log(`[API] studentsAPI.create: Request URL: ${url}`);
      console.log(`[API] studentsAPI.create: Request method: POST`);
      console.log(`[API] studentsAPI.create: Request headers:`, headers);
      console.log(`[API] studentsAPI.create: Request body:`, requestBody);
      
      const response = await fetch(url, {
        method: 'POST',
        ...getCommonOptions(),
        headers: headers,
        body: requestBody
      });
      
      console.log(`[API] studentsAPI.create: Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`[API] studentsAPI.create: Error response: ${response.status} ${response.statusText}`);
        const errorText = await response.text().catch(() => "Unable to get error details");
        console.error(`[API] studentsAPI.create: Error details:`, errorText);
      }
      
      const data = await handleResponse(response);
      console.log('[API] studentsAPI.create: Created successfully, received data:', data);
      console.log('[API] studentsAPI.create: Created student with ID:', data.id);
      return data;
    } catch (error) {
      console.error('[API] studentsAPI.create: Exception:', error);
      throw error;
    }
  },
  
  update: async (id, studentData) => {
    console.log(`[API] studentsAPI.update: Updating student with id: ${id}, data:`, studentData);
    try {
      const url = `${API_BASE_URL}/students/${id}`;
      const headers = getHeaders();
      const requestBody = JSON.stringify(studentData);
      
      console.log(`[API] studentsAPI.update: Request URL: ${url}`);
      console.log(`[API] studentsAPI.update: Request method: PUT`);
      console.log(`[API] studentsAPI.update: Request headers:`, headers);
      console.log(`[API] studentsAPI.update: Request body:`, requestBody);
      
      const response = await fetch(url, {
        method: 'PUT',
        ...getCommonOptions(),
        headers: headers,
        body: requestBody
      });
      
      console.log(`[API] studentsAPI.update: Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`[API] studentsAPI.update: Error response: ${response.status} ${response.statusText}`);
        const errorText = await response.text().catch(() => "Unable to get error details");
        console.error(`[API] studentsAPI.update: Error details:`, errorText);
      }
      
      const data = await handleResponse(response);
      console.log('[API] studentsAPI.update: Updated successfully, received data:', data);
      console.log('[API] studentsAPI.update: Updated student field changes:', 
        Object.keys(studentData).map(key => ({
          field: key,
          oldValue: 'Not available in response',
          newValue: studentData[key]
        }))
      );
      return data;
    } catch (error) {
      console.error(`[API] studentsAPI.update: Exception for id ${id}:`, error);
      throw error;
    }
  },
  
  delete: async (id) => {
    console.log(`[API] studentsAPI.delete: Deleting student with id: ${id}`);
    try {
      const response = await fetch(`${API_BASE_URL}/students/${id}`, {
        method: 'DELETE',
        ...getCommonOptions(),
        headers: getHeaders()
      });
      
      console.log(`[API] studentsAPI.delete: Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`[API] studentsAPI.delete: Error response: ${response.status} ${response.statusText}`);
        const errorText = await response.text().catch(() => "Unable to get error details");
        console.error(`[API] studentsAPI.delete: Error details:`, errorText);
      }
      
      const data = await handleResponse(response);
      console.log('[API] studentsAPI.delete: Deleted successfully');
      return data;
    } catch (error) {
      console.error(`[API] studentsAPI.delete: Exception for id ${id}:`, error);
      throw error;
    }
  },

  getSchedule: (day) =>
    fetch(`${API_BASE_URL}/students/schedule?day=${day}`, {
      ...getCommonOptions(),
      headers: getHeaders()
    }).then(handleResponse)
};

// Classes API
export const classesAPI = {
  getAll: async (filters = {}) => {
    console.log('[API] classesAPI.getAll called with filters:', filters);

    const queryParams = new URLSearchParams()
    if (filters.grade_level) {
      queryParams.append('grade_level', filters.grade_level)
      console.log(`[API] Added grade_level filter: ${filters.grade_level}`);
    }

    const url = `${API_BASE_URL}/classes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    console.log(`[API] Making request to URL: ${url}`);

    try {
      console.log('[API] Sending fetch request with headers:', getHeaders());
      const response = await fetch(url, {
        headers: getHeaders(),
        credentials: 'include'
      });

      console.log(`[API] Received response with status: ${response.status}`);

      if (!response.ok) {
        console.error(`[API] Error response: ${response.status} ${response.statusText}`);
        // Let handleResponse handle the error
      }

      const data = await handleResponse(response);
      console.log('[API] Parsed response data:', data);
      return data;
    } catch (error) {
      console.error('[API] Exception in classesAPI.getAll:', error);
      throw error;
    }
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/classes/${id}`, {
      headers: getHeaders(),
      credentials: 'include'
    }).then(handleResponse)
    return response
  },

  create: async (classData) => {
    const response = await fetch(`${API_BASE_URL}/classes`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(classData)
    }).then(handleResponse)
    return response
  },

  update: async (id, classData) => {
    const response = await fetch(`${API_BASE_URL}/classes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(classData)
    }).then(handleResponse)
    return response
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/classes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include'
    }).then(handleResponse)
    return response
  },

  // Add student to class
  addStudent: async (classId, studentData) => {
    const response = await fetch(`${API_BASE_URL}/classes/${classId}/students`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(studentData)
    }).then(handleResponse)
    return response
  },

  // Get students in a class
  getStudents: async (classId) => {
    const response = await fetch(`${API_BASE_URL}/classes/${classId}/students`, {
      headers: getHeaders(),
      credentials: 'include'
    }).then(handleResponse)
    return response
  },

  // Update student in class
  updateStudent: async (classId, studentId, studentData) => {
    const response = await fetch(`${API_BASE_URL}/classes/${classId}/students/${studentId}`, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(studentData)
    }).then(handleResponse)
    return response
  },

  // Delete student from class
  deleteStudent: async (classId, studentId) => {
    const response = await fetch(`${API_BASE_URL}/classes/${classId}/students/${studentId}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include'
    }).then(handleResponse)
    return response
  },

  // Get class schedule
  getSchedule: async (classId) => {
    const response = await fetch(`${API_BASE_URL}/classes/${classId}/schedule`, {
      headers: getHeaders(),
      credentials: 'include'
    }).then(handleResponse)
    return response
  },
  
  // Get class schedule for a specific day
  getScheduleByDay: async (classId, day, academicYearId = null) => {
    console.log(`[API] classesAPI.getScheduleByDay: Fetching schedule for class ${classId} on day ${day}${academicYearId ? `, academic year ${academicYearId}` : ''}`);
    try {
      // Build the query parameters
      const queryParams = new URLSearchParams();
      if (day) queryParams.append('day', day);
      if (academicYearId) queryParams.append('academic_year_id', academicYearId);
      
      const url = `${API_BASE_URL}/classes/${classId}/schedule${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log(`[API] classesAPI.getScheduleByDay: Request URL: ${url}`);
      
      const response = await fetch(url, {
        ...getCommonOptions(),
        headers: getHeaders()
      });
      
      console.log(`[API] classesAPI.getScheduleByDay: Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`[API] classesAPI.getScheduleByDay: Error response: ${response.status} ${response.statusText}`);
        
        // Try to parse and log the detailed error
        try {
          const errorText = await response.text();
          console.error(`[API] classesAPI.getScheduleByDay: Error details:`, errorText);
          
          // Check if it's the specific academic_year_id error
          if (errorText.includes("Unknown column 'class.academic_year_id'")) {
            console.warn(`[API] classesAPI.getScheduleByDay: Backend is expecting academic_year_id parameter`);
            // Could implement retry logic here if needed
          }
          
          throw new Error(`Failed to fetch schedule: ${errorText}`);
        } catch (parseError) {
          throw new Error(`Failed to fetch schedule: ${response.status} ${response.statusText}`);
        }
      }
      
      const data = await handleResponse(response);
      console.log(`[API] classesAPI.getScheduleByDay: Received data for class ${classId} on day ${day}:`, data);
      return data;
    } catch (error) {
      console.error(`[API] classesAPI.getScheduleByDay: Exception for class ${classId} on day ${day}:`, error);
      throw error;
    }
  },

  // Add schedule to class
  addSchedule: async (classId, scheduleData) => {
    console.log(`[API] classesAPI.addSchedule: Adding schedule to class ${classId}, data:`, scheduleData);
    try {
      const response = await fetch(`${API_BASE_URL}/classes/${classId}/schedule`, {
        method: 'POST',
        ...getCommonOptions(),
        headers: getHeaders(),
        body: JSON.stringify(scheduleData)
      });
      
      console.log(`[API] classesAPI.addSchedule: Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`[API] classesAPI.addSchedule: Error response: ${response.status} ${response.statusText}`);
        
        // Parse the error response
        const errorText = await response.text();
        console.error(`[API] classesAPI.addSchedule: Error details:`, errorText);
        
        let errorMessage = 'Failed to add schedule';
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData && errorData.message) {
            errorMessage = errorData.message;
            console.error(`[API] classesAPI.addSchedule: Parsed error message: ${errorMessage}`);
          }
        } catch (parseError) {
          console.error(`[API] classesAPI.addSchedule: Failed to parse error response:`, parseError);
        }
        
        throw new Error(errorMessage);
      }
      
      return await handleResponse(response);
    } catch (error) {
      console.error(`[API] classesAPI.addSchedule: Exception:`, error);
      throw error;
    }
  },

  // Update schedule in class
  updateSchedule: async (scheduleId, scheduleData) => {
    console.log(`[API] classesAPI.updateSchedule: Updating schedule ${scheduleId}, data:`, scheduleData);
    try {
      // Only include fields that are provided (optional fields)
      const requestBody = {};
      if (scheduleData.subject_id) requestBody.subject_id = scheduleData.subject_id;
      if (scheduleData.day) requestBody.day = scheduleData.day;
      if (scheduleData.start_time) requestBody.start_time = scheduleData.start_time;
      if (scheduleData.end_time) requestBody.end_time = scheduleData.end_time;

      const response = await fetch(`${API_BASE_URL}/classes/schedule/${scheduleId}`, {
        method: 'PUT',
        ...getCommonOptions(),
        headers: getHeaders(),
        body: JSON.stringify(requestBody)
      });
      
      console.log(`[API] classesAPI.updateSchedule: Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`[API] classesAPI.updateSchedule: Error response: ${response.status} ${response.statusText}`);
        
        // Parse the error response
        const errorText = await response.text();
        console.error(`[API] classesAPI.updateSchedule: Error details:`, errorText);
        
        let errorMessage = 'Failed to update schedule';
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData && errorData.message) {
            errorMessage = errorData.message;
            console.error(`[API] classesAPI.updateSchedule: Parsed error message: ${errorMessage}`);
          }
        } catch (parseError) {
          console.error(`[API] classesAPI.updateSchedule: Failed to parse error response:`, parseError);
        }
        
        throw new Error(errorMessage);
      }
      
      return await handleResponse(response);
    } catch (error) {
      console.error(`[API] classesAPI.updateSchedule: Exception:`, error);
      throw error;
    }
  },

  // Delete schedule from class
  deleteSchedule: async (classId, scheduleId) => {
    const response = await fetch(`${API_BASE_URL}/classes/schedule/${scheduleId}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include'
    }).then(handleResponse)
    return response
  }
};

// Curriculums API
export const curriculumsAPI = {
  getAll: () => {
    console.log('[API] Fetching all curriculums');
    return fetch(`${API_BASE_URL}/curriculums`, {
      ...getCommonOptions(),
      headers: getHeaders()
    })
    .then(response => {
      console.log(`[API] Get all curriculums response status: ${response.status}`);
      return handleResponse(response);
    })
    .then(data => {
      console.log('[API] Get all curriculums successful:', data);
      return data;
    })
    .catch(error => {
      console.error('[API] Get all curriculums failed:', error);
      throw error;
    });
  },

  getById: (id) => {
    console.log(`[API] Fetching curriculum by ID: ${id}`);
    return fetch(`${API_BASE_URL}/curriculums/${id}`, {
      ...getCommonOptions(),
      headers: getHeaders()
    })
    .then(response => {
      console.log(`[API] Get curriculum by ID response status: ${response.status}`);
      return handleResponse(response);
    })
    .then(data => {
      console.log('[API] Get curriculum by ID successful:', data);
      return data;
    })
    .catch(error => {
      console.error('[API] Get curriculum by ID failed:', error);
      throw error;
    });
  },

  create: (curriculumData) => {
    console.log('[API] Creating curriculum with data:', curriculumData);
    return fetch(`${API_BASE_URL}/curriculums`, {
      method: 'POST',
      ...getCommonOptions(),
      headers: getHeaders(),
      body: JSON.stringify(curriculumData)
    })
    .then(response => {
      console.log(`[API] Create curriculum response status: ${response.status}`);
      return handleResponse(response);
    })
    .then(data => {
      console.log('[API] Create curriculum successful:', data);
      return data;
    })
    .catch(error => {
      console.error('[API] Create curriculum failed:', error);
      throw error;
    });
  },

  update: (id, curriculumData) => {
    // Ensure request body follows API specification (name and description are optional)
    const requestBody = {};
    if (curriculumData.name !== undefined) requestBody.name = curriculumData.name;
    if (curriculumData.description !== undefined) requestBody.description = curriculumData.description;
    
    console.log(`[API] Updating curriculum with ID: ${id} (using fixed ID 0), data:`, requestBody);
    
    // Always use "/curriculums/0" for updates regardless of id
    return fetch(`${API_BASE_URL}/curriculums/1`, {
      method: 'PUT',
      ...getCommonOptions(),
      headers: getHeaders(),
      body: JSON.stringify(requestBody)
    })
    .then(response => {
      console.log(`[API] Update curriculum response status: ${response.status}`);
      if (response.status === 404) {
        console.warn('[API] Curriculum with ID 0 not found, may need to create it first');
      }
      return handleResponse(response);
    })
    .then(data => {
      console.log('[API] Update curriculum successful:', data);
      return data;
    })
    .catch(error => {
      console.error('[API] Update curriculum failed:', error);
      throw error;
    });
  },

  delete: (id) =>
    fetch(`${API_BASE_URL}/curriculums`, {
      method: 'DELETE',
      ...getCommonOptions(),
      headers: getHeaders()
    }).then(handleResponse)
};

// Subjects API
export const subjectsAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/subjects`, {
      headers: getHeaders(),
      credentials: 'include'
    }).then(handleResponse)
    return response
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/subjects/${id}`, {
      headers: getHeaders(),
      credentials: 'include'
    }).then(handleResponse)
    return response
  },

  create: async (subjectData) => {
    const response = await fetch(`${API_BASE_URL}/subjects`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(subjectData)
    }).then(handleResponse)
    return response
  },

  update: async (id, subjectData) => {
    const response = await fetch(`${API_BASE_URL}/subjects/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(subjectData)
    }).then(handleResponse)
    return response
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/subjects/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include'
    }).then(handleResponse)
    return response
  }
};

// Semester API
export const semesterAPI = {
  getAll: async () => {
    console.log('[API] semesterAPI.getAll: Fetching all semesters');
    try {
      const response = await fetch(`${API_BASE_URL}/semesters`, {
        ...getCommonOptions(),
        headers: getHeaders()
      });
      
      console.log(`[API] semesterAPI.getAll: Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`[API] semesterAPI.getAll: Error response: ${response.status} ${response.statusText}`);
      }
      
      const data = await handleResponse(response);
      console.log('[API] semesterAPI.getAll: Received data:', data);
      return data;
    } catch (error) {
      console.error('[API] semesterAPI.getAll: Exception:', error);
      throw error;
    }
  },
  
  getById: async (id) => {
    console.log(`[API] semesterAPI.getById: Fetching semester with id: ${id}`);
    try {
      const response = await fetch(`${API_BASE_URL}/semester/${id}`, {
        ...getCommonOptions(),
        headers: getHeaders()
      });
      
      console.log(`[API] semesterAPI.getById: Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`[API] semesterAPI.getById: Error response: ${response.status} ${response.statusText}`);
      }
      
      const data = await handleResponse(response);
      console.log(`[API] semesterAPI.getById: Received data for id ${id}:`, data);
      return data;
    } catch (error) {
      console.error(`[API] semesterAPI.getById: Exception for id ${id}:`, error);
      throw error;
    }
  },
  
  create: async (semesterData) => {
    console.log('[API] semesterAPI.create: Creating new semester with data:', semesterData);
    try {
      const response = await fetch(`${API_BASE_URL}/semester`, {
        method: 'POST',
        ...getCommonOptions(),
        headers: getHeaders(),
        body: JSON.stringify(semesterData)
      });
      
      console.log(`[API] semesterAPI.create: Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`[API] semesterAPI.create: Error response: ${response.status} ${response.statusText}`);
      }
      
      const data = await handleResponse(response);
      console.log('[API] semesterAPI.create: Created successfully, received data:', data);
      return data;
    } catch (error) {
      console.error('[API] semesterAPI.create: Exception:', error);
      throw error;
    }
  },
  
  update: async (id, semesterData) => {
    console.log(`[API] semesterAPI.update: Updating semester with id: ${id}, data:`, semesterData);
    try {
      const response = await fetch(`${API_BASE_URL}/semester/${id}`, {
        method: 'PUT',
        ...getCommonOptions(),
        headers: getHeaders(),
        body: JSON.stringify(semesterData)
      });
      
      console.log(`[API] semesterAPI.update: Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`[API] semesterAPI.update: Error response: ${response.status} ${response.statusText}`);
      }
      
      const data = await handleResponse(response);
      console.log(`[API] semesterAPI.update: Updated successfully for id ${id}, received data:`, data);
      return data;
    } catch (error) {
      console.error(`[API] semesterAPI.update: Exception for id ${id}:`, error);
      throw error;
    }
  },
  
  delete: async (id) => {
    console.log(`[API] semesterAPI.delete: Deleting semester with id: ${id}`);
    try {
      const response = await fetch(`${API_BASE_URL}/semester/${id}`, {
        method: 'DELETE',
        ...getCommonOptions(),
        headers: getHeaders()
      });
      
      console.log(`[API] semesterAPI.delete: Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`[API] semesterAPI.delete: Error response: ${response.status} ${response.statusText}`);
      }
      
      const data = await handleResponse(response);
      console.log(`[API] semesterAPI.delete: Deleted successfully for id ${id}`);
      return data;
    } catch (error) {
      console.error(`[API] semesterAPI.delete: Exception for id ${id}:`, error);
      throw error;
    }
  }
};

// Academic Calendar API
export const academicCalendarAPI = {
  getAll: () =>
    fetch(`${API_BASE_URL}/academic-calendar`, {
      ...getCommonOptions(),
      headers: getHeaders()
    }).then(handleResponse),

  getById: (id) =>
    fetch(`${API_BASE_URL}/academic-calendar/${id}`, {
      ...getCommonOptions(),
      headers: getHeaders()
    }).then(handleResponse),

  create: (eventData) =>
    fetch(`${API_BASE_URL}/academic-calendar`, {
      method: 'POST',
      ...getCommonOptions(),
      headers: getHeaders(),
      body: JSON.stringify(eventData)
    }).then(handleResponse),

  update: (id, eventData) =>
    fetch(`${API_BASE_URL}/academic-calendar/${id}`, {
      method: 'PUT',
      ...getCommonOptions(),
      headers: getHeaders(),
      body: JSON.stringify(eventData)
    }).then(handleResponse),

  delete: (id) =>
    fetch(`${API_BASE_URL}/academic-calendar/${id}`, {
      method: 'DELETE',
      ...getCommonOptions(),
      headers: getHeaders()
    }).then(handleResponse)
};

// Academic Years API
export const academicYearsAPI = {
  getAll: async () => {
    console.log('[API] academicYearsAPI.getAll: Fetching all academic years');
    try {
      const response = await fetch(`${API_BASE_URL}/academic-years`, {
        ...getCommonOptions(),
        headers: getHeaders()
      });
      
      console.log(`[API] academicYearsAPI.getAll: Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`[API] academicYearsAPI.getAll: Error response: ${response.status} ${response.statusText}`);
      }
      
      const data = await handleResponse(response);
      console.log('[API] academicYearsAPI.getAll: Received data:', data);
      return data;
    } catch (error) {
      console.error('[API] academicYearsAPI.getAll: Exception:', error);
      throw error;
    }
  },
  
  getById: async (id) => {
    console.log(`[API] academicYearsAPI.getById: Fetching academic year with id: ${id}`);
    try {
      const response = await fetch(`${API_BASE_URL}/academic-years/${id}`, {
        ...getCommonOptions(),
        headers: getHeaders()
      });
      
      console.log(`[API] academicYearsAPI.getById: Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`[API] academicYearsAPI.getById: Error response: ${response.status} ${response.statusText}`);
      }
      
      const data = await handleResponse(response);
      console.log(`[API] academicYearsAPI.getById: Received data for id ${id}:`, data);
      return data;
    } catch (error) {
      console.error(`[API] academicYearsAPI.getById: Exception for id ${id}:`, error);
      throw error;
    }
  },
  
  create: async (academicYearData) => {
    console.log('[API] academicYearsAPI.create: Creating new academic year with data:', academicYearData);
    try {
      const response = await fetch(`${API_BASE_URL}/academic-years`, {
        method: 'POST',
        ...getCommonOptions(),
        headers: getHeaders(),
        body: JSON.stringify(academicYearData)
      });
      
      console.log(`[API] academicYearsAPI.create: Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`[API] academicYearsAPI.create: Error response: ${response.status} ${response.statusText}`);
      }
      
      const data = await handleResponse(response);
      console.log('[API] academicYearsAPI.create: Created successfully, received data:', data);
      return data;
    } catch (error) {
      console.error('[API] academicYearsAPI.create: Exception:', error);
      throw error;
    }
  },
  
  update: async (id, academicYearData) => {
    console.log(`[API] academicYearsAPI.update: Updating academic year with id: ${id}, data:`, academicYearData);
    try {
      const response = await fetch(`${API_BASE_URL}/academic-years/${id}`, {
        method: 'PUT',
        ...getCommonOptions(),
        headers: getHeaders(),
        body: JSON.stringify(academicYearData)
      });
      
      console.log(`[API] academicYearsAPI.update: Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`[API] academicYearsAPI.update: Error response: ${response.status} ${response.statusText}`);
      }
      
      const data = await handleResponse(response);
      console.log(`[API] academicYearsAPI.update: Updated successfully for id ${id}, received data:`, data);
      return data;
    } catch (error) {
      console.error(`[API] academicYearsAPI.update: Exception for id ${id}:`, error);
      throw error;
    }
  },
  
  delete: async (id) => {
    console.log(`[API] academicYearsAPI.delete: Deleting academic year with id: ${id}`);
    try {
      const response = await fetch(`${API_BASE_URL}/academic-years/${id}`, {
        method: 'DELETE',
        ...getCommonOptions(),
        headers: getHeaders()
      });
      
      console.log(`[API] academicYearsAPI.delete: Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`[API] academicYearsAPI.delete: Error response: ${response.status} ${response.statusText}`);
      }
      
      const data = await handleResponse(response);
      console.log(`[API] academicYearsAPI.delete: Deleted successfully for id ${id}`);
      return data;
    } catch (error) {
      console.error(`[API] academicYearsAPI.delete: Exception for id ${id}:`, error);
      throw error;
    }
  },

  // Get classes for a specific academic year
  getClasses: async (academicYearId) => {
    console.log(`[API] academicYearsAPI.getClasses: Fetching classes for academic year with id: ${academicYearId}`);
    try {
      const response = await fetch(`${API_BASE_URL}/academic-years/${academicYearId}/classes`, {
        ...getCommonOptions(),
        headers: getHeaders()
      });
      
      console.log(`[API] academicYearsAPI.getClasses: Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`[API] academicYearsAPI.getClasses: Error response: ${response.status} ${response.statusText}`);
      }
      
      const data = await handleResponse(response);
      console.log(`[API] academicYearsAPI.getClasses: Raw response data:`, data);
      console.log(`[API] academicYearsAPI.getClasses: Response data structure:`, {
        hasClassesArray: data && typeof data === 'object' && Array.isArray(data.classes),
        topLevelKeys: data ? Object.keys(data) : [],
        dataType: typeof data
      });
      
      return data;
    } catch (error) {
      console.error(`[API] academicYearsAPI.getClasses: Exception for academic year id ${academicYearId}:`, error);
      throw error;
    }
  },
  
  // Add a class to a specific academic year
  addClass: async (academicYearId, classData) => {
    console.log(`[API] academicYearsAPI.addClass: Adding class to academic year with id: ${academicYearId}, data:`, classData);
    try {
      const response = await fetch(`${API_BASE_URL}/academic-years/${academicYearId}/classes`, {
        method: 'POST',
        ...getCommonOptions(),
        headers: getHeaders(),
        body: JSON.stringify(classData)
      });
      
      console.log(`[API] academicYearsAPI.addClass: Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`[API] academicYearsAPI.addClass: Error response: ${response.status} ${response.statusText}`);
        const errorText = await response.text().catch(() => "Unable to get error details");
        console.error(`[API] academicYearsAPI.addClass: Error details:`, errorText);
      }
      
      const data = await handleResponse(response);
      console.log(`[API] academicYearsAPI.addClass: Added class successfully, response data:`, data);
      return data;
    } catch (error) {
      console.error(`[API] academicYearsAPI.addClass: Exception for academic year id ${academicYearId}:`, error);
      throw error;
    }
  },
  
  // Update a class in an academic year
  updateClass: async (classId, classData) => {
    console.log(`[API] academicYearsAPI.updateClass: Updating class with id: ${classId}, data:`, classData);
    try {
      const response = await fetch(`${API_BASE_URL}/academic-years/classes/${classId}`, {
        method: 'PUT',
        ...getCommonOptions(),
        headers: getHeaders(),
        body: JSON.stringify(classData)
      });
      
      console.log(`[API] academicYearsAPI.updateClass: Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`[API] academicYearsAPI.updateClass: Error response: ${response.status} ${response.statusText}`);
        const errorText = await response.text().catch(() => "Unable to get error details");
        console.error(`[API] academicYearsAPI.updateClass: Error details:`, errorText);
      }
      
      const data = await handleResponse(response);
      console.log(`[API] academicYearsAPI.updateClass: Updated class successfully, response data:`, data);
      return data;
    } catch (error) {
      console.error(`[API] academicYearsAPI.updateClass: Exception for class id ${classId}:`, error);
      throw error;
    }
  },
  
  // Delete a class from an academic year
  deleteClass: async (classId) => {
    console.log(`[API] academicYearsAPI.deleteClass: Deleting class with id: ${classId}`);
    try {
      const response = await fetch(`${API_BASE_URL}/academic-years/classes/${classId}`, {
        method: 'DELETE',
        ...getCommonOptions(),
        headers: getHeaders()
      });
      
      console.log(`[API] academicYearsAPI.deleteClass: Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`[API] academicYearsAPI.deleteClass: Error response: ${response.status} ${response.statusText}`);
        const errorText = await response.text().catch(() => "Unable to get error details");
        console.error(`[API] academicYearsAPI.deleteClass: Error details:`, errorText);
      }
      
      const data = await handleResponse(response);
      console.log(`[API] academicYearsAPI.deleteClass: Deleted class successfully`);
      return data;
    } catch (error) {
      console.error(`[API] academicYearsAPI.deleteClass: Exception for class id ${classId}:`, error);
      throw error;
    }
  },
  
  // Get students in a class for a specific academic year
  getStudentsInClass: async (academicYearId, classId) => {
    console.log(`[API] academicYearsAPI.getStudentsInClass: Fetching students for class ${classId} in academic year ${academicYearId}`);
    try {
      const response = await fetch(`${API_BASE_URL}/academic-years/${academicYearId}/classes/${classId}/students`, {
        ...getCommonOptions(),
        headers: getHeaders()
      });
      
      console.log(`[API] academicYearsAPI.getStudentsInClass: Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`[API] academicYearsAPI.getStudentsInClass: Error response: ${response.status} ${response.statusText}`);
      }
      
      const data = await handleResponse(response);
      console.log(`[API] academicYearsAPI.getStudentsInClass: Received data:`, data);
      return data;
    } catch (error) {
      console.error(`[API] academicYearsAPI.getStudentsInClass: Exception:`, error);
      throw error;
    }
  },
  
  // Add a student to a class in a specific academic year
  addStudentToClass: async (academicYearId, classId, studentData) => {
    console.log(`[API] academicYearsAPI.addStudentToClass: Adding student to class ${classId} in academic year ${academicYearId}, data:`, studentData);
    try {
      // Format the data according to API requirements - an array of student_ids
      const requestData = {
        studentIds: Array.isArray(studentData) ? studentData : [studentData]
      };
      
      console.log(`[API] academicYearsAPI.addStudentToClass: Formatted request data:`, requestData);
      
      const response = await fetch(`${API_BASE_URL}/academic-years/${academicYearId}/classes/${classId}/students`, {
        method: 'POST',
        ...getCommonOptions(),
        headers: getHeaders(),
        body: JSON.stringify(requestData)
      });
      
      console.log(`[API] academicYearsAPI.addStudentToClass: Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`[API] academicYearsAPI.addStudentToClass: Error response: ${response.status} ${response.statusText}`);
      }
      
      const data = await handleResponse(response);
      console.log(`[API] academicYearsAPI.addStudentToClass: Added student successfully, response:`, data);
      return data;
    } catch (error) {
      console.error(`[API] academicYearsAPI.addStudentToClass: Exception:`, error);
      throw error;
    }
  },
  
  // Update a student in a class in a specific academic year
  updateStudentInClass: async (academicYearId, classId, studentId, studentData) => {
    console.log(`[API] academicYearsAPI.updateStudentInClass: Updating student ${studentId} in class ${classId} in academic year ${academicYearId}, data:`, studentData);
    try {
      const response = await fetch(`${API_BASE_URL}/academic-years/${academicYearId}/classes/${classId}/students/${studentId}`, {
        method: 'PUT',
        ...getCommonOptions(),
        headers: getHeaders(),
        body: JSON.stringify(studentData)
      });
      
      console.log(`[API] academicYearsAPI.updateStudentInClass: Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`[API] academicYearsAPI.updateStudentInClass: Error response: ${response.status} ${response.statusText}`);
      }
      
      const data = await handleResponse(response);
      console.log(`[API] academicYearsAPI.updateStudentInClass: Updated student successfully, response:`, data);
      return data;
    } catch (error) {
      console.error(`[API] academicYearsAPI.updateStudentInClass: Exception:`, error);
      throw error;
    }
  },
  
  // Remove a student from a class in a specific academic year
  removeStudentFromClass: async (academicYearId, classId, studentId) => {
    console.log(`[API] academicYearsAPI.removeStudentFromClass: Removing student ${studentId} from class ${classId} in academic year ${academicYearId}`);
    try {
      const response = await fetch(`${API_BASE_URL}/academic-years/${academicYearId}/classes/${classId}/students/${studentId}`, {
        method: 'DELETE',
        ...getCommonOptions(),
        headers: getHeaders()
      });
      
      console.log(`[API] academicYearsAPI.removeStudentFromClass: Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`[API] academicYearsAPI.removeStudentFromClass: Error response: ${response.status} ${response.statusText}`);
        const errorText = await response.text().catch(() => "Unable to get error details");
        console.error(`[API] academicYearsAPI.removeStudentFromClass: Error details:`, errorText);
      }
      
      const data = await handleResponse(response);
      console.log(`[API] academicYearsAPI.removeStudentFromClass: Removed student successfully`);
      return data;
    } catch (error) {
      console.error(`[API] academicYearsAPI.removeStudentFromClass: Exception:`, error);
      throw error;
    }
  },

  // Set active semester for an academic year
  setActiveSemester: async (semesterId) => {
    console.log(`[API] academicYearsAPI.setActiveSemester: Setting semester ${semesterId} as active`);
    try {
      const response = await fetch(`${API_BASE_URL}/academic-years/semester/${semesterId}`, {
        method: 'PUT',
        ...getCommonOptions(),
        headers: getHeaders(),
        body: JSON.stringify({ is_active: true })
      });
      
      console.log(`[API] academicYearsAPI.setActiveSemester: Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`[API] academicYearsAPI.setActiveSemester: Error response: ${response.status} ${response.statusText}`);
        throw new Error('Failed to set active semester');
      }
      
      const data = await handleResponse(response);
      console.log(`[API] academicYearsAPI.setActiveSemester: Successfully set active semester, response:`, data);
      return data;
    } catch (error) {
      console.error(`[API] academicYearsAPI.setActiveSemester: Exception:`, error);
      throw error;
    }
  }
};