import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../service/firebase'; // Adjust path if needed
import { 
  doc, 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  getDoc,
  setDoc,
  query,
  where,
  limit,
  arrayUnion,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './Ideathon.css';

const Ideathon = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [currentView, setCurrentView] = useState('main'); // main, host, join, manage, submit
  const [ideathons, setIdeathons] = useState([]);
  const [selectedIdeathon, setSelectedIdeathon] = useState(null);
  const [registeredIdeathon, setRegisteredIdeathon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [userPoints, setUserPoints] = useState(0);

  // Host Ideathon Form State
  const [hostForm, setHostForm] = useState({
    title: '',
    description: '',
    theme: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    submissionDeadline: '',
    maxParticipants: '',
    eligibilityCriteria: '',
    prizes: {
      first: { amount: '', description: '' },
      second: { amount: '', description: '' },
      third: { amount: '', description: '' }
    },
    winnerCount: 3,
    judgesCriteria: '',
    documentRequirements: []
  });

  // Join Ideathon Form State
  const [joinForm, setJoinForm] = useState({
    participantName: '',
    email: '',
    college: '',
    phone: '',
    experience: '',
    motivation: ''
  });

  // Submit Document Form State
  const [submitForm, setSubmitForm] = useState({
    ideaTitle: '',
    ideaDescription: '',
    problemStatement: '',
    solution: '',
    targetAudience: '',
    businessModel: '',
    implementation: '',
    documents: [],
    additionalNotes: ''
  });

  // Manage Ideathon State
  const [managedIdeathon, setManagedIdeathon] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [winners, setWinners] = useState({ first: null, second: null, third: null });

  // Enhanced user authentication with profile creation
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      console.log('Auth state changed:', currentUser);
      
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserProfile(userData);
            setUserPoints(userData.points || 0);
            console.log('✅ User profile loaded:', userData);
          } else {
            console.log('❌ User profile not found, creating one...');
            // Create user profile if it doesn't exist
            const newUserData = {
              name: currentUser.displayName || currentUser.email.split('@')[0] || 'User',
              email: currentUser.email,
              points: 0,
              createdAt: new Date(),
              college: 'Not specified',
              streak: 0,
              badges: 0
            };
            
            await setDoc(doc(db, 'users', currentUser.uid), newUserData);
            setUserProfile(newUserData);
            console.log('✅ User profile created');
          }
        } catch (error) {
          console.error('❌ Error with user profile:', error);
          // Continue anyway with basic user info
          setUserProfile({
            name: currentUser.displayName || currentUser.email.split('@')[0] || 'User',
            email: currentUser.email,
            points: 0
          });
        }
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (currentView === 'join') {
      fetchIdeathons();
    }
  }, [currentView]);

  // Check Firebase connection
  const checkFirebaseConnection = async () => {
    try {
      const testQuery = query(collection(db, 'ideathons'), limit(1));
      await getDocs(testQuery);
      console.log('✅ Firebase connection working');
      return true;
    } catch (error) {
      console.error('❌ Firebase connection failed:', error);
      alert('❌ Connection error. Please check your internet and try again.');
      return false;
    }
  };

  const fetchIdeathons = async () => {
    try {
      setLoading(true);
      const ideathonsRef = collection(db, 'ideathons');
      const snapshot = await getDocs(ideathonsRef);
      const ideathonsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter active ideathons (registration still open)
      const activeIdeathons = ideathonsList.filter(ideathon => {
        if (!ideathon.registrationDeadline) return false;
        const deadline = new Date(ideathon.registrationDeadline);
        return deadline > new Date();
      });
      
      setIdeathons(activeIdeathons);
    } catch (error) {
      console.error('Error fetching ideathons:', error);
      alert('❌ Error loading ideathons. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchManagedIdeathon = async (ideathonId) => {
    try {
      setLoading(true);
      const ideathonDoc = await getDoc(doc(db, 'ideathons', ideathonId));
      if (ideathonDoc.exists()) {
        const ideathonData = { id: ideathonDoc.id, ...ideathonDoc.data() };
        setManagedIdeathon(ideathonData);
        setParticipants(ideathonData.participants || []);
        setSubmissions(ideathonData.submissions || []);
        setWinners(ideathonData.winners || { first: null, second: null, third: null });
      }
    } catch (error) {
      console.error('Error fetching managed ideathon:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHostSubmit = async (e) => {
    e.preventDefault();
    if (!user || !userProfile) {
      alert('Please wait for user profile to load');
      return;
    }

    // Validation
    if (!hostForm.title.trim() || !hostForm.description.trim() || !hostForm.theme.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const ideathonData = {
        ...hostForm,
        hostId: user.uid,
        hostName: userProfile.name,
        createdAt: serverTimestamp(),
        status: 'active',
        participants: [],
        submissions: [],
        winners: { first: null, second: null, third: null }
      };

      const docRef = await addDoc(collection(db, 'ideathons'), ideathonData);
      alert('🎉 Ideathon created successfully!');
      
      // Reset form
      setHostForm({
        title: '',
        description: '',
        theme: '',
        startDate: '',
        endDate: '',
        registrationDeadline: '',
        submissionDeadline: '',
        maxParticipants: '',
        eligibilityCriteria: '',
        prizes: {
          first: { amount: '', description: '' },
          second: { amount: '', description: '' },
          third: { amount: '', description: '' }
        },
        winnerCount: 3,
        judgesCriteria: '',
        documentRequirements: []
      });
      
      await fetchManagedIdeathon(docRef.id);
      setCurrentView('manage');
    } catch (error) {
      console.error('Error creating ideathon:', error);
      alert('Error creating ideathon: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Enhanced ideathon registration with corrected timestamp handling
  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== IDEATHON REGISTRATION DEBUG ===');
    console.log('User:', user);
    console.log('User Profile:', userProfile);
    console.log('Selected Ideathon:', selectedIdeathon);
    console.log('Join Form Data:', joinForm);

    if (!user || !userProfile) {
      alert('❌ Please wait for user profile to load');
      return;
    }

    if (!selectedIdeathon) {
      alert('❌ Please select an ideathon first');
      return;
    }

    // Enhanced validation
    const errors = [];
    if (!joinForm.participantName.trim()) errors.push('Participant name is required');
    if (!joinForm.email.trim()) errors.push('Email is required');
    if (!joinForm.college.trim()) errors.push('College/Organization is required');
    if (!joinForm.motivation.trim()) errors.push('Motivation is required');
    
    // Email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (joinForm.email.trim() && !emailPattern.test(joinForm.email)) {
      errors.push('Please enter a valid email address');
    }

    if (errors.length > 0) {
      alert('❌ Please fix the following errors:\n' + errors.join('\n'));
      return;
    }

    // Check Firebase connection
    const isConnected = await checkFirebaseConnection();
    if (!isConnected) return;

    try {
      setLoading(true);
      console.log('Starting ideathon registration...');

      // Check if ideathon still exists
      const ideathonDoc = await getDoc(doc(db, 'ideathons', selectedIdeathon.id));
      if (!ideathonDoc.exists()) {
        alert('❌ Ideathon not found. Please refresh and try again.');
        return;
      }

      const ideathonData = ideathonDoc.data();
      
      // Check if user already registered
      const isAlreadyRegistered = ideathonData.participants?.some(p => p.userId === user.uid);
      if (isAlreadyRegistered) {
        alert('❌ You are already registered for this ideathon!');
        return;
      }

      // ✅ FIXED: Use new Date() instead of serverTimestamp() for arrayUnion
      const participantData = {
        userId: user.uid,
        participantName: joinForm.participantName.trim(),
        email: joinForm.email.trim(),
        college: joinForm.college.trim(),
        phone: joinForm.phone.trim(),
        experience: joinForm.experience.trim(),
        motivation: joinForm.motivation.trim(),
        registeredAt: new Date(), // ✅ Changed from serverTimestamp()
        status: 'registered',
        hasSubmitted: false
      };

      console.log('Participant data to be saved:', participantData);

      await updateDoc(doc(db, 'ideathons', selectedIdeathon.id), {
        participants: arrayUnion(participantData)
      });

      console.log('✅ Registration successful!');
      alert('🎉 Successfully registered for the ideathon!');
      setRegisteredIdeathon(selectedIdeathon);
      
      // Reset form
      setJoinForm({
        participantName: '',
        email: '',
        college: '',
        phone: '',
        experience: '',
        motivation: ''
      });
      
      setCurrentView('submit');
      
    } catch (error) {
      console.error('❌ Registration error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Provide specific error messages
      let errorMessage = '❌ Registration failed. ';
      
      if (error.code === 'permission-denied') {
        errorMessage += 'You don\'t have permission. Please check your login status.';
      } else if (error.code === 'not-found') {
        errorMessage += 'Ideathon not found. Please refresh and try again.';
      } else if (error.code === 'unavailable') {
        errorMessage += 'Service temporarily unavailable. Please try again later.';
      } else if (error.message.includes('network')) {
        errorMessage += 'Network error. Please check your internet connection.';
      } else if (error.message.includes('quota')) {
        errorMessage += 'Service quota exceeded. Please try again later.';
      } else {
        errorMessage += `Error: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files) => {
    const uploadedFiles = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // File size validation (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        continue;
      }
      
      const fileRef = ref(storage, `ideathon-documents/${Date.now()}_${file.name}`);
      
      try {
        setUploadProgress((i + 1) / files.length * 100);
        const snapshot = await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        uploadedFiles.push({
          name: file.name,
          url: downloadURL,
          type: file.type,
          size: file.size
        });
      } catch (error) {
        console.error('Error uploading file:', error);
        alert(`Error uploading ${file.name}. Please try again.`);
      }
    }
    
    setUploadProgress(0);
    return uploadedFiles;
  };

  // ✅ FIXED: Enhanced document submission with corrected timestamp handling
  const handleSubmitDocument = async (e) => {
    e.preventDefault();
    
    if (!user || !userProfile) {
      alert('❌ Please wait for user profile to load');
      return;
    }

    if (!registeredIdeathon) {
      alert('❌ Please register for an ideathon first');
      return;
    }

    // Enhanced validation
    const errors = [];
    if (!submitForm.ideaTitle.trim()) errors.push('Idea title is required');
    if (!submitForm.ideaDescription.trim()) errors.push('Idea description is required');
    if (!submitForm.problemStatement.trim()) errors.push('Problem statement is required');
    if (!submitForm.solution.trim()) errors.push('Proposed solution is required');

    if (errors.length > 0) {
      alert('❌ Please fix the following errors:\n' + errors.join('\n'));
      return;
    }

    try {
      setLoading(true);
      console.log('Starting idea submission...');
      
      // ✅ FIXED: Use new Date() instead of serverTimestamp() for arrayUnion
      const submissionData = {
        userId: user.uid,
        userName: userProfile.name,
        userEmail: user.email,
        ideaTitle: submitForm.ideaTitle.trim(),
        ideaDescription: submitForm.ideaDescription.trim(),
        problemStatement: submitForm.problemStatement.trim(),
        solution: submitForm.solution.trim(),
        targetAudience: submitForm.targetAudience.trim(),
        businessModel: submitForm.businessModel.trim(),
        implementation: submitForm.implementation.trim(),
        documents: submitForm.documents,
        additionalNotes: submitForm.additionalNotes.trim(),
        submittedAt: new Date(), // ✅ Changed from serverTimestamp()
        status: 'submitted'
      };

      console.log('Submission data to be saved:', submissionData);

      await updateDoc(doc(db, 'ideathons', registeredIdeathon.id), {
        submissions: arrayUnion(submissionData)
      });

      console.log('✅ Submission successful!');
      alert('🎉 Idea submitted successfully!');
      
      // Reset form
      setSubmitForm({
        ideaTitle: '',
        ideaDescription: '',
        problemStatement: '',
        solution: '',
        targetAudience: '',
        businessModel: '',
        implementation: '',
        documents: [],
        additionalNotes: ''
      });
      
      setCurrentView('main');
      
    } catch (error) {
      console.error('❌ Submission error:', error);
      alert('❌ Submission failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWinner = async (position, submissionIndex) => {
    if (!managedIdeathon || !submissions[submissionIndex]) return;

    try {
      setLoading(true);
      const submission = submissions[submissionIndex];
      const updatedWinners = { ...winners, [position]: submission };
      
      await updateDoc(doc(db, 'ideathons', managedIdeathon.id), {
        winners: updatedWinners
      });

      setWinners(updatedWinners);
      alert(`🏆 ${submission.userName} selected as ${position} place winner!`);
    } catch (error) {
      console.error('Error selecting winner:', error);
      alert('Error selecting winner: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset join form
  const resetJoinForm = () => {
    setJoinForm({
      participantName: '',
      email: '',
      college: '',
      phone: '',
      experience: '',
      motivation: ''
    });
    setSelectedIdeathon(null);
  };

  // Safe date formatting
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  // Loading component
  const LoadingSpinner = () => (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading...</p>
    </div>
  );

  const renderMainView = () => (
    <div className="ideathon-main">
      <div className="main-header">
        <h2>💡 Ideathon Arena</h2>
        <p>Transform your innovative ideas into reality!</p>
      </div>

      <div className="action-cards">
        <div className="action-card host-card" onClick={() => setCurrentView('host')}>
          <div className="card-icon">🎯</div>
          <h3>Host Ideathon</h3>
          <p>Create and manage your own ideathon competition</p>
          <div className="card-features">
            <span>• Set themes & criteria</span>
            <span>• Manage submissions</span>
            <span>• Select winners</span>
          </div>
        </div>

        <div className="action-card join-card" onClick={() => setCurrentView('join')}>
          <div className="card-icon">🚀</div>
          <h3>Join Ideathon</h3>
          <p>Participate in exciting idea competitions</p>
          <div className="card-features">
            <span>• Browse active events</span>
            <span>• Submit your ideas</span>
            <span>• Win amazing prizes</span>
          </div>
        </div>
      </div>

      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-number">{ideathons.length}</div>
          <div className="stat-label">Active Ideathons</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{userPoints}</div>
          <div className="stat-label">Your Points</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">₹75K</div>
          <div className="stat-label">Prize Pool</div>
        </div>
      </div>
    </div>
  );

  const renderHostView = () => (
    <div className="host-ideathon">
      <div className="host-header">
        <button onClick={() => setCurrentView('main')} className="back-btn">
          ← Back
        </button>
        <h2>🎯 Host New Ideathon</h2>
      </div>

      <form onSubmit={handleHostSubmit} className="host-form">
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Ideathon Title *</label>
              <input
                type="text"
                value={hostForm.title}
                onChange={(e) => setHostForm(prev => ({...prev, title: e.target.value}))}
                required
                placeholder="Enter ideathon title"
              />
            </div>
            <div className="form-group">
              <label>Theme *</label>
              <input
                type="text"
                value={hostForm.theme}
                onChange={(e) => setHostForm(prev => ({...prev, theme: e.target.value}))}
                required
                placeholder="e.g., Sustainability, FinTech, HealthTech"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              value={hostForm.description}
              onChange={(e) => setHostForm(prev => ({...prev, description: e.target.value}))}
              required
              placeholder="Describe your ideathon challenge..."
              rows="4"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Timeline</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Registration Deadline *</label>
              <input
                type="datetime-local"
                value={hostForm.registrationDeadline}
                onChange={(e) => setHostForm(prev => ({...prev, registrationDeadline: e.target.value}))}
                required
              />
            </div>
            <div className="form-group">
              <label>Submission Deadline *</label>
              <input
                type="datetime-local"
                value={hostForm.submissionDeadline}
                onChange={(e) => setHostForm(prev => ({...prev, submissionDeadline: e.target.value}))}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Date *</label>
              <input
                type="datetime-local"
                value={hostForm.startDate}
                onChange={(e) => setHostForm(prev => ({...prev, startDate: e.target.value}))}
                required
              />
            </div>
            <div className="form-group">
              <label>End Date *</label>
              <input
                type="datetime-local"
                value={hostForm.endDate}
                onChange={(e) => setHostForm(prev => ({...prev, endDate: e.target.value}))}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Participation Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Max Participants</label>
              <input
                type="number"
                value={hostForm.maxParticipants}
                onChange={(e) => setHostForm(prev => ({...prev, maxParticipants: e.target.value}))}
                placeholder="e.g., 100"
              />
            </div>
            <div className="form-group">
              <label>Number of Winners</label>
              <select
                value={hostForm.winnerCount}
                onChange={(e) => setHostForm(prev => ({...prev, winnerCount: parseInt(e.target.value)}))}
              >
                <option value={1}>1 Winner</option>
                <option value={2}>2 Winners</option>
                <option value={3}>3 Winners</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Eligibility Criteria</label>
            <textarea
              value={hostForm.eligibilityCriteria}
              onChange={(e) => setHostForm(prev => ({...prev, eligibilityCriteria: e.target.value}))}
              placeholder="Who can participate? (e.g., Students, Professionals, etc.)"
              rows="3"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Prizes</h3>
          {hostForm.winnerCount >= 1 && (
            <div className="prize-group">
              <h4>🥇 First Place</h4>
              <div className="form-row">
                <input
                  type="text"
                  value={hostForm.prizes.first.amount}
                  onChange={(e) => setHostForm(prev => ({
                    ...prev,
                    prizes: {
                      ...prev.prizes,
                      first: { ...prev.prizes.first, amount: e.target.value }
                    }
                  }))}
                  placeholder="Prize amount (e.g., ₹30,000)"
                />
                <input
                  type="text"
                  value={hostForm.prizes.first.description}
                  onChange={(e) => setHostForm(prev => ({
                    ...prev,
                    prizes: {
                      ...prev.prizes,
                      first: { ...prev.prizes.first, description: e.target.value }
                    }
                  }))}
                  placeholder="Additional benefits"
                />
              </div>
            </div>
          )}

          {hostForm.winnerCount >= 2 && (
            <div className="prize-group">
              <h4>🥈 Second Place</h4>
              <div className="form-row">
                <input
                  type="text"
                  value={hostForm.prizes.second.amount}
                  onChange={(e) => setHostForm(prev => ({
                    ...prev,
                    prizes: {
                      ...prev.prizes,
                      second: { ...prev.prizes.second, amount: e.target.value }
                    }
                  }))}
                  placeholder="Prize amount (e.g., ₹20,000)"
                />
                <input
                  type="text"
                  value={hostForm.prizes.second.description}
                  onChange={(e) => setHostForm(prev => ({
                    ...prev,
                    prizes: {
                      ...prev.prizes,
                      second: { ...prev.prizes.second, description: e.target.value }
                    }
                  }))}
                  placeholder="Additional benefits"
                />
              </div>
            </div>
          )}

          {hostForm.winnerCount >= 3 && (
            <div className="prize-group">
              <h4>🥉 Third Place</h4>
              <div className="form-row">
                <input
                  type="text"
                  value={hostForm.prizes.third.amount}
                  onChange={(e) => setHostForm(prev => ({
                    ...prev,
                    prizes: {
                      ...prev.prizes,
                      third: { ...prev.prizes.third, amount: e.target.value }
                    }
                  }))}
                  placeholder="Prize amount (e.g., ₹10,000)"
                />
                <input
                  type="text"
                  value={hostForm.prizes.third.description}
                  onChange={(e) => setHostForm(prev => ({
                    ...prev,
                    prizes: {
                      ...prev.prizes,
                      third: { ...prev.prizes.third, description: e.target.value }
                    }
                  }))}
                  placeholder="Additional benefits"
                />
              </div>
            </div>
          )}
        </div>

        <div className="form-section">
          <h3>Evaluation Criteria</h3>
          <div className="form-group">
            <label>Judging Criteria</label>
            <textarea
              value={hostForm.judgesCriteria}
              onChange={(e) => setHostForm(prev => ({...prev, judgesCriteria: e.target.value}))}
              placeholder="How will ideas be evaluated? (e.g., Innovation, Feasibility, Impact, Presentation)"
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>Document Requirements</label>
            <textarea
              value={hostForm.documentRequirements.join('\n')}
              onChange={(e) => setHostForm(prev => ({
                ...prev, 
                documentRequirements: e.target.value.split('\n').filter(req => req.trim())
              }))}
              placeholder="List required documents (one per line)&#10;e.g.:&#10;Project proposal (PDF)&#10;Market research document&#10;Prototype/mockups"
              rows="4"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => setCurrentView('main')} className="cancel-btn">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Creating...' : 'Create Ideathon 🚀'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderJoinView = () => (
    <div className="join-ideathon">
      <div className="join-header">
        <button onClick={() => setCurrentView('main')} className="back-btn">
          ← Back
        </button>
        <h2>🚀 Join Ideathon</h2>
      </div>

      {!selectedIdeathon ? (
        <div className="ideathons-list">
          <h3>Available Ideathons</h3>
          {loading ? (
            <LoadingSpinner />
          ) : ideathons.length > 0 ? (
            <div className="ideathons-grid">
              {ideathons.map((ideathon) => (
                <div
                  key={ideathon.id}
                  className="ideathon-card"
                  onClick={() => setSelectedIdeathon(ideathon)}
                >
                  <div className="ideathon-header">
                    <h4>{ideathon.title}</h4>
                    <div className="theme-badge">{ideathon.theme}</div>
                  </div>
                  <p className="ideathon-description">{ideathon.description}</p>
                  <div className="ideathon-meta">
                    <div className="meta-item">
                      <span className="meta-label">Registration Deadline:</span>
                      <span className="meta-value">{formatDate(ideathon.registrationDeadline)}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Submission Deadline:</span>
                      <span className="meta-value">{formatDate(ideathon.submissionDeadline)}</span>
                    </div>
                  </div>
                  <div className="prizes-preview">
                    <strong>Prizes:</strong>
                    {ideathon.prizes?.first?.amount && (
                      <span className="prize">🥇 {ideathon.prizes.first.amount}</span>
                    )}
                    {ideathon.prizes?.second?.amount && (
                      <span className="prize">🥈 {ideathon.prizes.second.amount}</span>
                    )}
                    {ideathon.prizes?.third?.amount && (
                      <span className="prize">🥉 {ideathon.prizes.third.amount}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-ideathons">
              <p>No active ideathons available at the moment.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="registration-form">
          <div className="selected-ideathon">
            <h3>{selectedIdeathon.title}</h3>
            <button
              onClick={() => setSelectedIdeathon(null)}
              className="change-ideathon-btn"
            >
              Change Ideathon
            </button>
          </div>

          <form onSubmit={handleJoinSubmit} className="join-form">
            <div className="form-section">
              <h4>Personal Information</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={joinForm.participantName}
                    onChange={(e) => setJoinForm(prev => ({...prev, participantName: e.target.value}))}
                    required
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={joinForm.email}
                    onChange={(e) => setJoinForm(prev => ({...prev, email: e.target.value}))}
                    required
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>College/Organization *</label>
                  <input
                    type="text"
                    value={joinForm.college}
                    onChange={(e) => setJoinForm(prev => ({...prev, college: e.target.value}))}
                    required
                    placeholder="Enter your college or organization"
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={joinForm.phone}
                    onChange={(e) => setJoinForm(prev => ({...prev, phone: e.target.value}))}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>Background Information</h4>
              <div className="form-group">
                <label>Relevant Experience</label>
                <textarea
                  value={joinForm.experience}
                  onChange={(e) => setJoinForm(prev => ({...prev, experience: e.target.value}))}
                  placeholder="Tell us about your relevant experience, skills, or previous projects..."
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Motivation *</label>
                <textarea
                  value={joinForm.motivation}
                  onChange={(e) => setJoinForm(prev => ({...prev, motivation: e.target.value}))}
                  required
                  placeholder="Why do you want to participate in this ideathon? What excites you about this theme?"
                  rows="4"
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => {
                  resetJoinForm();
                  setCurrentView('main');
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Registering...' : 'Register for Ideathon 🚀'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );

  const renderSubmitView = () => (
    <div className="submit-idea">
      <div className="submit-header">
        <button onClick={() => setCurrentView('main')} className="back-btn">
          ← Back to Dashboard
        </button>
        <h2>📄 Submit Your Idea</h2>
        {registeredIdeathon && (
          <div className="ideathon-info">
            <h3>{registeredIdeathon.title}</h3>
            <p>Submission Deadline: {formatDate(registeredIdeathon.submissionDeadline)}</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmitDocument} className="submit-form">
        <div className="form-section">
          <h4>Idea Overview</h4>
          <div className="form-group">
            <label>Idea Title *</label>
            <input
              type="text"
              value={submitForm.ideaTitle}
              onChange={(e) => setSubmitForm(prev => ({...prev, ideaTitle: e.target.value}))}
              required
              placeholder="Give your idea a compelling title"
            />
          </div>

          <div className="form-group">
            <label>Idea Description *</label>
            <textarea
              value={submitForm.ideaDescription}
              onChange={(e) => setSubmitForm(prev => ({...prev, ideaDescription: e.target.value}))}
              required
              placeholder="Provide a comprehensive description of your idea..."
              rows="5"
            />
          </div>
        </div>

        <div className="form-section">
          <h4>Problem & Solution</h4>
          <div className="form-group">
            <label>Problem Statement *</label>
            <textarea
              value={submitForm.problemStatement}
              onChange={(e) => setSubmitForm(prev => ({...prev, problemStatement: e.target.value}))}
              required
              placeholder="What problem does your idea solve? Why is this problem important?"
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>Proposed Solution *</label>
            <textarea
              value={submitForm.solution}
              onChange={(e) => setSubmitForm(prev => ({...prev, solution: e.target.value}))}
              required
              placeholder="How does your idea solve the problem? What makes your solution unique?"
              rows="4"
            />
          </div>
        </div>

        <div className="form-section">
          <h4>Market & Implementation</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Target Audience</label>
              <textarea
                value={submitForm.targetAudience}
                onChange={(e) => setSubmitForm(prev => ({...prev, targetAudience: e.target.value}))}
                placeholder="Who would benefit from your idea? Define your target market..."
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Business Model</label>
              <textarea
                value={submitForm.businessModel}
                onChange={(e) => setSubmitForm(prev => ({...prev, businessModel: e.target.value}))}
                placeholder="How would you monetize this idea? What's your revenue model?"
                rows="3"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Implementation Plan</label>
            <textarea
              value={submitForm.implementation}
              onChange={(e) => setSubmitForm(prev => ({...prev, implementation: e.target.value}))}
              placeholder="How would you implement this idea? Timeline, resources needed, key milestones..."
              rows="4"
            />
          </div>
        </div>

        <div className="form-section">
          <h4>Supporting Documents</h4>
          <div className="file-upload-section">
            <div className="upload-info">
              <p>Upload supporting documents for your idea (optional but recommended):</p>
              <ul>
                <li>Detailed project proposal (PDF/DOC)</li>
                <li>Market research documents</li>
                <li>Mockups, wireframes, or prototypes</li>
                <li>Financial projections</li>
                <li>Any other relevant materials</li>
              </ul>
            </div>

            <div className="file-upload-area">
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.txt"
                onChange={async (e) => {
                  if (e.target.files.length > 0) {
                    setLoading(true);
                    try {
                      const uploadedFiles = await handleFileUpload(e.target.files);
                      setSubmitForm(prev => ({
                        ...prev,
                        documents: [...prev.documents, ...uploadedFiles]
                      }));
                    } catch (error) {
                      console.error('Error uploading files:', error);
                      alert('Error uploading files. Please try again.');
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
                className="file-input"
                id="document-upload"
              />
              <label htmlFor="document-upload" className="file-upload-label">
                <div className="upload-icon">📎</div>
                <div className="upload-text">
                  <strong>Click to upload documents</strong>
                  <p>or drag and drop files here</p>
                  <small>PDF, DOC, PPT, JPG, PNG (Max 10MB each)</small>
                </div>
              </label>
            </div>

            {uploadProgress > 0 && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <span>{Math.round(uploadProgress)}% uploaded</span>
              </div>
            )}

            {submitForm.documents.length > 0 && (
              <div className="uploaded-files">
                <h5>Uploaded Documents:</h5>
                {submitForm.documents.map((doc, index) => (
                  <div key={index} className="uploaded-file">
                    <span className="file-icon">📄</span>
                    <span className="file-name">{doc.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updatedDocs = submitForm.documents.filter((_, i) => i !== index);
                        setSubmitForm(prev => ({...prev, documents: updatedDocs}));
                      }}
                      className="remove-file-btn"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="form-section">
          <h4>Additional Information</h4>
          <div className="form-group">
            <label>Additional Notes</label>
            <textarea
              value={submitForm.additionalNotes}
              onChange={(e) => setSubmitForm(prev => ({...prev, additionalNotes: e.target.value}))}
              placeholder="Any additional information, references, or notes you'd like to include..."
              rows="3"
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => setCurrentView('main')}
            className="cancel-btn"
          >
            Save as Draft
          </button>
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Submitting...' : 'Submit Idea 🚀'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderManageView = () => (
    <div className="manage-ideathon">
      <div className="manage-header">
        <button onClick={() => setCurrentView('main')} className="back-btn">
          ← Back to Dashboard
        </button>
        <h2>🎯 Manage Ideathon</h2>
      </div>

      {managedIdeathon ? (
        <div className="management-content">
          <div className="ideathon-overview">
            <h3>{managedIdeathon.title}</h3>
            <div className="overview-stats">
              <div className="stat">
                <span className="stat-number">{participants.length}</span>
                <span className="stat-label">Participants</span>
              </div>
              <div className="stat">
                <span className="stat-number">{submissions.length}</span>
                <span className="stat-label">Submissions</span>
              </div>
              <div className="stat">
                <span className="stat-number">
                  {Object.values(winners).filter(w => w !== null).length}
                </span>
                <span className="stat-label">Winners Selected</span>
              </div>
            </div>
          </div>

          <div className="management-sections">
            <div className="participants-section">
              <h4>👥 Registered Participants</h4>
              {participants.length > 0 ? (
                <div className="participants-list">
                  {participants.map((participant, index) => (
                    <div key={index} className="participant-card">
                      <div className="participant-info">
                        <h5>{participant.participantName}</h5>
                        <p><strong>Email:</strong> {participant.email}</p>
                        <p><strong>College:</strong> {participant.college}</p>
                        <p><strong>Phone:</strong> {participant.phone}</p>
                        <div className="participant-details">
                          <div className="detail-section">
                            <strong>Experience:</strong>
                            <p className="detail-text">{participant.experience || 'Not provided'}</p>
                          </div>
                          <div className="detail-section">
                            <strong>Motivation:</strong>
                            <p className="detail-text">{participant.motivation}</p>
                          </div>
                        </div>
                        <div className="registration-date">
                          <small>Registered: {participant.registeredAt instanceof Date ? 
                            participant.registeredAt.toLocaleDateString() : 
                            formatDate(participant.registeredAt)}</small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-participants">
                  <p>No participants registered yet.</p>
                </div>
              )}
            </div>

            <div className="submissions-section">
              <h4>📄 Idea Submissions</h4>
              {submissions.length > 0 ? (
                <div className="submissions-list">
                  {submissions.map((submission, index) => (
                    <div key={index} className="submission-card">
                      <div className="submission-info">
                        <h5>{submission.ideaTitle}</h5>
                        <p><strong>Submitted by:</strong> {submission.userName}</p>
                        <p className="submission-description">{submission.ideaDescription}</p>
                        
                        <div className="submission-details">
                          <div className="detail-section">
                            <strong>Problem Statement:</strong>
                            <p className="detail-text">{submission.problemStatement}</p>
                          </div>
                          
                          <div className="detail-section">
                            <strong>Proposed Solution:</strong>
                            <p className="detail-text">{submission.solution}</p>
                          </div>
                          
                          {submission.targetAudience && (
                            <div className="detail-section">
                              <strong>Target Audience:</strong>
                              <p className="detail-text">{submission.targetAudience}</p>
                            </div>
                          )}
                          
                          {submission.businessModel && (
                            <div className="detail-section">
                              <strong>Business Model:</strong>
                              <p className="detail-text">{submission.businessModel}</p>
                            </div>
                          )}
                          
                          {submission.implementation && (
                            <div className="detail-section">
                              <strong>Implementation Plan:</strong>
                              <p className="detail-text">{submission.implementation}</p>
                            </div>
                          )}
                        </div>

                        {submission.documents && submission.documents.length > 0 && (
                          <div className="submission-documents">
                            <strong>Supporting Documents:</strong>
                            <div className="documents-list">
                              {submission.documents.map((doc, docIndex) => (
                                <a
                                  key={docIndex}
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="document-link"
                                >
                                  📄 {doc.name}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {submission.additionalNotes && (
                          <div className="detail-section">
                            <strong>Additional Notes:</strong>
                            <p className="detail-text">{submission.additionalNotes}</p>
                          </div>
                        )}

                        <div className="submission-date">
                          <small>Submitted: {submission.submittedAt instanceof Date ? 
                            submission.submittedAt.toLocaleDateString() : 
                            formatDate(submission.submittedAt)}</small>
                        </div>
                      </div>
                      
                      <div className="winner-selection">
                        <h6>Select as Winner:</h6>
                        <div className="winner-buttons">
                          {managedIdeathon.winnerCount >= 1 && (
                            <button
                              onClick={() => handleSelectWinner('first', index)}
                              className={`winner-btn first ${winners.first?.userId === submission.userId ? 'selected' : ''}`}
                              disabled={winners.first?.userId === submission.userId}
                            >
                              🥇 1st Place
                            </button>
                          )}
                          {managedIdeathon.winnerCount >= 2 && (
                            <button
                              onClick={() => handleSelectWinner('second', index)}
                              className={`winner-btn second ${winners.second?.userId === submission.userId ? 'selected' : ''}`}
                              disabled={winners.second?.userId === submission.userId}
                            >
                              🥈 2nd Place
                            </button>
                          )}
                          {managedIdeathon.winnerCount >= 3 && (
                            <button
                              onClick={() => handleSelectWinner('third', index)}
                              className={`winner-btn third ${winners.third?.userId === submission.userId ? 'selected' : ''}`}
                              disabled={winners.third?.userId === submission.userId}
                            >
                              🥉 3rd Place
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-submissions">
                  <p>No idea submissions yet.</p>
                </div>
              )}
            </div>

            <div className="winners-section">
              <h4>🏆 Selected Winners</h4>
              <div className="winners-list">
                {Object.entries(winners).map(([position, winner]) => (
                  <div key={position} className={`winner-card ${position}`}>
                    <div className="winner-position">
                      {position === 'first' && '🥇 First Place'}
                      {position === 'second' && '🥈 Second Place'}
                      {position === 'third' && '🥉 Third Place'}
                    </div>
                    {winner ? (
                      <div className="winner-details">
                        <h5>{winner.ideaTitle}</h5>
                        <p><strong>Winner:</strong> {winner.userName}</p>
                        <p><strong>Email:</strong> {winner.userEmail}</p>
                        <p><strong>Prize:</strong> {managedIdeathon.prizes?.[position]?.amount || 'TBD'}</p>
                        <p className="winner-idea">{winner.ideaDescription}</p>
                      </div>
                    ) : (
                      <div className="no-winner">
                        <p>No winner selected yet</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <LoadingSpinner />
      )}
    </div>
  );

  return (
    <div className="ideathon-arena">
      {/* Header */}
      <header className="ideathon-header">
        <div className="header-content">
          <div className="header-left">
            <button onClick={() => navigate('/dashboard')} className="back-btn">
              ← Back to Arena
            </button>
            <div className="title-section">
              <h1>💡 Ideathon Arena</h1>
              <p>Transform ideas into reality through innovation</p>
            </div>
          </div>
          <div className="header-right">
            <div className="user-stats">
              <div className="stat-item">
                <span className="stat-icon">🏆</span>
                <span className="stat-value">{userPoints}</span>
                <span className="stat-label">Points</span>
              </div>
              <div className="user-avatar">
                <img 
                  src={user?.photoURL || `https://ui-avatars.com/api/?name=${userProfile?.name || 'User'}&background=ec4899&color=fff`}
                  alt="User" 
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="ideathon-content">
        {currentView === 'main' && renderMainView()}
        {currentView === 'host' && renderHostView()}
        {currentView === 'join' && renderJoinView()}
        {currentView === 'submit' && renderSubmitView()}
        {currentView === 'manage' && renderManageView()}
      </main>

      {/* Loading overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Processing...</p>
        </div>
      )}
    </div>
  );
};

export default Ideathon;
