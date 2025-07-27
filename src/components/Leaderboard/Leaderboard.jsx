import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../service/firebase';
import { collection, getDocs, query, orderBy, limit, getDoc, doc } from 'firebase/firestore';
import './Leaderboard.css';

const Leaderboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fun character names for different ranks
  const getCharacterTitle = (rank) => {
    const titles = {
      1: "🏆 The Ultimate Boss",
      2: "👑 Code Samurai", 
      3: "⚔️ Digital Warrior",
      4: "🦸 Tech Hero",
      5: "🚀 Cyber Champion",
      6: "⭐ Master Coder",
      7: "🎯 Elite Hacker",
      8: "💎 Pro Genius",
      9: "🔥 Rising Star",
      10: "⚡ Code Ninja"
    };
    
    if (rank <= 10) {
      return titles[rank] || "🎖️ Top Performer";
    } else if (rank <= 25) {
      return "🌟 Skilled Developer";
    } else if (rank <= 50) {
      return "💪 Coding Enthusiast";
    } else if (rank <= 100) {
      return "🎮 Tech Explorer";
    } else {
      return "🌱 Rising Talent";
    }
  };

  const getBadgeColor = (rank) => {
    if (rank === 1) return 'linear-gradient(135deg, #ffd700, #ff6b6b)';
    if (rank === 2) return 'linear-gradient(135deg, #c0c0c0, #4ecdc4)';
    if (rank === 3) return 'linear-gradient(135deg, #cd7f32, #ff9a56)';
    if (rank <= 10) return 'linear-gradient(135deg, #667eea, #764ba2)';
    if (rank <= 25) return 'linear-gradient(135deg, #48cae4, #023e8a)';
    if (rank <= 50) return 'linear-gradient(135deg, #40e0d0, #ee82ee)';
    return 'linear-gradient(135deg, #98d8c8, #f7dc6f)';
  };

  const getCrownIcon = (rank) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    if (rank <= 10) return '🏆';
    if (rank <= 25) return '🌟';
    if (rank <= 50) return '⭐';
    return '🎯';
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchLeaderboard();
    }
  }, [user]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('points', 'desc'),
        limit(100)
      );
      
      const snapshot = await getDocs(usersQuery);
      const users = [];
      
      snapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.points > 0) {
          users.push({
            id: doc.id,
            name: userData.name || 'Anonymous',
            email: userData.email,
            points: userData.points || 0,
            college: userData.college || 'Not specified',
            streak: userData.streak || 0,
            badges: userData.badges || 0,
            avatar: userData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || userData.email || 'User')}&background=random&color=fff`,
            joinedAt: userData.createdAt || new Date()
          });
        }
      });

      const rankedUsers = users.map((user, index) => ({
        ...user,
        rank: index + 1
      }));

      setLeaderboardData(rankedUsers);

      const currentUserIndex = rankedUsers.findIndex(u => u.id === user.uid);
      if (currentUserIndex !== -1) {
        setCurrentUserRank(rankedUsers[currentUserIndex]);
      }

    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPoints = (points) => {
    if (points >= 1000000) return `${(points / 1000000).toFixed(1)}M`;
    if (points >= 1000) return `${(points / 1000).toFixed(1)}K`;
    return points.toString();
  };

  return (
    <div className="leaderboard-arena">
      {/* Header */}
      <header className="leaderboard-header">
        <div className="header-content">
          <div className="header-left">
            <button onClick={() => navigate('/dashboard')} className="back-btn">
              ← Back to Arena
            </button>
            <div className="title-section">
              <h1>🏆 Hall of Fame</h1>
              <p>The ultimate coding champions leaderboard</p>
            </div>
          </div>
          
          {currentUserRank && (
            <div className="user-rank-showcase">
              <div className="user-rank-card">
                <div className="user-rank-header">
                  <span className="user-rank-crown">{getCrownIcon(currentUserRank.rank)}</span>
                  <div className="user-rank-info">
                    <span className="user-rank-position">#{currentUserRank.rank}</span>
                    <span className="user-rank-title">{getCharacterTitle(currentUserRank.rank)}</span>
                  </div>
                </div>
                <div className="user-points-display">
                  <span className="points-large">{formatPoints(currentUserRank.points)}</span>
                  <span className="points-label">Points</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="leaderboard-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading the Hall of Fame...</p>
          </div>
        ) : (
          <>
            {/* Champions Podium */}
            {leaderboardData.length >= 3 && (
              <div className="champions-podium">
                <h2>🎖️ Top Champions</h2>
                <div className="podium-container">
                  {/* Second Place */}
                  <div className="podium-position second">
                    <div className="champion-card">
                      <div className="champion-crown">🥈</div>
                      <img src={leaderboardData[1].avatar} alt={leaderboardData[1].name} />
                      <h3>{leaderboardData[1].name}</h3>
                      <p className="champion-title">{getCharacterTitle(2)}</p>
                      <p className="champion-college">{leaderboardData[1].college}</p>
                      <div className="champion-points">{formatPoints(leaderboardData[1].points)} pts</div>
                    </div>
                    <div className="podium-base second-base">2nd</div>
                  </div>

                  {/* First Place */}
                  <div className="podium-position first">
                    <div className="champion-card ultimate-boss">
                      <div className="champion-crown">👑</div>
                      <img src={leaderboardData[0].avatar} alt={leaderboardData[0].name} />
                      <h3>{leaderboardData[0].name}</h3>
                      <p className="champion-title">{getCharacterTitle(1)}</p>
                      <p className="champion-college">{leaderboardData[0].college}</p>
                      <div className="champion-points">{formatPoints(leaderboardData[0].points)} pts</div>
                    </div>
                    <div className="podium-base first-base">1st</div>
                  </div>

                  {/* Third Place */}
                  <div className="podium-position third">
                    <div className="champion-card">
                      <div className="champion-crown">🥉</div>
                      <img src={leaderboardData[2].avatar} alt={leaderboardData[2].name} />
                      <h3>{leaderboardData[2].name}</h3>
                      <p className="champion-title">{getCharacterTitle(3)}</p>
                      <p className="champion-college">{leaderboardData[2].college}</p>
                      <div className="champion-points">{formatPoints(leaderboardData[2].points)} pts</div>
                    </div>
                    <div className="podium-base third-base">3rd</div>
                  </div>
                </div>
              </div>
            )}

            {/* Full Leaderboard */}
            <div className="leaderboard-table-section">
              <h2>🎯 Complete Rankings</h2>
              <div className="leaderboard-table">
                <div className="table-header">
                  <div className="col-rank">Rank</div>
                  <div className="col-name">Name</div>
                  <div className="col-points">Points</div>
                  <div className="col-college">College</div>
                  <div className="col-title">Rank</div>
                </div>
                
                <div className="table-body">
                  {leaderboardData.map((participant, index) => (
                    <div 
                      key={participant.id} 
                      className={`table-row ${participant.id === user?.uid ? 'current-user-row' : ''} ${index < 10 ? 'top-ten' : ''}`}
                    >
                      <div className="col-rank">
                        <div 
                          className="rank-badge-fun"
                          style={{ background: getBadgeColor(participant.rank) }}
                        >
                          <span className="rank-crown">{getCrownIcon(participant.rank)}</span>
                          <span className="rank-number">#{participant.rank}</span>
                        </div>
                      </div>
                      
                      <div className="col-name">
                        <div className="participant-info">
                          <img 
                            src={participant.avatar} 
                            alt={participant.name}
                            className="participant-avatar"
                          />
                          <div className="participant-details">
                            <span className="participant-name">{participant.name}</span>
                            <span className="participant-email">{participant.email}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-points">
                        <div className="points-display">
                          <span className="points-value">{formatPoints(participant.points)}</span>
                          <span className="points-suffix">pts</span>
                        </div>
                      </div>
                      
                      <div className="col-college">
                        <span className="college-name">{participant.college}</span>
                      </div>
                      
                      <div className="col-title">
                        <div className="fun-tag">
                          <span className="fun-tag-text">{getCharacterTitle(participant.rank)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {leaderboardData.length === 0 && (
                <div className="no-data-fun">
                  <h3>🎮 No champions yet!</h3>
                  <p>Be the first to earn points and become the Ultimate Boss!</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Leaderboard;
