import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../../services/firebase';
import { useAuth } from '../../../context/AuthContext';
import { useUser } from '../../../context/UserContext';
import '../../../styles/Header.css';
  // This line should be line 7, not line 20


const Header = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { userProfile, points } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navigationItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Code Ninja', path: '/code-ninja' },
    { label: 'Quiz', path: '/quiz' },
    { label: 'Hackathon', path: '/hackathon' },
    { label: 'Leaderboard', path: '/leaderboard' }
  ];

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <div className="logo" onClick={() => navigate('/dashboard')}>
            <h2>CodeQuest Arena</h2>
          </div>
          <nav className="nav-menu">
            {navigationItems.map((item) => (
              <button
                key={item.path}
                className="nav-item"
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="header-right">
          <div className="points-display">
            <span className="points-icon">🏆</span>
            <span className="points-text">{points} XP</span>
          </div>
          
          <div className="profile-dropdown">
            <button
              className="profile-button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="profile-avatar">
                {currentUser?.photoURL ? (
                  <img src={currentUser.photoURL} alt="Profile" />
                ) : (
                  <span>{userProfile?.name?.charAt(0) || 'U'}</span>
                )}
              </div>
              <span className="dropdown-arrow">▼</span>
            </button>

            {dropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <p className="user-name">{userProfile?.name || 'User'}</p>
                  <p className="user-email">{currentUser?.email}</p>
                </div>
                <div className="dropdown-divider"></div>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    navigate('/profile');
                    setDropdownOpen(false);
                  }}
                >
                  👤 Edit Profile
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    navigate('/profile');
                    setDropdownOpen(false);
                  }}
                >
                  🎖️ My Badges
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    navigate('/profile');
                    setDropdownOpen(false);
                  }}
                >
                  📝 My Submissions
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout" onClick={handleLogout}>
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;