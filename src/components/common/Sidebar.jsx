// components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo.png';

function Sidebar({ isOpen, toggleSidebar }) {
  const { userRole } = useAuth();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Define menu items for each role
  const menuItems = {
    orang_tua: [
      { title: 'Dashboard', path: '/dashboard', icon: 'bi bi-grid' },
      { title: 'Informasi Kurikulum', path: '/curriculum', icon: 'bi bi-info-circle' },
      { title: 'Informasi Mata Pelajaran', path: '/subjects', icon: 'bi bi-book' },
      { title: 'Kehadiran', path: '/attendance', icon: 'bi bi-person-check' },
      { title: 'Penilaian Akademik', path: '/academic-assessment', icon: 'bi bi-award' },
      { title: 'Jadwal Mata Pelajaran', path: '/schedule', icon: 'bi bi-clock' },
      { title: 'Catatan Evaluasi Siswa', path: '/evaluation-notes', icon: 'bi bi-journal-text' }
    ],
    wali_kelas: [
      { title: 'Dashboard', path: '/dashboard', icon: 'bi bi-grid' },
      { title: 'Informasi Kurikulum', path: '/curriculum', icon: 'bi bi-info-circle' },
      { title: 'Informasi Mata Pelajaran', path: '/subjects', icon: 'bi bi-book' },
      { title: 'Kehadiran', path: '/attendance', icon: 'bi bi-person-check' },
      { title: 'Penilaian Akademik', path: '/academic-assessment', icon: 'bi bi-award' },
      { title: 'Jadwal Mata Pelajaran', path: '/schedule', icon: 'bi bi-clock' },
      { title: 'Catatan Evaluasi Siswa', path: '/evaluation-notes', icon: 'bi bi-journal-text' }
    ],
    admin: [
      { title: 'Dashboard', path: '/dashboard', icon: 'bi bi-grid' },
      { title: 'Informasi Kurikulum', path: '/curriculum', icon: 'bi bi-info-circle' },
      { title: 'Informasi Mata Pelajaran', path: '/subjects', icon: 'bi bi-book' },
      { title: 'Kelola Tahun Ajaran', path: '/academic-year', icon: 'bi bi-calendar' },
      { title: 'Kelola Siswa', path: '/student-management', icon: 'bi bi-person' },
      { title: 'Kelola Jadwal Kelas', path: '/classes', icon: 'bi bi-clock' },
      { title: 'Kelola Pengguna', path: '/user-management', icon: 'bi bi-people' }
    ],
    kepala_sekolah: [
      { title: 'Dashboard', path: '/dashboard', icon: 'bi bi-grid' },
      { title: 'Informasi Kurikulum', path: '/curriculum', icon: 'bi bi-info-circle' },
      { title: 'Informasi Penilaian Siswa', path: '/student-assessment', icon: 'bi bi-file-earmark-text' },
      { title: 'Informasi Mata Pelajaran', path: '/subjects', icon: 'bi bi-book' }
    ]
  };

  // Get menu items for current user role
  const currentMenuItems = menuItems[userRole] || [];

  // Handle menu item click in mobile view
  const handleMenuClick = () => {
    if (isMobile && isOpen) {
      toggleSidebar();
    }
  };

  return (
    <div className={`sidebar bg-white p-3 shadow-sm ${isOpen ? 'show' : ''}`}
         style={{
           position: 'fixed',
           top: 0,
           left: 0,
           bottom: 0,
           width: isMobile ? '280px' : '320px',
           zIndex: 1030,
           overflowY: 'auto',
           transition: 'transform 0.3s ease',
           transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
         }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <img src={logo} alt="DarusTrack Logo" height="40" />
          <h3 className="ms-2 mb-0 text-primary">DarusTrack</h3>
        </div>
        <button
          className="btn btn-sm btn-outline-secondary d-lg-none"
          onClick={toggleSidebar}
          aria-label="Close sidebar"
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      <ul className="nav flex-column">
        {currentMenuItems.map((item, index) => {
          // Check if this menu item matches the current route
          const isActive = location.pathname === item.path;

          return (
            <li className="nav-item mb-2" key={index}>
              <Link
                to={item.path}
                className={`nav-link d-flex align-items-center ${isActive ? 'bg-primary text-white rounded' : 'text-dark'}`}
                onClick={handleMenuClick}
              >
                <i className={`${item.icon} me-2`}></i>
                {item.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default Sidebar;
