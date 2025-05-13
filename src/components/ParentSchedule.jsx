import React, { useState, useEffect } from 'react';
import { parentsAPI } from '../utils/api';
import { toast } from 'react-toastify';

const ParentSchedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState('senin');

  const days = [
    { value: 'senin', label: 'Senin' },
    { value: 'selasa', label: 'Selasa' },
    { value: 'rabu', label: 'Rabu' },
    { value: 'kamis', label: 'Kamis' },
    { value: 'jumat', label: 'Jumat' },
    { value: 'sabtu', label: 'Sabtu' }
  ];

  // Define colors for each day tab
  const dayColors = {
    'senin': 'primary',
    'selasa': 'success',
    'rabu': 'purple',
    'kamis': 'danger',
    'jumat': 'warning',
    'sabtu': 'secondary'
  };

  // Custom CSS for the purple button (since Bootstrap doesn't have a purple variant by default)
  const purpleButtonStyle = {
    backgroundColor: selectedDay === 'rabu' ? '#6f42c1' : 'transparent',
    borderColor: '#6f42c1',
    color: selectedDay === 'rabu' ? 'white' : '#6f42c1'
  };

  useEffect(() => {
    fetchSchedule(selectedDay);
  }, [selectedDay]);

  const fetchSchedule = async (day) => {
    try {
      setLoading(true);
      setError(null);

      const response = await parentsAPI.getSchedule(day);

      // Handle empty response
      if (!response) {
        throw new Error('No data received from server');
      }

      // Handle array response
      let scheduleItems = Array.isArray(response) ? response :
                         response.data ? response.data :
                         response.schedules ? response.schedules : [];

      if (!Array.isArray(scheduleItems)) {
        throw new Error('Invalid schedule data format');
      }

      const processedData = scheduleItems
        .filter(item => item && typeof item === 'object')
        .map(item => ({
          id: item.id || `schedule-${Math.random()}`,
          subject_name: item.subject_name || item.subject?.name || item.subject || 'Tidak ada pelajaran',
          teacher_name: item.teacher_name || item.teacher?.name || '-',
          start_time: item.start_time || '-',
          end_time: item.end_time || '-'
        }))
        .sort((a, b) => {
          if (a.start_time === '-' || b.start_time === '-') return 0;
          return a.start_time.localeCompare(b.start_time);
        });

      setSchedule(processedData);
      setError(null);

    } catch (err) {
      console.error('Schedule fetch error:', err);
      setError('Gagal memuat jadwal: ' + err.message);
      toast.error('Gagal memuat jadwal pelajaran');
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRange = (startTime, endTime) => {
    if (!startTime || !endTime) return '-';
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';

    // If it's already in HH:MM format, return as is
    if (timeString.includes(':')) return timeString;

    try {
      // Handle 24-hour format
      const hours = Math.floor(timeString / 100);
      const minutes = timeString % 100;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } catch (error) {
      return timeString;
    }
  };

  return (
    <div className="container-fluid py-4">
      <h1 className="mb-4">Jadwal Pelajaran</h1>

      {/* Day tabs with different colors */}
      <div className="d-flex mb-4 overflow-auto">
        {days.map((day) => (
          <button
            key={day.value}
            className={`btn me-2 ${
              day.value === 'rabu'
                ? 'border'
                : selectedDay === day.value
                  ? `btn-${dayColors[day.value]}`
                  : `btn-outline-${dayColors[day.value]}`
            }`}
            style={day.value === 'rabu' ? purpleButtonStyle : {}}
            onClick={() => setSelectedDay(day.value)}
          >
            {day.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      ) : Array.isArray(schedule) && schedule.length > 0 ? (
        <div className="card">
          <div className="card-body">
            <h4 className={`card-title text-${dayColors[selectedDay]} mb-4`}>
              {days.find(d => d.value === selectedDay)?.label}
            </h4>

            {schedule.map((item, index) => {
              // Ensure item is an object before trying to access properties
              if (!item || typeof item !== 'object') {
                console.error('Invalid schedule item:', item);
                return null;
              }

              // Extract and sanitize values
              const subjectText = (typeof item.subject_name === 'string' && item.subject_name) ||
                (typeof item.subject === 'string' && item.subject) ||
                (typeof item.subject === 'object' && item.subject && typeof item.subject.name === 'string' && item.subject.name) ||
                'Tidak ada pelajaran';

              const teacherText = (typeof item.teacher_name === 'string' && item.teacher_name) ||
                (typeof item.teacher === 'string' && item.teacher)

              const classText = (typeof item.class_name === 'string' && item.class_name) ||
                (typeof item.class === 'string' && item.class) ||
                'Kelas';

              return (
                <div
                  key={`schedule-item-${index}`}
                  className="mb-3"
                >
                  <div className="p-3">
                    <h5 className="mb-1">{subjectText}</h5>
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <div className="text-muted">{teacherText}</div>
                      <span className="badge bg-light text-dark p-2">
                        {formatTimeRange(item.start_time, item.end_time)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2"></i>
          Tidak ada jadwal pelajaran untuk hari {days.find(d => d.value === selectedDay)?.label || selectedDay}.
        </div>
      )}
    </div>
  );
};

export default ParentSchedule;
