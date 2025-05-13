import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { teachersAPI, studentsAPI } from '../utils/api';
import { toast } from 'react-toastify';
import ParentSchedule from '../components/ParentSchedule';

const Schedule = () => {
  const { userRole } = useAuth();
  const [activeDay, setActiveDay] = useState('Senin');
  const [scheduleData, setScheduleData] = useState({});
  const [loading, setLoading] = useState(false);

  // If user is a parent, render the ParentSchedule component
  if (userRole === 'orang_tua') {
    return <ParentSchedule />;
  }

  const fetchSchedule = async (day) => {
    try {
      setLoading(true);
      let response;

      if (userRole === 'teacher' || userRole === 'wali_kelas') {
        response = await teachersAPI.getSchedule(day);
      } else if (userRole === 'student') {
        response = await studentsAPI.getSchedule(day);
      } else {
        throw new Error('Unauthorized');
      }

      console.log('Schedule response:', response);

      // Group schedule by day
      const scheduleByDay = {};
      if (Array.isArray(response)) {
        response.forEach(item => {
          if (!scheduleByDay[item.day]) {
            scheduleByDay[item.day] = [];
          }
          scheduleByDay[item.day].push({
            subject: item.subject_name,
            subjectId: item.subject_id,
            timeStart: item.start_time,
            timeEnd: item.end_time,
            ...(userRole === 'teacher' ? { class: item.class_name } : {})
          });
        });
      }

      setScheduleData(scheduleByDay);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      toast.error('Gagal mengambil jadwal');
    } finally {
      setLoading(false);
    }
  };

  // Fetch schedule when day changes or on component mount
  useEffect(() => {
    if (['teacher', 'wali_kelas', 'student'].includes(userRole)) {
      fetchSchedule(activeDay.toLowerCase());
    }
  }, [userRole, activeDay]);

  // Define colors for each day
  const dayColors = {
    'Senin': 'primary',
    'Selasa': 'success',
    'Rabu': 'purple',
    'Kamis': 'danger',
    'Jumat': 'warning',
    'Sabtu': 'secondary'
  };

  // Custom CSS for the purple button (since Bootstrap doesn't have a purple variant by default)
  const purpleButtonStyle = {
    backgroundColor: activeDay === 'Rabu' ? '#6f42c1' : 'transparent',
    borderColor: '#6f42c1',
    color: activeDay === 'Rabu' ? 'white' : '#6f42c1'
  };

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  // Only allow teacher, wali_kelas, student, and orang_tua roles
  if (!['teacher', 'wali_kelas', 'student', 'orang_tua'].includes(userRole)) {
    return (
      <div className="container py-4">
        <div className="alert alert-warning">
          Anda tidak memiliki akses ke halaman ini
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h2 className="mb-4">Jadwal Kelas</h2>

      {/* Day tabs with different colors */}
      <div className="d-flex mb-4 overflow-auto">
        {days.map((day) => (
          <button
            key={day}
            className={`btn me-2 ${
              day === 'Rabu'
                ? 'border'
                : activeDay === day
                  ? `btn-${dayColors[day]}`
                  : `btn-outline-${dayColors[day]}`
            }`}
            style={day === 'Rabu' ? purpleButtonStyle : {}}
            onClick={() => setActiveDay(day)}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Schedule content */}
      <div className="card">
        <div className="card-body">
          <h4 className={`card-title text-${dayColors[activeDay]} mb-4`}>{activeDay}</h4>

          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : scheduleData[activeDay] && scheduleData[activeDay].length > 0 ? (
            scheduleData[activeDay].map((schedule, index) => (
              <div
                key={index}
                className="card mb-3 border-0 shadow-sm"
              >
                <div className="card-body d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1">{schedule.subject}</h5>
                    {['teacher', 'wali_kelas'].includes(userRole) && (
                      <div className="text-muted small">Kelas {schedule.class}</div>
                    )}
                  </div>
                  <div className="text-end">
                    <span className="badge bg-light text-dark p-2">
                      {schedule.timeStart} - {schedule.timeEnd}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted py-4">
              Tidak ada jadwal untuk hari ini
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Schedule;
