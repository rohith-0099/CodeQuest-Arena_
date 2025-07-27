import React from 'react';
import { useNavigate } from 'react-router-dom';
import './WelcomePage.css';

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-page">
      <div className="welcome-container">
        <div className="welcome-header">
          <h1 className="welcome-title">
            <span className="code-text">Code</span>
            <span className="quest-text">Quest</span>
            <span className="arena-text">Arena</span>
          </h1>
          <p className="welcome-tagline">
            Where Coding Dreams Meet Reality - Level Up Your Skills!
          </p>
        </div>
        
        <div className="welcome-content">
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Daily Challenges</h3>
              <p>Sharpen your coding skills with daily quests and challenges</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Hackathons</h3>
              <p>Compete in exciting hackathons with real prizes</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💡</div>
              <h3>Ideathons</h3>
              <p>Showcase your innovative ideas and get recognized</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Blockchain Badges</h3>
              <p>Earn verifiable achievements on the blockchain</p>
            </div>
          </div>
          
          <div className="cta-section">
            <button 
              className="lets-begin-btn"
              onClick={() => navigate('/login')}
            >
              Let's Begin
            </button>
            <p className="cta-text">Join thousands of developers on their coding journey</p>
          </div>
        </div>
        
        <div className="welcome-footer">
          <div className="stats">
            <div className="stat">
              <span className="stat-number">10K+</span>
              <span className="stat-label">Active Coders</span>
            </div>
            <div className="stat">
              <span className="stat-number">500+</span>
              <span className="stat-label">Challenges</span>
            </div>
            <div className="stat">
              <span className="stat-number">100+</span>
              <span className="stat-label">Events</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;