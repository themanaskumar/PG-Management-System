import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './Pages/Login';
import AdminDashboard from './Pages/AdminDashboard';
import TenantDashboard from './Pages/TenantDashboard';
import { useAuth } from './context/AuthContext';

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
  // If not logged in OR not an admin, kick them out
  if (!user || !user.isAdmin) {
    return <Navigate to="/login" />;
  }
  return children;
};

// --- MAIN APP ---

function App() {
  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
      <Toaster position="top-right" />
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

        {/* ADMIN ROUTE (Note: Changed from /admin to /admin-dashboard) */}
        <Route path="/admin-dashboard" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

export default App;