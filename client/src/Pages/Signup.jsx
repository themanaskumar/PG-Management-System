import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/axiosInstance';
import toast from 'react-hot-toast';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    roomNo: '',
    deposit: '',
    idType: 'aadhar',
    idNumber: ''
  });
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Register the user
      const { data } = await api.post('/auth/signup', formData);
      
      // Auto-login after signup
      login(data, data.token);
      toast.success('Account Created!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Signup Failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-50 py-10">
      <form onSubmit={handleSubmit} className="p-8 bg-white rounded shadow-md w-96">
        <h2 className="mb-6 text-2xl font-bold text-center text-blue-600">Tenant Registration</h2>
        
        <input name="name" placeholder="Full Name" onChange={handleChange} className="w-full p-2 mb-3 border rounded" required />
        <input name="email" type="email" placeholder="Email" onChange={handleChange} className="w-full p-2 mb-3 border rounded" required />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} className="w-full p-2 mb-3 border rounded" required />
        <input name="phone" placeholder="Phone Number" onChange={handleChange} className="w-full p-2 mb-3 border rounded" required />
        
        <div className="flex gap-2 mb-3">
            <input name="roomNo" placeholder="Room No" onChange={handleChange} className="w-1/2 p-2 border rounded" required />
            <input name="deposit" type="number" placeholder="Deposit (₹)" onChange={handleChange} className="w-1/2 p-2 border rounded" required />
        </div>
        
        <div className="flex gap-2 mb-3">
          <select name="idType" onChange={handleChange} className="p-2 border rounded w-1/3">
            <option value="aadhar">Aadhar</option>
            <option value="pan">PAN</option>
            <option value="voter">Voter ID</option>
          </select>
          <input name="idNumber" placeholder="ID Number" onChange={handleChange} className="p-2 border rounded w-2/3" required />
        </div>

        <button className="w-full p-2 text-white bg-blue-600 rounded hover:bg-blue-700">Sign Up</button>
        <p className="mt-4 text-center text-sm">
          Already have an account? <Link to="/login" className="text-blue-500">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default Signup;