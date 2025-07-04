// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/panels/LandingPage/LandingPage';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import Dashboard from './pages/panels/Dashboard/Dashboard';
import ShipmentList from './pages/panels/shipments/page'; // existing
import PrivateRoute from './routes/PrivateRoute';
import { ToastContainer } from 'react-toastify';
import CreateShipment from './pages/panels/shipments/CreateShipment';
import ViewShipment from './pages/panels/shipments/ViewShipment';
import EditShipment from './pages/panels/shipments/EditShipment';

// Import your Settings component here:
import Settings from './pages/panels/Settings/settings.jsx';

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
          path="/shipments/:shipmentId"
          element={
            <PrivateRoute>
              <ViewShipment />
            </PrivateRoute>
          }
        />
        {/* Add Settings Route here */}
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;