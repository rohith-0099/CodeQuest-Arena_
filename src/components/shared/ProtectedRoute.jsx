// src/components/shared/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
// import { useAuth } from '../../hooks/useAuth'; // Uncomment when useAuth hook is implemented

function ProtectedRoute({ children }) {
  // --- Placeholder for Authentication Logic ---
  // For now, we'll simulate an authenticated user.
  // In a real app, you'd use a hook like useAuth() to check if the user is logged in.
  const isAuthenticated = true; // Replace with actual authentication check (e.g., from Firebase Auth)
  // const { currentUser, loading } = useAuth(); // Example of using a real auth hook

  // if (loading) {
  //   return <div>Loading authentication...</div>; // Or a loading spinner
  // }

  if (!isAuthenticated) { // Change to !currentUser for real auth
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
