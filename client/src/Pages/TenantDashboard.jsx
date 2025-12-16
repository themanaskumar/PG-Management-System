import { useEffect, useState } from 'react';
import api from '../utils/axiosInstance';
import DataTable from '../components/DataTable';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TenantDashboard = () => {
  const { user, logout } = useAuth();
  const [rents, setRents] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [activeTab, setActiveTab] = useState('rent');

  // FILTERS
  const [rentFilter, setRentFilter] = useState('All');
  const [compFilter, setCompFilter] = useState('All');

  const [rentData, setRentData] = useState({ month: '', year: new Date().getFullYear(), amount: '', proofUrl: '' });
  const [compData, setCompData] = useState({ title: '', description: '' });

  const fetchData = async () => {
    try {
      const rentRes = await api.get('/rent');
      const compRes = await api.get('/complaints');
      setRents(rentRes.data);
      setComplaints(compRes.data);
    } catch (err) { toast.error('Failed to load data'); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRentSubmit = async (e) => {
    e.preventDefault();
    try { await api.post('/rent', rentData); toast.success('Submitted!'); fetchData(); } catch (err) { toast.error('Failed'); }
  };

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    try { await api.post('/complaints', compData); toast.success('Lodged!'); fetchData(); } catch (err) { toast.error('Failed'); }
  };

  // FILTER LOGIC
  const filteredRents = rents.filter(r => rentFilter === 'All' ? true : r.status === rentFilter);
  const filteredComplaints = complaints.filter(c => compFilter === 'All' ? true : c.status === compFilter);

  const rentColumns = [{ key: 'month', label: 'Month' }, { key: 'year', label: 'Year' }, { key: 'amount', label: 'Amount' }, { key: 'status', label: 'Status' }];
  const compColumns = [{ key: 'title', label: 'Issue' }, { key: 'status', label: 'Status' }, { key: 'createdAt', label: 'Date' }];

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-800">Welcome, {user?.name}</h1>
        <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded shadow hover:bg-red-600">Logout</button>
      </div>

      <div className="flex gap-4 mb-6">
        <button onClick={() => setActiveTab('rent')} className={`px-4 py-2 rounded font-medium transition ${activeTab === 'rent' ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-600'}`}>My Rents</button>
        <button onClick={() => setActiveTab('complaint')} className={`px-4 py-2 rounded font-medium transition ${activeTab === 'complaint' ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-600'}`}>My Complaints</button>
      </div>

      {activeTab === 'rent' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Form */}
          <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-xl font-bold mb-4 text-gray-700">Submit Rent Proof</h3>
            <form onSubmit={handleRentSubmit} className="flex flex-col gap-3">
              <input type="text" placeholder="Month" className="border p-2 rounded" onChange={e => setRentData({...rentData, month: e.target.value})} required />
              <input type="number" placeholder="Amount" className="border p-2 rounded" onChange={e => setRentData({...rentData, amount: e.target.value})} required />
              <input type="text" placeholder="Image URL" className="border p-2 rounded" onChange={e => setRentData({...rentData, proofUrl: e.target.value})} required />
              <button className="bg-green-600 text-white py-2 rounded hover:bg-green-700 transition">Submit</button>
            </form>
          </div>

          {/* Table with Filter */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
               <h3 className="font-bold text-gray-700">Payment History</h3>
               <select className="border p-1 rounded text-sm" value={rentFilter} onChange={e => setRentFilter(e.target.value)}>
                 <option value="All">All Status</option>
                 <option value="Pending">Pending</option>
                 <option value="Approved">Approved</option>
                 <option value="Rejected">Rejected</option>
               </select>
            </div>
            <DataTable columns={rentColumns} data={filteredRents} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Complaint Form */}
          <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-xl font-bold mb-4 text-gray-700">Lodge Complaint</h3>
            <form onSubmit={handleComplaintSubmit} className="flex flex-col gap-3">
              <input type="text" placeholder="Title" className="border p-2 rounded" onChange={e => setCompData({...compData, title: e.target.value})} required />
              <textarea placeholder="Description" className="border p-2 rounded" onChange={e => setCompData({...compData, description: e.target.value})} required />
              <button className="bg-orange-600 text-white py-2 rounded hover:bg-orange-700 transition">Lodge</button>
            </form>
          </div>

          {/* Table with Filter */}
          <div className="md:col-span-2 space-y-4">
             <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
               <h3 className="font-bold text-gray-700">Complaint History</h3>
               <select className="border p-1 rounded text-sm" value={compFilter} onChange={e => setCompFilter(e.target.value)}>
                 <option value="All">All Status</option>
                 <option value="Open">Open</option>
                 <option value="Resolved">Resolved</option>
               </select>
            </div>
            <DataTable columns={compColumns} data={filteredComplaints} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantDashboard;