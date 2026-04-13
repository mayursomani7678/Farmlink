import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { FPODashboard, FarmerManagement } from './pages/FPOPages';
import { BuyerDashboard, BuyerMarketplace, ProductDetails } from './pages/BuyerPages';
import { Dashboard } from './pages/Dashboard';
import { FarmerTransparency, PriceComparison } from './components/Transparency';
import { BackgroundVideo } from './components/BackgroundVideo';
import './styles/Global.css';
import './styles/BackgroundVideo.css';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.userType)) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <BackgroundVideo />
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* FPO Routes */}
          <Route
            path="/fpo/dashboard"
            element={
              <ProtectedRoute allowedRoles={['fpo']}>
                <FPODashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fpo/farmers"
            element={
              <ProtectedRoute allowedRoles={['fpo']}>
                <FarmerManagement />
              </ProtectedRoute>
            }
          />

          {/* Buyer Routes */}
          <Route
            path="/buyer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['buyer']}>
                <BuyerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/marketplace"
            element={
              <ProtectedRoute allowedRoles={['buyer']}>
                <BuyerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/product/:listingId"
            element={
              <ProtectedRoute allowedRoles={['buyer']}>
                <ProductDetails listingId={window.location.pathname.split('/').pop()} />
              </ProtectedRoute>
            }
          />

          {/* Farmer Transparency Routes */}
          <Route
            path="/farmer/transparency"
            element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <FarmerTransparency farmerId={localStorage.getItem('userId')} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/prices"
            element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <PriceComparison farmerId={localStorage.getItem('userId')} />
              </ProtectedRoute>
            }
          />

          {/* Dashboard Route - Accessible to both FPO and Buyer */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['fpo', 'buyer']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
