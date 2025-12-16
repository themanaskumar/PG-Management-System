import { useEffect, useState } from 'react';
import api from '../utils/axiosInstance';
import DataTable from '../components/DataTable'; // Your Cheat Code
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TenantDashboard = () => {
  const { user, logout } = useAuth();
  const [rents, setRents] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [activeTab, setActiveTab] = useState('rent'); // 'rent' or 'complaint'

  // Form States
  const [rentData, setRentData] = useState({ month: '', year: new Date().getFullYear(), amount: '', proofUrl: '' });
  const [compData, setCompData] = useState({ title: '', description: '' });

  const fetchData = async () => {
    try {
      const rentRes = await api.get('/rent');
      const compRes = await api.get('/complaints');
      setRents(rentRes.data);
      setComplaints(compRes.data);
    } catch (err) {
      toast.error('Failed to load data');
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRentSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/rent', rentData);
      toast.success('Rent Proof Submitted!');
      fetchData(); // Refresh table
    } catch (err) { toast.error('Submission failed'); }
  };

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/complaints', compData);
      toast.success('Complaint Lodged!');
      fetchData(); 
    } catch (err) { toast.error('Failed to lodge complaint'); }
  };

  const rentColumns = [
    { key: 'month', label: 'Month' },
    { key: 'year', label: 'Year' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
  ];

  const compColumns = [
    { key: 'title', label: 'Issue' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Date' },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
        <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
      </div>

      <div className="flex gap-4 mb-6">
        <button onClick={() => setActiveTab('rent')} className={`px-4 py-2 rounded ${activeTab === 'rent' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>My Rents</button>
        <button onClick={() => setActiveTab('complaint')} className={`px-4 py-2 rounded ${activeTab === 'complaint' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>My Complaints</button>
      </div>

      {activeTab === 'rent' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 bg-white p-6 rounded shadow">
            <h3 className="text-xl font-bold mb-4">Submit Rent Proof</h3>
            <form onSubmit={handleRentSubmit} className="flex flex-col gap-3">
              <input type="text" placeholder="Month (e.g. December)" className="border p-2 rounded" onChange={e => setRentData({...rentData, month: e.target.value})} required />
              <input type="number" placeholder="Amount" className="border p-2 rounded" onChange={e => setRentData({...rentData, amount: e.target.value})} required />
              <input type="text" placeholder="Image URL (Drive/Imgur)" className="border p-2 rounded" onChange={e => setRentData({...rentData, proofUrl: e.target.value})} required />
              <button className="bg-green-600 text-white py-2 rounded">Submit</button>
            </form>
          </div>
          <div className="md:col-span-2">
            <DataTable columns={rentColumns} data={rents} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 bg-white p-6 rounded shadow">
            <h3 className="text-xl font-bold mb-4">Lodge Complaint</h3>
            <form onSubmit={handleComplaintSubmit} className="flex flex-col gap-3">
              <input type="text" placeholder="Title (e.g. Fan Broken)" className="border p-2 rounded" onChange={e => setCompData({...compData, title: e.target.value})} required />
              <textarea placeholder="Description" className="border p-2 rounded" onChange={e => setCompData({...compData, description: e.target.value})} required />
              <button className="bg-orange-600 text-white py-2 rounded">Lodge</button>
            </form>
          </div>
          <div className="md:col-span-2">
            <DataTable columns={compColumns} data={complaints} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantDashboard;