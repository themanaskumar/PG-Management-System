import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Signup from './Pages/Signup.jsx';
import AdminDashboard from './pages/AdminDashboard';
import TenantDashboard from './pages/TenantDashboard';
import PrivateRoute from './components/PrivateRoute'; // Ensure this matches your folder
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
        <Route path="/signup" element={<Signup />} />
        
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
      </Routes>
    </div>
  );
}

export default App;