/**
 * Get the display name for a semester, ensuring undefined values are handled properly
 * @param {Object} semester - The semester object
 * @returns {String} Formatted semester name or empty string
 */
export const getSemesterDisplayName = (semester) => {
  if (!semester) return '';
  
  if (semester.name) {
    return semester.name;
  }
  
  if (semester.semester) {
    return `Semester ${semester.semester}`;
  }
  
  if (semester.number) {
    return `Semester ${semester.number}`;
  }
  
  return ''; // Return empty string instead of undefined
};

/**
 * Get the description for a semester, ensuring undefined values are handled properly
 * @param {Object} semester - The semester object
 * @returns {String} Formatted semester description or empty string
 */
export const getSemesterDescription = (semester) => {
  if (!semester) return '';
  
  if (semester.description) {
    return semester.description;
  }
  
  if (semester.number) {
    return `Semester ${semester.number}`;
  }
  
  if (semester.semester) {
    return `Semester ${semester.semester}`;
  }
  
  return ''; // Return empty string instead of undefined
}; 