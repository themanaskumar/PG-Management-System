import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TenantDashboard from './pages/TenantDashboard';
import { useAuth } from './context/AuthContext';
import Footer from './components/Footer'; // <--- 1. IMPORT FOOTER

// --- INLINE PROTECTION COMPONENTS ---

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user || !user.isAdmin) {
    return <Navigate to="/login" />;
  }
  return children;
};

// --- MAIN APP ---

function App() {
  return (
    // 2. UPDATED CLASS: added 'flex flex-col'
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 flex flex-col">
      <Toaster position="top-right" />
      
      {/* 3. WRAPPER: added flex-grow to push footer down */}
      <div className="flex-grow flex flex-col">
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Default Route: Redirect to Login */}
          <Route path="/" element={<Navigate to="/login" />} />

          {/* TENANT ROUTE */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <TenantDashboard />
            </ProtectedRoute>
          } />

          {/* ADMIN ROUTE */}
          <Route path="/admin-dashboard" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>

      {/* 4. FOOTER COMPONENT */}
      <Footer />
      
    </div>
  );
}

export default App;