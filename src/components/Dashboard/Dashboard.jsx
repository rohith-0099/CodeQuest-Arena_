import React, { useEffect, useState } from 'react';
import { auth, db } from '../../service/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  // Dashboard cards configuration with new design properties
  const dashboardCards = [
    {
      id: 'code-ninja',
      title: '🥷 Code Ninja',
      description: 'Practice coding problems',
      path: '/code-ninja',
      buttonText: 'Start Coding',
      pattern: 'triangles',
      color: 'green'
    },
    {
      id: 'quiz',
      title: '🧠 Quiz Arena',
      description: 'Test your knowledge',
      path: '/quiz',
      buttonText: 'Take Quiz',
      pattern: 'circles',
      color: 'blue'
    },
    {
      id: 'hackathon',
      title: '🏆 Hackathons',
      description: 'Join competitions',
      path: '/hackathon',
      buttonText: 'View Events',
      pattern: 'waves',
      color: 'orange'
    },
    {
      id: 'ideathon',
      title: '💡 Ideathon',
      description: 'Innovation challenges',
      path: '/ideathon',
      buttonText: 'Get Ideas',
      pattern: 'dots',
      color: 'purple'
    },
    {
      id: 'leaderboard',           // ✅ Added leaderboard card
      title: '🏆 Leaderboard',
      description: 'Hall of Fame rankings',
      path: '/leaderboard',
      buttonText: 'View Rankings', 
      pattern: 'zigzag',
      color: 'indigo'
    }
  ];

  useEffect(() => {
    // Check if user is logged in
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Get user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        // User not logged in, redirect to login
        navigate('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // Handle card button clicks with enhanced debugging
  const handleCardClick = (path) => {
    console.log('=== NAVIGATION DEBUG ===');
    console.log('Button clicked for path:', path);
    console.log('Navigate function:', typeof navigate);
    console.log('Current URL:', window.location.href);
    
    if (path === '/leaderboard') {
      console.log('✅ LEADERBOARD BUTTON CLICKED!');
      console.log('About to navigate to leaderboard...');
    }
    
    try {
      navigate(path);
      console.log('✅ Navigation successful');
    } catch (error) {
      console.error('❌ Navigation error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-new">
        <div className="loading-container-new">
          <div className="loading-dots-new">
            <div className="dot-new"></div>
            <div className="dot-new"></div>
            <div className="dot-new"></div>
          </div>
          <p className="loading-text-new">Loading your arena...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-new">
      {/* Floating Shapes Background */}
      <div className="floating-shapes-new">
        <div className="shape-new shape-1"></div>
        <div className="shape-new shape-2"></div>
        <div className="shape-new shape-3"></div>
        <div className="shape-new shape-4"></div>
        <div className="shape-new shape-5"></div>
      </div>

      {/* Header */}
      <header className="dashboard-header-new">
        <div className="header-content-new">
          <div className="logo-section-new">
            <div className="logo-icon-new">🎮</div>
            <h1 className="logo-text-new">CodeQuest Arena Dashboard</h1>
          </div>
          
          <div className="profile-section-new">
            <div className="quick-stats-new">
              <div className="stat-item-new">
                <span className="stat-icon-new">🏆</span>
                <span className="stat-value-new">{userProfile?.points || 0}</span>
              </div>
              <div className="stat-item-new">
                <span className="stat-icon-new">🔥</span>
                <span className="stat-value-new">{userProfile?.streak || 0}</span>
              </div>
            </div>
            
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="profile-btn-new"
            >
              <img 
                src={user?.photoURL || `https://ui-avatars.com/api/?name=${userProfile?.name || user?.email}&background=ff6b6b&color=fff&size=50`}
                alt="Profile" 
                className="profile-pic-new"
              />
              <div className="profile-text-new">
                <span className="profile-greeting-new">Hey,</span>
                <span className="profile-username-new">{userProfile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Coder'}</span>
              </div>
              <div className="dropdown-arrow-new">▼</div>
            </button>
            
            {showDropdown && (
              <div className="dropdown-new">
                <div className="dropdown-header-new">
                  <img 
                    src={user?.photoURL || `https://ui-avatars.com/api/?name=${userProfile?.name || user?.email}&background=ff6b6b&color=fff&size=60`}
                    alt="Profile" 
                    className="dropdown-avatar-new"
                  />
                  <div>
                    <h3>{userProfile?.name || user?.email}</h3>
                    <p>{userProfile?.college || 'Not specified'}</p>
                  </div>
                </div>
                <div className="dropdown-menu-new">
                  <button onClick={() => navigate('/profile')}>👤 Profile</button>
                  <button onClick={() => navigate('/settings')}>⚙️ Settings</button>
                  <hr />
                  <button onClick={handleLogout} className="logout-btn-new">🚪 Logout</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content-new">
        {/* Welcome Section */}
        <section className="welcome-section-new">
          <div className="welcome-card-new">
            <h2 className="welcome-title-new">
              Welcome back, 
              <span className="highlight-name-new"> {userProfile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Coder'}</span>! ⚔️
            </h2>
            <p className="welcome-subtitle-new">Ready to level up your coding skills?</p>
          </div>
        </section>

        {/* User Profile Info */}
        <section className="user-info-new">
          <h3 className="section-title-new">Your Profile:</h3>
          <div className="profile-grid-new">
            <div className="profile-item-new">
              <span className="profile-label-new">Name:</span>
              <span className="profile-value-new">{userProfile?.name || 'Not set'}</span>
            </div>
            <div className="profile-item-new">
              <span className="profile-label-new">Email:</span>
              <span className="profile-value-new">{user?.email}</span>
            </div>
            <div className="profile-item-new">
              <span className="profile-label-new">College:</span>
              <span className="profile-value-new">{userProfile?.college || 'Not set'}</span>
            </div>
            <div className="profile-item-new">
              <span className="profile-label-new">Points:</span>
              <span className="profile-value-new points-highlight">{userProfile?.points || 0}</span>
            </div>
            <div className="profile-item-new">
              <span className="profile-label-new">Streak:</span>
              <span className="profile-value-new streak-highlight">{userProfile?.streak || 0} days</span>
            </div>
          </div>
        </section>

        {/* Dashboard Cards */}
        <section className="dashboard-cards-new">
          <h3 className="section-title-new">Choose Your Quest</h3>
          <div className="cards-grid-new">
            {dashboardCards.map((card, index) => (
              <div
                key={card.id}
                className={`card-new ${card.pattern} ${card.color}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="card-pattern-new"></div>
                <div className="card-content-new">
                  <h3 className="card-title-new">{card.title}</h3>
                  <p className="card-description-new">{card.description}</p>
                  <button 
                    onClick={() => handleCardClick(card.path)}
                    className="card-button-new"
                  >
                    {card.buttonText}
                    <span className="button-arrow-new">→</span>
                  </button>
                </div>
                <div className="card-glow-new"></div>
              </div>
            ))}
          </div>
        </section>

        {/* Debug Section */}
        <section className="debug-section-new">
          <h3 className="section-title-new">Debug Tools</h3>
          <button 
            onClick={() => handleCardClick('/leaderboard')}
            className="debug-button-new"
          >
            🏆 DEBUG: Test Leaderboard Direct
          </button>
          <button 
            onClick={() => handleCardClick('/code-ninja')}
            className="debug-button-new"
          >
            🐛 DEBUG: Test CodeNinja Direct
          </button>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
