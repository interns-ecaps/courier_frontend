// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage/LandingPage';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import Dashboard from './pages/Dashboard/Dashboard';
import ShipmentList from './pages/shipments/ShipmentList'; // Add this line
import PrivateRoute from './routes/PrivateRoute';
import { ToastContainer } from 'react-toastify';
import CreateShipment from './pages/shipments/CreateShipment';
import ViewShipment from './pages/shipments/ViewShipment';
import EditShipment from './pages/shipments/EditShipment';

function App() {
  return (
    <>
      <ToastContainer />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/shipments"
          element={
            <PrivateRoute>
              <ShipmentList />
            </PrivateRoute>
          }
        />
        <Route
          path="/shipments/create"
          element={
            <PrivateRoute>
              <CreateShipment />
            </PrivateRoute>
          }
        />
        <Route
          path="/shipments/edit/:id"
          element={
            <PrivateRoute>
              <EditShipment />
            </PrivateRoute>
          }
        />
        <Route
          path="/shipments/:id"
          element={
            <PrivateRoute>
              <ViewShipment />
            </PrivateRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
