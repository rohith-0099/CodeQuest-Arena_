// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css'; // Your global styles

// Import context providers with .jsx extension
import { AuthProvider } from './context/AuthContext.jsx';
import { UserProvider } from './context/UserContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx'; // Make sure this is imported if you're using it

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Wrap the App component with your context providers */}
    <AuthProvider>
      <UserProvider>
        <ThemeProvider> {/* Add ThemeProvider here if you've created it */}
          <App />
        </ThemeProvider>
      </UserProvider>
    </AuthProvider>
  </React.StrictMode>
);
