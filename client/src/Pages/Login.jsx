import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom'; // Removed 'Link' import
import api from '../utils/axiosInstance';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data, data.token);
      toast.success('Login Successful');
      navigate(data.isAdmin ? '/admin' : '/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login Failed');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <form onSubmit={handleSubmit} className="p-8 bg-white rounded-xl shadow-lg w-96 border border-gray-100">
        <h2 className="mb-2 text-2xl font-bold text-center text-blue-800">Welcome Back</h2>
        <p className="mb-8 text-center text-gray-500 text-sm">PG Management Portal</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="admin@pg.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>
        </div>

        <button className="w-full mt-6 p-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-bold transition-colors shadow-md">
          Login
        </button>
        
        {/* Sign Up Link REMOVED */}
        <p className="mt-4 text-center text-xs text-gray-400">
          Contact Admin for credentials.
        </p>
      </form>
    </div>
  );
};

export default Login;