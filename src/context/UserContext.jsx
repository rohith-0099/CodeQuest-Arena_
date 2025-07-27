import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export const useUser = () => {
  return useContext(UserContext);
};

export const UserProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [points, setPoints] = useState(0);
  const [badges, setBadges] = useState([]);

  const value = {
    userProfile,
    setUserProfile,
    points,
    setPoints,
    badges,
    setBadges
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
