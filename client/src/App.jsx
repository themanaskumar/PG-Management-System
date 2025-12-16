import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './Pages/Login';
// import Signup from './pages/Signup';  <-- DELETED THIS LINE
import AdminDashboard from './Pages/AdminDashboard';
import TenantDashboard from './Pages/TenantDashboard';
import PrivateRoute from './components/PrivateRoute';
import { useAuth } from './context/AuthContext';

const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return user.isAdmin ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Redirect root based on role */}
        <Route path="/" element={<HomeRedirect />} />

        {/* Protected Tenant Routes */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <TenantDashboard />
          </PrivateRoute>
        } />

        {/* Protected Admin Routes */}
        <Route path="/admin" element={
          <PrivateRoute adminOnly={true}>
            <AdminDashboard />
          </PrivateRoute>
        } />
        
        {/* Catch-all: Redirect unknown routes to login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

export default App;