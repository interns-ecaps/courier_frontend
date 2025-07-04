// src/routes/PrivateRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';
import GlobalLayout from '../layouts/globalLayout';

const PrivateRoute = ({ children }) => {
  return isAuthenticated() ?  <GlobalLayout>{children}</GlobalLayout> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
