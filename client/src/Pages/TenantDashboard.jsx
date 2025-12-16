import { useEffect, useState } from 'react';
import api from '../utils/axiosInstance';
import DataTable from '../components/DataTable';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Helper for Dropdowns
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

const TenantDashboard = () => {
  const { user, logout } = useAuth();
  const [rents, setRents] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [activeTab, setActiveTab] = useState('rent');

  // FILTERS
  const [rentFilter, setRentFilter] = useState('All');
  const [compFilter, setCompFilter] = useState('All');

  // FORM STATES
  // Defaulting to current Month and Year
  const [rentData, setRentData] = useState({ 
    month: MONTHS[new Date().getMonth()], 
    year: new Date().getFullYear(), 
    amount: '', 
    proofUrl: '' 
  });
  
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

  // --- IMAGE HANDLER ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Simple 2MB Limit
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image too large. Max 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setRentData({ ...rentData, proofUrl: reader.result });
      toast.success("Image uploaded successfully!");
    };
  };

  const handleRentSubmit = async (e) => {
    e.preventDefault();
    if (!rentData.proofUrl) return toast.error("Please upload payment proof");
    
    try { 
      await api.post('/rent', rentData); 
      toast.success('Submitted!'); 
      fetchData(); 
      // Reset form but keep month/year logic or reset to current? 
      // Keeping it simple: clear amount and proof
      setRentData(prev => ({ ...prev, amount: '', proofUrl: '' }));
    } catch (err) { 
      toast.error('Failed'); 
    }
  };

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    try { 
      await api.post('/complaints', compData); 
      toast.success('Lodged!'); 
      fetchData(); 
      setCompData({ title: '', description: '' });
    } catch (err) { 
      toast.error('Failed'); 
    }
  };

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
          <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border h-fit">
            <h3 className="text-xl font-bold mb-4 text-gray-700">Submit Rent Proof</h3>
            <form onSubmit={handleRentSubmit} className="flex flex-col gap-4">
              
              {/* --- UPDATED: Month & Year Selection --- */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 font-semibold ml-1">Month</label>
                  <select 
                    className="border p-2 rounded w-full bg-gray-50" 
                    value={rentData.month} 
                    onChange={e => setRentData({...rentData, month: e.target.value})}
                  >
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-semibold ml-1">Year</label>
                  <select 
                    className="border p-2 rounded w-full bg-gray-50" 
                    value={rentData.year} 
                    onChange={e => setRentData({...rentData, year: e.target.value})}
                  >
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div>
                 <label className="text-xs text-gray-500 font-semibold ml-1">Amount Paid (₹)</label>
                 <input 
                   type="number" 
                   placeholder="5000" 
                   className="border p-2 rounded w-full" 
                   value={rentData.amount}
                   onChange={e => setRentData({...rentData, amount: e.target.value})} 
                   required 
                 />
              </div>
              
              {/* File Input */}
              <div className="border p-2 rounded bg-gray-50 border-dashed border-gray-300">
                <label className="block text-xs text-gray-500 mb-1 font-semibold">Upload Screenshot</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  required={!rentData.proofUrl} // Required only if no proofUrl exists
                />
              </div>

              {/* PREVIEW IMAGE */}
              {rentData.proofUrl && (
                <div className="mt-2 bg-gray-100 p-2 rounded border text-center">
                  <p className="text-xs text-green-600 mb-1 font-bold">Preview:</p>
                  <img src={rentData.proofUrl} alt="Proof" className="h-32 mx-auto object-contain rounded" />
                </div>
              )}

              <button className="bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition shadow-md">Submit Payment</button>
            </form>
          </div>

          {/* Table */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
               <h3 className="font-bold text-gray-700">Payment History</h3>
               <select className="border p-1 rounded text-sm bg-gray-50" value={rentFilter} onChange={e => setRentFilter(e.target.value)}>
                 <option value="All">All Status</option>
                 <option value="Pending">Pending</option>
                 <option value="Approved">Approved</option>
                 <option value="Rejected">Rejected</option>
               </select>
            </div>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
               <DataTable columns={rentColumns} data={filteredRents} />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Complaint Form */}
          <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border h-fit">
            <h3 className="text-xl font-bold mb-4 text-gray-700">Lodge Complaint</h3>
            <form onSubmit={handleComplaintSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-gray-500 font-semibold ml-1">Subject</label>
                <input 
                  type="text" 
                  placeholder="e.g., Leaking Tap" 
                  className="border p-2 rounded w-full" 
                  value={compData.title}
                  onChange={e => setCompData({...compData, title: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-semibold ml-1">Description</label>
                <textarea 
                  placeholder="Describe the issue..." 
                  className="border p-2 rounded w-full h-32 resize-none" 
                  value={compData.description}
                  onChange={e => setCompData({...compData, description: e.target.value})} 
                  required 
                />
              </div>
              <button className="bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition shadow-md">Lodge Complaint</button>
            </form>
          </div>

          {/* Table */}
          <div className="md:col-span-2 space-y-4">
             <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
               <h3 className="font-bold text-gray-700">Complaint History</h3>
               <select className="border p-1 rounded text-sm bg-gray-50" value={compFilter} onChange={e => setCompFilter(e.target.value)}>
                 <option value="All">All Status</option>
                 <option value="Open">Open</option>
                 <option value="Resolved">Resolved</option>
               </select>
            </div>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
               <DataTable columns={compColumns} data={filteredComplaints} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantDashboard;