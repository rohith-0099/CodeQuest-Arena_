// src/components/shared/Header/Header.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
// import { useAuth } from '../../hooks/useAuth'; // Uncomment when useAuth hook is implemented
import '../../../styles/Header.css';

function Header() {
  // const { currentUser, logout } = useAuth(); // Uncomment when useAuth is implemented
  const navigate = useNavigate();

  // Placeholder for user profile image and name
  const userProfile = {
    name: 'Rohit', // Replace with actual user name from auth context
    imageUrl: 'https://placehold.co/40x40/6a0dad/ffffff?text=R', // Placeholder image
  };

  const handleLogout = async () => {
    // --- Firebase Logout Logic (Uncomment when Firebase is set up) ---
    // try {
    //   await logout();
    //   navigate('/login');
    // } catch (error) {
    //   console.error("Failed to log out:", error);
    //   // Optionally show an error message to the user
    // }
    // --- End Firebase Logout Logic ---

    // --- Placeholder for Demo ---
    alert('Logged out! (Demo)');
    navigate('/login');
    // --- End Placeholder ---
  };

  return (
    <header className="header-container">
      <div className="header-left">
        <Link to="/dashboard" className="header-logo">
          CodeQuest Arena
        </Link>
      </div>
      <nav className="header-nav">
        {/* These links will be active once Dashboard is fully implemented with cards */}
        <Link to="/code-ninja" className="nav-item">Code Ninja</Link>
        <Link to="/do-the-quiz" className="nav-item">Quizzes</Link>
        <Link to="/hackathons" className="nav-item">Hackathons</Link>
        <Link to="/leaderboard" className="nav-item">Leaderboard</Link>
        {/* Add more nav items as needed */}
      </nav>
      <div className="header-right">
        {/* {currentUser ? ( // Uncomment when useAuth is implemented */}
          <div className="profile-dropdown-container">
            <img src={userProfile.imageUrl} alt="User Profile" className="profile-picture" />
            <span className="profile-name">{userProfile.name}</span>
            <div className="profile-dropdown-content">
              <Link to="/profile">Edit Profile</Link>
              <Link to="/profile?tab=badges">Badges</Link>
              <Link to="/profile?tab=submissions">Submissions</Link>
              <button onClick={handleLogout}>Logout</button>
            </div>
          </div>
        {/* ) : (
          <Link to="/login" className="button button-primary">Login</Link>
        )} */}
      </div>
    </header>
  );
}

export default Header;
