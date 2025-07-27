// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/shared/Header/Header';
import WelcomePage from './components/WelcomePage/WelcomePage';
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import CodeNinja from './components/CodeNinja/CodeNinja';
import QuizArena from './components/QuizArena/QuizArena';
import Hackathon from './components/Hackathon/Hackathon';
import Ideathon from './components/Ideathon/Ideathon';
import Activities from './components/Activities/Activities';
import Events from './components/Events/Events';
import Profile from './components/Profile/Profile';
import Leaderboard from './components/Leaderboard/Leaderboard';
import ProtectedRoute from './components/shared/ProtectedRoute';

// Corrected imports for context files
import { AuthProvider } from './context/AuthContext.jsx';
import { UserProvider } from './context/UserContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx'; // Make sure this is imported if you're using it

import './App.css'; // Specific styles for App layout, if any
import './styles/globals.css'; // Global styles

function App() {
  return (
    <Router>
      {/* Wrap your entire application with AuthProvider and other contexts */}
      <AuthProvider>
        <UserProvider>
          <ThemeProvider> {/* Add ThemeProvider if you've created it */}
            <div className="App">
              <Routes>
                <Route path="/" element={<WelcomePage />} />
                <Route path="/login" element={<Login />} />
                {/* Protected Routes */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/code-ninja" element={<CodeNinja />} />
                <Route path="/quiz" element={<QuizArena />} /> {/* Add this route */}
                <Route path="/hackathon" element={<Hackathon />} /> {/* Add this route */}
                <Route path="/ideathon" element={<Ideathon />} /> {/* Add this route */}
                <Route path="/activities" element={<ProtectedRoute><Activities /></ProtectedRoute>} />
                <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/leaderboard" element={<Leaderboard />} /> {/* Add this route */}
                {/* Add more nested routes or specific event/problem detail routes here later */}
              </Routes>
            </div>
          </ThemeProvider>
        </UserProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
