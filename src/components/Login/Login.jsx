import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from "../../service/firebase"; // Adjust path if needed


 // Adjust path if needed
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    college: '',
    district: '',
    state: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setMessage(''); // Clear messages when user types
  };

  // Save user data to Firebase database
  const saveUserData = async (user, userData) => {
    try {
      await setDoc(doc(db, 'users', user.uid), {
        name: userData.name || user.displayName || 'User',
        email: user.email,
        college: userData.college || 'Not specified',
        district: userData.district || 'Not specified',
        state: userData.state || 'Not specified',
        points: 0,
        badges: [],
        streak: 0,
        completedProblems: [],
        createdAt: new Date(),
        lastLogin: new Date()
      });
      console.log('✅ User data saved successfully!');
      return true;
    } catch (error) {
      console.error('❌ Error saving user data:', error);
      return false;
    }
  };

  // Handle form submission (Sign Up / Log In)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        // LOG IN existing user
        const result = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        setMessage('✅ Login successful! Redirecting...');
        console.log('User logged in:', result.user.email);
        
        // Update last login
        await setDoc(doc(db, 'users', result.user.uid), {
          lastLogin: new Date()
        }, { merge: true });
        
        setTimeout(() => navigate('/dashboard'), 1000);
        
      } else {
        // SIGN UP new user
        const result = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        console.log('New user created:', result.user.email);
        
        // Save user profile data
        const saved = await saveUserData(result.user, formData);
        
        if (saved) {
          setMessage('✅ Account created successfully! Redirecting...');
          setTimeout(() => navigate('/dashboard'), 1500);
        } else {
          setMessage('⚠️ Account created but profile data failed to save');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      
      // Show user-friendly error messages
      if (error.code === 'auth/email-already-in-use') {
        setMessage('❌ Email already registered. Try logging in instead.');
      } else if (error.code === 'auth/weak-password') {
        setMessage('❌ Password must be at least 6 characters.');
      } else if (error.code === 'auth/user-not-found') {
        setMessage('❌ No account found. Try signing up first.');
      } else if (error.code === 'auth/wrong-password') {
        setMessage('❌ Incorrect password.');
      } else {
        setMessage('❌ Error: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log('Google login successful:', result.user.email);
      
      // Check if user profile exists
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (!userDoc.exists()) {
        // New Google user - save their profile
        await saveUserData(result.user, {
          name: result.user.displayName,
          college: 'Google User',
          district: 'Not specified',
          state: 'Not specified'
        });
        setMessage('✅ Welcome! Profile created with Google.');
      } else {
        setMessage('✅ Welcome back!');
        // Update last login
        await setDoc(doc(db, 'users', result.user.uid), {
          lastLogin: new Date()
        }, { merge: true });
      }
      
      setTimeout(() => navigate('/dashboard'), 1000);
      
    } catch (error) {
      console.error('Google login error:', error);
      setMessage('❌ Google login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>{isLogin ? 'Welcome Back' : 'Join the Arena'}</h2>
          <p>{isLogin ? 'Continue your coding journey' : 'Start your quest today'}</p>
        </div>

        {/* Show messages */}
        {message && (
          <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="google-login">
          <button 
            className="google-btn" 
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <span className="google-icon">🔍</span>
            {loading ? 'Connecting...' : 'Continue with Google'}
          </button>
        </div>

        <div className="divider">
          <span>or</span>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
          )}

          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Password (min 6 chars)"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength="6"
            />
          </div>

          {!isLogin && (
            <>
              <div className="form-group">
                <input
                  type="text"
                  name="college"
                  placeholder="College/University"
                  value={formData.college}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <input
                    type="text"
                    name="district"
                    placeholder="District"
                    value={formData.district}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    name="state"
                    placeholder="State"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </>
          )}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </form>

        <div className="toggle-form">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              className="toggle-btn" 
              onClick={() => setIsLogin(!isLogin)}
              disabled={loading}
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>

      <div className="login-background">
        <div className="floating-code">console.log('Hello World!');</div>
        <div className="floating-code">function solve(problem) { }</div>
        <div className="floating-code">
          while(learning) {"{"} code(); {"}"}
        </div>
      </div>
    </div>
  );
};


export default Login;
