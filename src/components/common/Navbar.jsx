// components/Navbar.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import SemesterInfo from './SemesterInfo';

function Navbar({ toggleSidebar }) {
  const { currentUser, logout, refreshToken } = useAuth();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tokenStatus, setTokenStatus] = useState({
    expiresIn: null,
    isExpired: false,
    isNearExpiry: false
  });

  // Check token expiration status
  useEffect(() => {
    const checkTokenStatus = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setTokenStatus({
          expiresIn: null,
          isExpired: true,
          isNearExpiry: false
        });
        return;
      }

      try {
        // Decode token
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const expiration = tokenPayload.exp * 1000; // Convert to milliseconds
        const now = Date.now();
        const timeLeft = expiration - now;

        // Calculate time left in minutes
        const minutesLeft = Math.round(timeLeft / (60 * 1000));

        setTokenStatus({
          expiresIn: minutesLeft,
          isExpired: timeLeft <= 0,
          isNearExpiry: timeLeft > 0 && timeLeft < 5 * 60 * 1000 // 5 minutes
        });
      } catch (error) {
        console.error('Error checking token expiration:', error);
        setTokenStatus({
          expiresIn: null,
          isExpired: false,
          isNearExpiry: false
        });
      }
    };

    // Check on mount and then every minute
    checkTokenStatus();
    const interval = setInterval(checkTokenStatus, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRefreshToken = async () => {
    setIsRefreshing(true);
    const toastId = toast.loading('Refreshing token...');
    try {
      await refreshToken();
      toast.dismiss(toastId);
      toast.success('Token refreshed successfully!');

      // Update token status after successful refresh
      const token = localStorage.getItem('token');
      if (token) {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const expiration = tokenPayload.exp * 1000;
        const now = Date.now();
        const minutesLeft = Math.round((expiration - now) / (60 * 1000));

        setTokenStatus({
          expiresIn: minutesLeft,
          isExpired: false,
          isNearExpiry: false
        });
      }
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(`Token refresh failed: ${error.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get button style based on token status
  const getTokenButtonStyle = () => {
    if (tokenStatus.isExpired) {
      return 'btn-danger';
    }
    if (tokenStatus.isNearExpiry) {
      return 'btn-warning';
    }
    return 'btn-outline-secondary';
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom px-4 sticky-top">
      <div className="container-fluid">
        <button
          className="btn btn-sm d-lg-none me-3"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <i className="bi bi-list fs-4"></i>
        </button>

        <span className="navbar-brand d-md-none">DarusTrack</span>

        {/* Semester Info - visible on medium screens and up */}
        <div className="me-3 d-none d-md-block border-end pe-3">
          <SemesterInfo />
        </div>

        <button
          className={`btn btn-sm ${getTokenButtonStyle()} ms-2 d-none d-md-inline-flex align-items-center`}
          onClick={handleRefreshToken}
          disabled={isRefreshing}
          title={tokenStatus.expiresIn !== null ? `Token expires in ${tokenStatus.expiresIn} minutes` : 'Refresh Token'}
        >
          <i className={`bi bi-arrow-clockwise ${isRefreshing ? 'animate-spin' : ''}`}></i>
          <span className="ms-1 d-none d-lg-inline">
            {tokenStatus.isExpired ? 'Expired' :
             tokenStatus.isNearExpiry ? 'Expires Soon' :
             tokenStatus.expiresIn !== null ? `${tokenStatus.expiresIn}m` : 'Refresh'}
          </span>
        </button>

        <div className="ms-auto d-flex align-items-center">
          {/* Semester Info - visible only on small screens */}
          <div className="me-3 d-block d-md-none">
            <SemesterInfo />
          </div>
          
          <div className="dropdown">
            <button
              className="btn btn-light dropdown-toggle d-flex align-items-center"
              type="button"
              id="userDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <div className="d-none d-md-block me-2">
                {currentUser?.name || 'User'}
              </div>
              <div className="avatar-sm bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                   style={{ width: '32px', height: '32px' }}>
                <span>{currentUser?.name?.charAt(0) || 'U'}</span>
              </div>
            </button>
            <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
              <li>
                <div className="dropdown-item-text d-md-none">
                  <strong>{currentUser?.name || 'User'}</strong>
                </div>
              </li>
              <li><hr className="dropdown-divider d-md-none" /></li>
              <li className="d-md-none">
                <button
                  className={`dropdown-item d-flex align-items-center ${tokenStatus.isNearExpiry ? 'text-warning' : tokenStatus.isExpired ? 'text-danger' : ''}`}
                  onClick={handleRefreshToken}
                  disabled={isRefreshing}
                >
                  <i className={`bi bi-arrow-clockwise me-2 ${isRefreshing ? 'animate-spin' : ''}`}></i>
                  {tokenStatus.isExpired ? 'Token Expired' :
                   tokenStatus.isNearExpiry ? 'Token Expires Soon' :
                   'Refresh Token'}
                  {tokenStatus.expiresIn !== null && !tokenStatus.isExpired ? ` (${tokenStatus.expiresIn}m)` : ''}
                </button>
              </li>
              <li><Link className="dropdown-item" to="/profile">Profile</Link></li>
              <li><hr className="dropdown-divider" /></li>
              <li><button className="dropdown-item" onClick={handleLogout}>Logout</button></li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}

const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin {
  animation: spin 1s linear infinite;
}
`;
document.head.appendChild(styleSheet);

export default Navbar;
