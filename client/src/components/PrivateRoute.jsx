import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Adjust path on Tuesday

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && !user.isAdmin) {
    return <Navigate to="/" />; // Or unauthorized page
  }

  return children;
};

export default PrivateRoute;