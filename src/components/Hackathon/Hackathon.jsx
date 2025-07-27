import { useState, useEffect } from 'react';
import EthereumService from '../../services/ethereum';
import HackathonFirebaseService from '../../service/firebase';
import './Hackathon.css';

const Hackathon = () => {
  // Core state variables
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState('0');
  const [isOwner, setIsOwner] = useState(false);
  const [currentView, setCurrentView] = useState('main');

  // AURA coin state
  const [userAuraBalance, setUserAuraBalance] = useState({
    balance: 0,
    totalEarned: 0,
    totalRedeemed: 0
  });
  const [auraConversionRate, setAuraConversionRate] = useState(1000);
  const [showAuraRedemption, setShowAuraRedemption] = useState(false);
  const [auraToRedeem, setAuraToRedeem] = useState('');
  const [isHackathonHost, setIsHackathonHost] = useState(false);

  // Firebase integrated hackathon data
  const [hackathons, setHackathons] = useState([]);
  const [loadingHackathons, setLoadingHackathons] = useState(false);
  const [participants, setParticipants] = useState({});
  const [submissions, setSubmissions] = useState({});

  // Modal and form states
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showWinnerSelection, setShowWinnerSelection] = useState(false);

  // Form states
  const [hostForm, setHostForm] = useState({
    title: '',
    description: '',
    requirements: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    auraReward: '',
    maxParticipants: '',
    firstPlace: '',
    secondPlace: '',
    thirdPlace: ''
  });

  const [registrationForm, setRegistrationForm] = useState({
    participantName: '',
    teamName: '',
    teamMembers: '',
    contactEmail: '',
    githubProfileUrl: '',
    githubProjectUrl: '',
    projectIdea: '',
    experienceLevel: 'intermediate',
    linkedinProfile: '',
    portfolio: ''
  });

  const [submissionForm, setSubmissionForm] = useState({
    projectTitle: '',
    githubRepoUrl: '',
    liveDeploymentUrl: '',
    projectDescription: '',
    techStack: '',
    challenges: '',
    futureImprovements: '',
    videoDemo: ''
  });

  // Load hackathons from Firebase
  const loadHackathonsFromFirebase = async () => {
    setLoadingHackathons(true);
    try {
      const hackathonsData = await HackathonFirebaseService.getAllHackathons();
      setHackathons(hackathonsData);
      
      // Load participants and submissions for each hackathon
      for (const hackathon of hackathonsData) {
        const hackathonParticipants = await HackathonFirebaseService.getParticipants(hackathon.id);
        const hackathonSubmissions = await HackathonFirebaseService.getSubmissions(hackathon.id);
        
        setParticipants(prev => ({
          ...prev,
          [hackathon.id]: hackathonParticipants
        }));
        
        setSubmissions(prev => ({
          ...prev,
          [hackathon.id]: hackathonSubmissions
        }));
      }
    } catch (error) {
      console.error('Error loading hackathons from Firebase:', error);
      setHackathons([]);
    } finally {
      setLoadingHackathons(false);
    }
  };

  // Load user AURA data
  const loadUserAuraData = async () => {
    if (!walletAddress) return;
    
    try {
      const auraData = await EthereumService.getAuraCoinBalance(walletAddress);
      setUserAuraBalance(auraData);
      
      const rate = await EthereumService.getAuraToEthRate();
      setAuraConversionRate(rate);
      
      const hostStatus = await EthereumService.isHackathonHost(walletAddress);
      setIsHackathonHost(hostStatus);
    } catch (error) {
      console.error('Error loading AURA data:', error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadHackathonsFromFirebase();
  }, []);

  // Wallet connection
  const connectWallet = async () => {
    try {
      setLoading(true);
      const address = await EthereumService.connectWallet();
      setWalletAddress(address);
      
      const balance = await EthereumService.getBalance();
      setWalletBalance(balance);
      
      const ownerStatus = await EthereumService.isOwner();
      setIsOwner(ownerStatus);
      
      await loadUserAuraData();
      
      alert('🦊 Wallet connected successfully!');
    } catch (error) {
      alert('❌ Failed to connect wallet: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle AURA redemption
  const handleAuraRedemption = async () => {
    if (!auraToRedeem || auraToRedeem < auraConversionRate) {
      alert(`Minimum ${auraConversionRate} AURA required for redemption`);
      return;
    }
    
    try {
      setLoading(true);
      const result = await EthereumService.redeemAuraForETH(parseInt(auraToRedeem));
      
      alert(`🌟 ${auraToRedeem} AURA coins redeemed for ${result.ethAmount} ETH successfully!`);
      setAuraToRedeem('');
      setShowAuraRedemption(false);
      
      await loadUserAuraData();
      const balance = await EthereumService.getBalance();
      setWalletBalance(balance);
      
    } catch (error) {
      alert('❌ AURA redemption failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle hosting hackathon with Firebase and ranking rewards
  const handleHostHackathon = async () => {
    if (!hostForm.title || !hostForm.description || !hostForm.requirements || !hostForm.auraReward) {
      alert('Please fill all required fields');
      return;
    }

    if (!walletAddress) {
      alert('Please connect your wallet first');
      return;
    }

    const newHackathon = {
      title: hostForm.title,
      description: hostForm.description,
      requirements: hostForm.requirements.split(',').map(r => r.trim()),
      startDate: hostForm.startDate,
      endDate: hostForm.endDate,
      registrationDeadline: hostForm.registrationDeadline,
      auraReward: parseInt(hostForm.auraReward),
      rankingRewards: {
        first: parseInt(hostForm.firstPlace) || parseInt(hostForm.auraReward),
        second: parseInt(hostForm.secondPlace) || Math.floor(parseInt(hostForm.auraReward) * 0.6),
        third: parseInt(hostForm.thirdPlace) || Math.floor(parseInt(hostForm.auraReward) * 0.3)
      },
      maxParticipants: parseInt(hostForm.maxParticipants) || 100,
      status: 'active',
      hostAddress: walletAddress,
      winners: []
    };

    try {
      setLoading(true);
      
      // Save to Firebase
      const savedHackathon = await HackathonFirebaseService.createHackathon(newHackathon);
      
      // Update local state
      setHackathons(prev => [savedHackathon, ...prev]);
      setParticipants(prev => ({ ...prev, [savedHackathon.id]: [] }));
      setSubmissions(prev => ({ ...prev, [savedHackathon.id]: [] }));
      
      // Reset form
      setHostForm({
        title: '', description: '', requirements: '', 
        startDate: '', endDate: '', registrationDeadline: '', 
        auraReward: '', maxParticipants: '',
        firstPlace: '', secondPlace: '', thirdPlace: ''
      });
      
      alert('🎉 Hackathon created and saved to Firebase successfully!');
      setCurrentView('main');
      
    } catch (error) {
      alert('❌ Failed to create hackathon: ' + error.message);
      console.error('Firebase save error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle hackathon registration
  const handleHackathonRegistration = async () => {
    // Validate required fields including GitHub URLs
    if (!registrationForm.participantName || !registrationForm.teamName || 
        !registrationForm.contactEmail || !registrationForm.githubProfileUrl || 
        !registrationForm.githubProjectUrl) {
      alert('Please fill all required fields including GitHub Profile URL and GitHub Project URL');
      return;
    }

    // Validate GitHub URLs
    if (!registrationForm.githubProfileUrl.includes('github.com')) {
      alert('Please provide a valid GitHub profile URL');
      return;
    }

    if (!registrationForm.githubProjectUrl.includes('github.com')) {
      alert('Please provide a valid GitHub project repository URL');
      return;
    }

    if (!walletAddress) {
      alert('Please connect your wallet first');
      return;
    }

    const newParticipant = {
      walletAddress: walletAddress,
      participantName: registrationForm.participantName,
      teamName: registrationForm.teamName,
      teamMembers: registrationForm.teamMembers,
      contactEmail: registrationForm.contactEmail,
      githubProfileUrl: registrationForm.githubProfileUrl,
      githubProjectUrl: registrationForm.githubProjectUrl,
      projectIdea: registrationForm.projectIdea,
      experienceLevel: registrationForm.experienceLevel,
      linkedinProfile: registrationForm.linkedinProfile,
      portfolio: registrationForm.portfolio,
      hasSubmitted: false,
      submissionData: null
    };

    try {
      setLoading(true);
      
      // Save participant to Firebase
      const savedParticipant = await HackathonFirebaseService.registerParticipant(
        selectedHackathon.id, 
        newParticipant
      );

      // Update local state
      setParticipants(prev => ({
        ...prev,
        [selectedHackathon.id]: [...(prev[selectedHackathon.id] || []), savedParticipant]
      }));

      alert(`🎉 Successfully registered for ${selectedHackathon.title}!`);
      setRegistrationForm({
        participantName: '', teamName: '', teamMembers: '', contactEmail: '',
        githubProfileUrl: '', githubProjectUrl: '', projectIdea: '', 
        experienceLevel: 'intermediate', linkedinProfile: '', portfolio: ''
      });
      setShowRegistrationModal(false);
      
    } catch (error) {
      alert('❌ Registration failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle project submission
  const handleProjectSubmission = async () => {
    if (!submissionForm.projectTitle || !submissionForm.githubRepoUrl || !submissionForm.projectDescription) {
      alert('Please fill all required fields');
      return;
    }

    const submissionData = {
      hackathonId: selectedHackathon.id,
      participantAddress: walletAddress,
      projectTitle: submissionForm.projectTitle,
      githubRepoUrl: submissionForm.githubRepoUrl,
      liveDeploymentUrl: submissionForm.liveDeploymentUrl,
      projectDescription: submissionForm.projectDescription,
      techStack: submissionForm.techStack,
      challenges: submissionForm.challenges,
      futureImprovements: submissionForm.futureImprovements,
      videoDemo: submissionForm.videoDemo
    };

    try {
      setLoading(true);
      
      // Save submission to Firebase
      const savedSubmission = await HackathonFirebaseService.submitProject(submissionData);
      
      // Find and update participant
      const currentParticipants = participants[selectedHackathon.id] || [];
      const participantToUpdate = currentParticipants.find(p => p.walletAddress === walletAddress);
      
      if (participantToUpdate) {
        await HackathonFirebaseService.updateParticipantSubmission(participantToUpdate.id, submissionData);
      }

      // Update local state
      setSubmissions(prev => ({
        ...prev,
        [selectedHackathon.id]: [...(prev[selectedHackathon.id] || []), {
          ...savedSubmission,
          participantName: participantToUpdate?.participantName || 'Unknown'
        }]
      }));

      setParticipants(prev => ({
        ...prev,
        [selectedHackathon.id]: currentParticipants.map(p => 
          p.walletAddress === walletAddress 
            ? { ...p, hasSubmitted: true, submissionData: submissionData }
            : p
        )
      }));

      alert('🎉 Project submitted successfully!');
      setSubmissionForm({
        projectTitle: '', githubRepoUrl: '', liveDeploymentUrl: '',
        projectDescription: '', techStack: '', challenges: '', futureImprovements: '', videoDemo: ''
      });
      setShowSubmissionModal(false);
      
    } catch (error) {
      alert('❌ Submission failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced winner selection with ranking
  const handleRankedWinnerSelection = async (participantAddress, participantName, rank) => {
    const rewardAmount = selectedHackathon.rankingRewards[rank];
    const rankEmoji = rank === 'first' ? '🥇' : rank === 'second' ? '🥈' : '🥉';
    
    try {
      setLoading(true);
      
      await EthereumService.awardAuraCoin(
        participantAddress,
        rewardAmount,
        selectedHackathon.title,
        `${rankEmoji} ${rank.charAt(0).toUpperCase() + rank.slice(1)} Place Winner`
      );

      // Update Firebase with ranked results
      const winnerData = {
        address: participantAddress,
        name: participantName,
        rank: rank,
        auraAwarded: rewardAmount,
        completedAt: new Date().toISOString()
      };

      await HackathonFirebaseService.selectWinner(selectedHackathon.id, winnerData);

      // Update local state
      setHackathons(prev => prev.map(h => 
        h.id === selectedHackathon.id 
          ? { ...h, winners: [...(h.winners || []), winnerData] }
          : h
      ));

      alert(`${rankEmoji} ${participantName} selected as ${rank} place winner! ${rewardAmount} AURA coins awarded!`);
      
    } catch (error) {
      alert('❌ Failed to award winner: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Get user's registration status for a hackathon
  const getUserRegistrationStatus = (hackathon) => {
    const hackathonParticipants = participants[hackathon.id] || [];
    return hackathonParticipants.find(p => p.walletAddress === walletAddress);
  };

  // Main view
  const renderMainView = () => (
    <div className="hackathon-main">
      <div className="hero-section">
        <h1 className="hero-title">🚀 Code Quest Arena</h1>
        <p className="hero-subtitle">Blockchain-Powered Hackathon Platform with AURA Rewards</p>
      </div>

      {/* AURA wallet section */}
      <div className="aura-wallet-section">
        {walletAddress ? (
          <div className="wallet-connected">
            <div className="wallet-info">
              <div className="wallet-icon-container">
                <span className="wallet-icon">🦊</span>
                <div className="wallet-pulse"></div>
              </div>
              <div className="wallet-details">
                <div className="wallet-address">
                  <small>Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</small>
                </div>
                <div className="eth-balance">
                  <small>{parseFloat(walletBalance).toFixed(4)} ETH</small>
                </div>
                
                <div className="aura-info">
                  <div className="aura-balance-card">
                    <div className="aura-icon">🌟</div>
                    <div className="aura-amount">
                      <span className="aura-number">{userAuraBalance.balance}</span>
                      <span className="aura-label">AURA Coins</span>
                    </div>
                    <div className="aura-sparkle"></div>
                  </div>
                  
                  <div className="aura-stats">
                    <div className="stat-item">
                      <span className="stat-icon">📈</span>
                      <span className="stat-value">{userAuraBalance.totalEarned}</span>
                      <span className="stat-label">Earned</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">💰</span>
                      <span className="stat-value">{userAuraBalance.totalRedeemed}</span>
                      <span className="stat-label">Redeemed</span>
                    </div>
                  </div>
                </div>
                
                <div className="badges">
                  {isOwner && <span className="owner-badge animate-badge">👑 Owner</span>}
                  {isHackathonHost && <span className="host-badge animate-badge">🎯 Host</span>}
                </div>
              </div>
            </div>
            
            <div className="aura-actions">
              <button 
                onClick={() => setShowAuraRedemption(true)}
                className="redeem-aura-btn action-btn"
                disabled={userAuraBalance.balance < auraConversionRate}
              >
                <span className="btn-icon">💰</span>
                <span className="btn-text">Redeem AURA</span>
                <div className="btn-glow"></div>
              </button>
            </div>
          </div>
        ) : (
          <button onClick={connectWallet} className="connect-wallet-btn magical-btn" disabled={loading}>
            <span className="btn-icon">🦊</span>
            <span className="btn-text">{loading ? 'Connecting...' : 'Connect Wallet'}</span>
            <div className="magical-glow"></div>
          </button>
        )}
      </div>

      {/* Three main options */}
      <div className="hackathon-options">
        <div className="option-card host-card" onClick={() => setCurrentView('host-page')}>
          <div className="option-icon">🏆</div>
          <h3>Host Hackathon</h3>
          <p>Create and manage your own hackathon with custom AURA rewards</p>
          <button className="option-btn">Host Now</button>
          <div className="card-particles"></div>
        </div>

        <div className="option-card join-card" onClick={() => setCurrentView('join-page')}>
          <div className="option-icon">🎯</div>
          <h3>Join Hackathon</h3>
          <p>Participate in active hackathons and compete for AURA coins</p>
          <button className="option-btn">Join Now</button>
          <div className="card-particles"></div>
        </div>

        <div className="option-card manage-card" onClick={() => setCurrentView('manage-page')}>
          <div className="option-icon">⚙️</div>
          <h3>Manage Hackathons</h3>
          <p>View your hosted hackathons and select winners</p>
          <button className="option-btn">Manage Now</button>
          <div className="card-particles"></div>
        </div>
      </div>
    </div>
  );

  // Join Page with enhanced hackathon cards
  const renderJoinPage = () => (
    <div className="join-page">
      <div className="page-header">
        <button onClick={() => setCurrentView('main')} className="back-btn">
          <span>←</span> Back to Home
        </button>
        <h1 className="page-title">🎯 Active Hackathons</h1>
        <p className="page-subtitle">Choose a hackathon to join and compete for AURA rewards</p>
      </div>

      {loadingHackathons ? (
        <div className="loading-hackathons">
          <div className="loading-spinner">🌟</div>
          <p>Loading active hackathons from database...</p>
        </div>
      ) : hackathons.filter(h => h.status === 'active').length === 0 ? (
        <div className="no-hackathons">
          <div className="no-hackathons-icon">🎯</div>
          <h3>No Active Hackathons Yet</h3>
          <p>Be the first to host a hackathon and invite participants!</p>
          <button 
            onClick={() => setCurrentView('host-page')} 
            className="create-first-hackathon-btn magical-btn"
          >
            <span className="btn-icon">🏆</span>
            <span className="btn-text">Create First Hackathon</span>
            <div className="magical-glow"></div>
          </button>
        </div>
      ) : (
        <div className="hackathons-grid">
          {hackathons.filter(h => h.status === 'active').map(hackathon => {
            const userRegistration = getUserRegistrationStatus(hackathon);
            const registrationDeadlinePassed = hackathon.registrationDeadline ? new Date(hackathon.registrationDeadline) < new Date() : false;
            const hackathonParticipants = participants[hackathon.id] || [];
            const hackathonSubmissions = submissions[hackathon.id] || [];
            
            return (
              <div key={hackathon.id} className="hackathon-card">
                <div className="hackathon-header">
                  <h3>{hackathon.title}</h3>
                  <div className="aura-reward">
                    <span className="reward-icon">🌟</span>
                    <span className="reward-amount">{hackathon.auraReward}</span>
                    <span className="reward-label">AURA</span>
                  </div>
                </div>
                
                <p className="hackathon-description">{hackathon.description}</p>
                
                {hackathon.registrationDeadline && (
                  <div className="hackathon-timeline">
                    <div className="timeline-item">
                      <span className="timeline-icon">📅</span>
                      <span className="timeline-label">Registration Deadline:</span>
                      <span className="timeline-value">{new Date(hackathon.registrationDeadline).toLocaleDateString()}</span>
                    </div>
                    {hackathon.startDate && (
                      <div className="timeline-item">
                        <span className="timeline-icon">🚀</span>
                        <span className="timeline-label">Start Date:</span>
                        <span className="timeline-value">{new Date(hackathon.startDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {hackathon.endDate && (
                      <div className="timeline-item">
                        <span className="timeline-icon">🏁</span>
                        <span className="timeline-label">End Date:</span>
                        <span className="timeline-value">{new Date(hackathon.endDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Enhanced ranking rewards display */}
                {hackathon.rankingRewards && (
                  <div className="ranking-rewards-display">
                    <h4>🏆 Prize Pool</h4>
                    <div className="rewards-grid">
                      <div className="reward-item first-place">
                        <span className="reward-rank">🥇</span>
                        <span className="reward-amount">{hackathon.rankingRewards.first}</span>
                        <span className="reward-label">AURA</span>
                      </div>
                      <div className="reward-item second-place">
                        <span className="reward-rank">🥈</span>
                        <span className="reward-amount">{hackathon.rankingRewards.second}</span>
                        <span className="reward-label">AURA</span>
                      </div>
                      <div className="reward-item third-place">
                        <span className="reward-rank">🥉</span>
                        <span className="reward-amount">{hackathon.rankingRewards.third}</span>
                        <span className="reward-label">AURA</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="hackathon-requirements">
                  <h4>📋 Requirements:</h4>
                  <ul>
                    {hackathon.requirements && hackathon.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>

                <div className="hackathon-stats">
                  <div className="stat">
                    <span className="stat-icon">👥</span>
                    <span className="stat-label">Participants:</span>
                    <span className="stat-value">{hackathonParticipants.length}/{hackathon.maxParticipants}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-icon">📝</span>
                    <span className="stat-label">Submissions:</span>
                    <span className="stat-value">{hackathonSubmissions.length}</span>
                  </div>
                </div>

                <div className="hackathon-actions">
                  {!userRegistration ? (
                    <button 
                      onClick={() => {
                        setSelectedHackathon(hackathon);
                        setShowRegistrationModal(true);
                      }}
                      className="register-btn"
                      disabled={registrationDeadlinePassed || hackathonParticipants.length >= hackathon.maxParticipants || !walletAddress}
                    >
                      {registrationDeadlinePassed ? '⏰ Registration Closed' : 
                       hackathonParticipants.length >= hackathon.maxParticipants ? '❌ Full' : 
                       '📝 Register'}
                    </button>
                  ) : !userRegistration.hasSubmitted ? (
                    <button 
                      onClick={() => {
                        setSelectedHackathon(hackathon);
                        setShowSubmissionModal(true);
                      }}
                      className="submit-btn"
                    >
                      🚀 Submit Project
                    </button>
                  ) : (
                    <div className="status-info">
                      <span className="status-badge submitted">✅ Project Submitted</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // Enhanced Host Page with ranking rewards
  const renderHostPage = () => (
    <div className="registration-page host-registration">
      <div className="page-header">
        <button onClick={() => setCurrentView('main')} className="back-btn">
          <span>←</span> Back to Home
        </button>
        <h1 className="page-title">🏆 Host Your Hackathon</h1>
        <p className="page-subtitle">Create an amazing hackathon experience with AURA rewards</p>
      </div>

      <div className="registration-form-container">
        <div className="form-section">
          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">📝</span>
              Hackathon Title *
            </label>
            <input
              type="text"
              className="form-input"
              value={hostForm.title}
              onChange={(e) => setHostForm(prev => ({...prev, title: e.target.value}))}
              placeholder="Enter your hackathon title"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">📋</span>
              Description *
            </label>
            <textarea
              className="form-textarea"
              value={hostForm.description}
              onChange={(e) => setHostForm(prev => ({...prev, description: e.target.value}))}
              placeholder="Describe your hackathon theme and goals in detail"
              rows="4"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">✅</span>
              Requirements (comma separated) *
            </label>
            <input
              type="text"
              className="form-input"
              value={hostForm.requirements}
              onChange={(e) => setHostForm(prev => ({...prev, requirements: e.target.value}))}
              placeholder="e.g., JavaScript knowledge, Team of 2-4, GitHub repository, Live demo"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">⏰</span>
                Registration Deadline
              </label>
              <input
                type="date"
                className="form-input"
                value={hostForm.registrationDeadline}
                onChange={(e) => setHostForm(prev => ({...prev, registrationDeadline: e.target.value}))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">📅</span>
                Start Date
              </label>
              <input
                type="date"
                className="form-input"
                value={hostForm.startDate}
                onChange={(e) => setHostForm(prev => ({...prev, startDate: e.target.value}))}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">📅</span>
                End Date
              </label>
              <input
                type="date"
                className="form-input"
                value={hostForm.endDate}
                onChange={(e) => setHostForm(prev => ({...prev, endDate: e.target.value}))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">👥</span>
                Max Participants
              </label>
              <input
                type="number"
                className="form-input"
                value={hostForm.maxParticipants}
                onChange={(e) => setHostForm(prev => ({...prev, maxParticipants: e.target.value}))}
                placeholder="e.g., 100"
              />
            </div>
          </div>

          {/* Enhanced ranking rewards section */}
          <div className="ranking-rewards-section">
            <h4>🏆 Ranking Rewards</h4>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">🥇</span>
                  1st Place AURA *
                </label>
                <input
                  type="number"
                  className="form-input aura-input"
                  value={hostForm.firstPlace}
                  onChange={(e) => setHostForm(prev => ({...prev, firstPlace: e.target.value}))}
                  placeholder="e.g., 5000"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">🥈</span>
                  2nd Place AURA
                </label>
                <input
                  type="number"
                  className="form-input aura-input"
                  value={hostForm.secondPlace}
                  onChange={(e) => setHostForm(prev => ({...prev, secondPlace: e.target.value}))}
                  placeholder="e.g., 3000"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">🥉</span>
                  3rd Place AURA
                </label>
                <input
                  type="number"
                  className="form-input aura-input"
                  value={hostForm.thirdPlace}
                  onChange={(e) => setHostForm(prev => ({...prev, thirdPlace: e.target.value}))}
                  placeholder="e.g., 1000"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">🌟</span>
                  Total AURA Pool (calculated)
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={`${(parseInt(hostForm.firstPlace) || 0) + (parseInt(hostForm.secondPlace) || 0) + (parseInt(hostForm.thirdPlace) || 0)} AURA`}
                  disabled
                />
              </div>
            </div>
            <small className="form-hint">Winners will receive AURA coins automatically in their wallets</small>
          </div>

          <div className="form-actions">
            <button onClick={() => setCurrentView('main')} className="cancel-btn">
              Cancel
            </button>
            <button onClick={handleHostHackathon} className="submit-btn magical-btn" disabled={loading}>
              <span className="btn-icon">🚀</span>
              <span className="btn-text">{loading ? 'Creating...' : 'Create Hackathon'}</span>
              <div className="magical-glow"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Enhanced Manage Page
  const renderManagePage = () => (
    <div className="registration-page manage-page">
      <div className="page-header">
        <button onClick={() => setCurrentView('main')} className="back-btn">
          <span>←</span> Back to Home
        </button>
        <h1 className="page-title">⚙️ Manage Your Hackathons</h1>
        <p className="page-subtitle">View your hosted hackathons, check team GitHub URLs, and select winners</p>
      </div>

      <div className="manage-content">
        <div className="hosted-hackathons">
          {hackathons.filter(h => h.hostAddress === walletAddress).length === 0 ? (
            <div className="no-hosted-hackathons">
              <div className="no-hackathons-icon">⚙️</div>
              <h3>You Haven't Hosted Any Hackathons Yet</h3>
              <p>Create your first hackathon and start managing participants!</p>
              <button 
                onClick={() => setCurrentView('host-page')} 
                className="create-hackathon-btn magical-btn"
              >
                <span className="btn-icon">🏆</span>
                <span className="btn-text">Host Your First Hackathon</span>
                <div className="magical-glow"></div>
              </button>
            </div>
          ) : (
            hackathons.filter(h => h.hostAddress === walletAddress).map(hackathon => {
              const hackathonParticipants = participants[hackathon.id] || [];
              const hackathonSubmissions = submissions[hackathon.id] || [];
              
              return (
                <div key={hackathon.id} className="hosted-hackathon-card">
                  <div className="hackathon-header">
                    <h3>{hackathon.title}</h3>
                    <div className={`status-badge ${hackathon.status}`}>
                      {hackathon.status.toUpperCase()}
                    </div>
                  </div>

                  <div className="hackathon-stats">
                    <div className="stat">
                      <span className="stat-label">Participants:</span>
                      <span className="stat-value">{hackathonParticipants.length}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Submissions:</span>
                      <span className="stat-value">{hackathonSubmissions.length}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">AURA Reward:</span>
                      <span className="stat-value">{hackathon.auraReward} 🌟</span>
                    </div>
                  </div>

                  {/* Enhanced participants section with GitHub URLs */}
                  <div className="participants-section">
                    <h4>👥 Registered Participants</h4>
                    {hackathonParticipants.length === 0 ? (
                      <p className="no-participants">No participants registered yet</p>
                    ) : (
                      <div className="participants-list">
                        {hackathonParticipants.map((participant, index) => (
                          <div key={index} className="participant-card">
                            <div className="participant-info">
                              <h5>{participant.participantName}</h5>
                              <p><strong>Team:</strong> {participant.teamName}</p>
                              <p><strong>Email:</strong> {participant.contactEmail}</p>
                              <p><strong>Wallet:</strong> {participant.walletAddress.slice(0, 6)}...{participant.walletAddress.slice(-4)}</p>
                            </div>
                            <div className="participant-github">
                              <div className="github-links">
                                <a 
                                  href={participant.githubProfileUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="github-link profile-link"
                                >
                                  👤 GitHub Profile
                                </a>
                                <a 
                                  href={participant.githubProjectUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="github-link project-link"
                                >
                                  🔗 Project Repository
                                </a>
                              </div>
                              <div className="submission-status">
                                {participant.hasSubmitted ? (
                                  <span className="status-submitted">✅ Submitted</span>
                                ) : (
                                  <span className="status-pending">⏳ Pending</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Winner selection with ranking */}
                  {hackathon.winners && hackathon.winners.length > 0 ? (
                    <div className="winners-info">
                      <h4>🏆 Winners Selected</h4>
                      {hackathon.winners.map((winner, index) => (
                        <div key={index} className="winner-item">
                          <span className="winner-rank">
                            {winner.rank === 'first' ? '🥇' : winner.rank === 'second' ? '🥈' : '🥉'}
                          </span>
                          <span className="winner-name">{winner.name}</span>
                          <span className="winner-reward">{winner.auraAwarded} AURA</span>
                        </div>
                      ))}
                    </div>
                  ) : hackathonParticipants.length > 0 ? (
                    <button 
                      onClick={() => {
                        setSelectedHackathon(hackathon);
                        setShowWinnerSelection(true);
                      }}
                      className="select-winner-btn magical-btn"
                    >
                      <span className="btn-icon">🏆</span>
                      <span className="btn-text">Select Winners</span>
                      <div className="magical-glow"></div>
                    </button>
                  ) : (
                    <div className="no-submissions">
                      <p>⏳ Waiting for participants to register...</p>
                      <small>Share your hackathon link to get participants</small>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="hackathon-container">
      {currentView === 'main' && renderMainView()}
      {currentView === 'join-page' && renderJoinPage()}
      {currentView === 'host-page' && renderHostPage()}
      {currentView === 'manage-page' && renderManagePage()}

      {/* Registration Modal */}
      {showRegistrationModal && selectedHackathon && (
        <div className="modal-overlay">
          <div className="modal-content registration-modal">
            <div className="modal-header">
              <h3>📝 Register for {selectedHackathon.title}</h3>
              <button onClick={() => setShowRegistrationModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-section">
                <div className="form-group">
                  <label className="form-label required">
                    <span className="label-icon">👤</span>
                    Your Name *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={registrationForm.participantName}
                    onChange={(e) => setRegistrationForm(prev => ({...prev, participantName: e.target.value}))}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">
                    <span className="label-icon">👥</span>
                    Team Name *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={registrationForm.teamName}
                    onChange={(e) => setRegistrationForm(prev => ({...prev, teamName: e.target.value}))}
                    placeholder="Enter your team name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">👥</span>
                    Team Members (optional)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={registrationForm.teamMembers}
                    onChange={(e) => setRegistrationForm(prev => ({...prev, teamMembers: e.target.value}))}
                    placeholder="List other team members if any"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">
                    <span className="label-icon">📧</span>
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    value={registrationForm.contactEmail}
                    onChange={(e) => setRegistrationForm(prev => ({...prev, contactEmail: e.target.value}))}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">
                    <span className="label-icon">🔗</span>
                    GitHub Profile URL *
                  </label>
                  <input
                    type="url"
                    className="form-input github-input"
                    value={registrationForm.githubProfileUrl}
                    onChange={(e) => setRegistrationForm(prev => ({...prev, githubProfileUrl: e.target.value}))}
                    placeholder="https://github.com/yourusername"
                    required
                  />
                  <small className="form-hint">Host will check your GitHub profile and repositories</small>
                </div>

                <div className="form-group">
                  <label className="form-label required">
                    <span className="label-icon">📁</span>
                    GitHub Project Repository URL *
                  </label>
                  <input
                    type="url"
                    className="form-input github-input"
                    value={registrationForm.githubProjectUrl}
                    onChange={(e) => setRegistrationForm(prev => ({...prev, githubProjectUrl: e.target.value}))}
                    placeholder="https://github.com/yourusername/project-repo"
                    required
                  />
                  <small className="form-hint">Repository where you'll develop your hackathon project</small>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">💼</span>
                    LinkedIn Profile (optional)
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    value={registrationForm.linkedinProfile}
                    onChange={(e) => setRegistrationForm(prev => ({...prev, linkedinProfile: e.target.value}))}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">🌐</span>
                    Portfolio Website (optional)
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    value={registrationForm.portfolio}
                    onChange={(e) => setRegistrationForm(prev => ({...prev, portfolio: e.target.value}))}
                    placeholder="https://yourportfolio.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">📝</span>
                    Project Idea (optional)
                  </label>
                  <textarea
                    className="form-textarea"
                    value={registrationForm.projectIdea}
                    onChange={(e) => setRegistrationForm(prev => ({...prev, projectIdea: e.target.value}))}
                    placeholder="Briefly describe your project idea"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">⭐</span>
                    Experience Level
                  </label>
                  <select
                    className="form-input"
                    value={registrationForm.experienceLevel}
                    onChange={(e) => setRegistrationForm(prev => ({...prev, experienceLevel: e.target.value}))}
                  >   
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>
              
              <div className="registration-note">
                <p><strong>Note:</strong> AURA coins are only awarded to winners selected by the host after project evaluation.</p>
                <p><strong>Required:</strong> Valid GitHub URLs are mandatory for registration and will be checked by the host.</p>
              </div>

              <div className="modal-actions">
                <button onClick={() => setShowRegistrationModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button onClick={handleHackathonRegistration} className="register-btn magical-btn" disabled={loading}>
                  <span className="btn-icon">📝</span>
                  <span className="btn-text">{loading ? 'Registering...' : 'Register'}</span>
                  <div className="magical-glow"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Submission Modal */}
      {showSubmissionModal && selectedHackathon && (
        <div className="modal-overlay">
          <div className="modal-content submission-modal">
            <div className="modal-header">
              <h3>🚀 Submit Your Project</h3>
              <button onClick={() => setShowSubmissionModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-section">
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">🚀</span>
                    Project Title *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={submissionForm.projectTitle}
                    onChange={(e) => setSubmissionForm(prev => ({...prev, projectTitle: e.target.value}))}
                    placeholder="Enter your project title"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">🔗</span>
                    GitHub Repository URL *
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    value={submissionForm.githubRepoUrl}
                    onChange={(e) => setSubmissionForm(prev => ({...prev, githubRepoUrl: e.target.value}))}
                    placeholder="https://github.com/username/project-repo"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">🌐</span>
                    Live Deployment URL (optional)
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    value={submissionForm.liveDeploymentUrl}
                    onChange={(e) => setSubmissionForm(prev => ({...prev, liveDeploymentUrl: e.target.value}))}
                    placeholder="https://your-project-demo.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">📝</span>
                    Project Description *
                  </label>
                  <textarea
                    className="form-textarea"
                    value={submissionForm.projectDescription}
                    onChange={(e) => setSubmissionForm(prev => ({...prev, projectDescription: e.target.value}))}
                    placeholder="Provide a detailed description of your project"
                    rows="4"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">⚙️</span>
                    Tech Stack Used
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={submissionForm.techStack}
                    onChange={(e) => setSubmissionForm(prev => ({...prev, techStack: e.target.value}))}
                    placeholder="e.g., React, Node.js, MongoDB"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">🚧</span>
                    Challenges Faced
                  </label>
                  <textarea
                    className="form-textarea"
                    value={submissionForm.challenges}
                    onChange={(e) => setSubmissionForm(prev => ({...prev, challenges: e.target.value}))}
                    placeholder="What challenges did you encounter?"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">🚀</span>
                    Future Improvements
                  </label>
                  <textarea
                    className="form-textarea"
                    value={submissionForm.futureImprovements}
                    onChange={(e) => setSubmissionForm(prev => ({...prev, futureImprovements: e.target.value}))}
                    placeholder="What would you improve given more time?"
                    rows="3"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button onClick={() => setShowSubmissionModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button onClick={handleProjectSubmission} className="submit-btn magical-btn" disabled={loading}>
                  <span className="btn-icon">🚀</span>
                  <span className="btn-text">{loading ? 'Submitting...' : 'Submit Project'}</span>
                  <div className="magical-glow"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Winner Selection Modal with Ranking */}
      {showWinnerSelection && selectedHackathon && (
        <div className="modal-overlay">
          <div className="modal-content winner-selection-modal">
            <div className="modal-header">
              <h3>🏆 Select Winners for {selectedHackathon.title}</h3>
              <button onClick={() => setShowWinnerSelection(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="winner-reward-info">
                <h4>🏆 Prize Distribution</h4>
                <div className="prizes-display">
                  <div className="prize-item">
                    <span className="prize-rank">🥇</span>
                    <span className="prize-amount">{selectedHackathon.rankingRewards?.first || selectedHackathon.auraReward}</span>
                    <span className="prize-label">AURA</span>
                  </div>
                  <div className="prize-item">
                    <span className="prize-rank">🥈</span>
                    <span className="prize-amount">{selectedHackathon.rankingRewards?.second || Math.floor(selectedHackathon.auraReward * 0.6)}</span>
                    <span className="prize-label">AURA</span>
                  </div>
                  <div className="prize-item">
                    <span className="prize-rank">🥉</span>
                    <span className="prize-amount">{selectedHackathon.rankingRewards?.third || Math.floor(selectedHackathon.auraReward * 0.3)}</span>
                    <span className="prize-label">AURA</span>
                  </div>
                </div>
              </div>
              
              <div className="participants-selection-list">
                <h4>👥 Registered Participants</h4>
                {(participants[selectedHackathon.id] || []).map((participant, index) => (
                  <div key={index} className="participant-selection-card">
                    <div className="participant-header">
                      <h5>{participant.participantName}</h5>
                      <span className="team-name">{participant.teamName}</span>
                    </div>
                    
                    <div className="participant-details">
                      <p><strong>Email:</strong> {participant.contactEmail}</p>
                      <p><strong>Wallet:</strong> {participant.walletAddress.slice(0, 6)}...{participant.walletAddress.slice(-4)}</p>
                      <p><strong>Experience:</strong> {participant.experienceLevel}</p>
                      {participant.projectIdea && (
                        <p><strong>Project Idea:</strong> {participant.projectIdea}</p>
                      )}
                    </div>
                    
                    <div className="participant-github-section">
                      <h6>🔗 GitHub Links:</h6>
                      <div className="github-links-grid">
                        <a 
                          href={participant.githubProfileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="github-link profile-link"
                        >
                          👤 View Profile
                        </a>
                        <a 
                          href={participant.githubProjectUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="github-link project-link"
                        >
                          📁 View Project
                        </a>
                      </div>
                      {participant.linkedinProfile && (
                        <a 
                          href={participant.linkedinProfile} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="social-link linkedin-link"
                        >
                          💼 LinkedIn
                        </a>
                      )}
                      {participant.portfolio && (
                        <a 
                          href={participant.portfolio} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="social-link portfolio-link"
                        >
                          🌐 Portfolio
                        </a>
                      )}
                    </div>
                    
                    {/* Ranking selection buttons */}
                    <div className="ranking-selection">
                      <h6>Select as Winner:</h6>
                      <div className="ranking-buttons">
                        <button 
                          onClick={() => handleRankedWinnerSelection(participant.walletAddress, participant.participantName, 'first')}
                          className="rank-btn first-place-btn"
                          disabled={loading}
                        >
                          🥇 1st Place
                        </button>
                        <button 
                          onClick={() => handleRankedWinnerSelection(participant.walletAddress, participant.participantName, 'second')}
                          className="rank-btn second-place-btn"
                          disabled={loading}
                        >
                          🥈 2nd Place
                        </button>
                        <button 
                          onClick={() => handleRankedWinnerSelection(participant.walletAddress, participant.participantName, 'third')}
                          className="rank-btn third-place-btn"
                          disabled={loading}
                        >
                          🥉 3rd Place
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AURA Redemption Modal */}
      {showAuraRedemption && (
        <div className="modal-overlay">
          <div className="modal-content aura-redemption-modal">
            <div className="modal-header">
              <h3>💰 Redeem AURA Coins for ETH</h3>
              <button onClick={() => setShowAuraRedemption(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="aura-balance-info">
                <div className="balance-card">
                  <span className="balance-label">Your AURA Balance:</span>
                  <span className="balance-value">{userAuraBalance.balance} 🌟</span>
                </div>
                <div className="rate-card">
                  <span className="rate-label">Conversion Rate:</span>
                  <span className="rate-value">{auraConversionRate} AURA = 1 ETH</span>
                </div>
              </div>
              
              <div className="redemption-input">
                <label>AURA Coins to Redeem:</label>
                <input
                  type="number"
                  value={auraToRedeem}
                  onChange={(e) => setAuraToRedeem(e.target.value)}
                  min={auraConversionRate}
                  max={userAuraBalance.balance}
                  placeholder={`Minimum ${auraConversionRate} AURA`}
                />
                <small className="conversion-preview">
                  Will receive: {auraToRedeem ? (auraToRedeem / auraConversionRate).toFixed(4) : '0'} ETH
                </small>
              </div>
              
              <div className="modal-actions">
                <button onClick={() => setShowAuraRedemption(false)} className="cancel-btn">
                  Cancel
                </button>
                <button 
                  onClick={handleAuraRedemption} 
                  className="redeem-btn magical-btn"
                  disabled={!auraToRedeem || auraToRedeem < auraConversionRate || loading}
                >
                  <span className="btn-text">{loading ? 'Redeeming...' : '💰 Redeem AURA'}</span>
                  <div className="magical-glow"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hackathon;
