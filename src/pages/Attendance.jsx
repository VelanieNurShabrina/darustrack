import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AttendanceForm from '../components/AttendanceForm';
import ParentAttendance from '../components/ParentAttendance';
import WaliKelasAttendances from '../components/WaliKelasAttendances';

const Attendance = () => {
  const { userRole } = useAuth();
  
  // If user is a parent, render the ParentAttendance component
  if (userRole === 'orang_tua') {
    return <ParentAttendance />;
  }
  
  // If user is a wali_kelas, only show WaliKelasAttendances component
  if (userRole === 'wali_kelas') {
    return (
      <div className="container py-4">
        <h3 className="mb-4">Daftar Kehadiran Siswa</h3>
          <WaliKelasAttendances />
      </div>
    );
  }
  
  // For other roles (like regular teachers), only show the AttendanceForm
  return (
    <div className="container py-4">
      <AttendanceForm />
    </div>
  );
};

export default Attendance;
