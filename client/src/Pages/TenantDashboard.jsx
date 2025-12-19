import { useEffect, useState } from 'react';
import api from '../utils/axiosInstance';
import DataTable from '../components/DataTable';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Constants
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Razorpay Loader
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const TenantDashboard = () => {
  const { user, logout } = useAuth();
  
  // Data States
  const [rents, setRents] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [bills, setBills] = useState([]); 
  const [activeTab, setActiveTab] = useState('rent');

  // Filters
  const [rentFilter, setRentFilter] = useState('All');
  const [compFilter, setCompFilter] = useState('All');

  // Form States
  const [rentData, setRentData] = useState({ month: MONTHS[new Date().getMonth()], year: new Date().getFullYear(), amount: '' });
  const [rentFile, setRentFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [compData, setCompData] = useState({ roomNo: user?.roomNo || '', description: '' });
  const [compFile, setCompFile] = useState(null);

  // --- API CALLS ---
  const fetchData = async () => {
    try {
      const [rentRes, compRes, billRes] = await Promise.all([
        api.get('/rent'),
        api.get('/complaints'),
        api.get('/rent/my-bills')
      ]);
      setRents(rentRes.data);
      setComplaints(compRes.data);
      setBills(billRes.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  // --- HANDLERS ---
  const handleFileChange = (e, setFile, setPreview = null) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) return toast.error("Max 5MB allowed");
    setFile(file);
    if (setPreview) setPreview(URL.createObjectURL(file));
  };

  const handleRentSubmit = async (e) => {
    e.preventDefault();
    if (!rentFile) return toast.error("Upload proof required");
    
    const formData = new FormData();
    formData.append('month', rentData.month);
    formData.append('year', rentData.year);
    formData.append('amount', rentData.amount);
    formData.append('image', rentFile); 

    try { 
      await api.post('/rent', formData); 
      toast.success('Submitted!'); 
      fetchData(); 
      setRentData(prev => ({ ...prev, amount: '' }));
      setRentFile(null); setPreviewUrl(null);
    } catch (err) { toast.error('Upload failed'); }
  };

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('roomNo', compData.roomNo);
    formData.append('description', compData.description);
    if (compFile) formData.append('image', compFile);

    try { 
      await api.post('/complaints', formData); 
      toast.success('Complaint Lodged'); 
      fetchData(); 
      setCompData({ roomNo: user?.roomNo || '', description: '' });
      setCompFile(null);
    } catch (err) { toast.error('Failed'); }
  };

  const handlePayBill = async (bill) => {
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) return toast.error('Razorpay SDK failed');

    try {
      const { data: order } = await api.post('/payment/create-order', { billId: bill._id });
      const options = {
        key: "rzp_test_Rt5hXjTL2tKiN8", 
        amount: order.amount,
        currency: order.currency,
        name: "PG Management",
        description: `Rent for ${bill.month}`,
        order_id: order.orderId,
        handler: async function (response) {
          try {
            await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              billId: bill._id
            });
            toast.success('Payment Successful!');
            fetchData(); 
          } catch (error) { toast.error('Verification Failed'); }
        },
        prefill: { name: order.user_name, email: order.user_email, contact: order.user_phone },
        theme: { color: "#2563EB" },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) { toast.error('Payment failed'); }
  };

  // --- COLUMNS ---
  const rentColumns = [
    { key: 'month', label: 'Month' }, 
    { key: 'amount', label: 'Amount' },
    { key: 'proofUrl', label: 'Proof', render: (row) => (
       row.proofUrl && !row.proofUrl.includes('Razorpay') ? 
       <a href={row.proofUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs">View</a> : 
       <span className="text-gray-400 text-xs">{row.proofUrl?.includes('Razorpay') ? 'Online' : '-'}</span>
    )},
    { key: 'status', label: 'Status' }
  ];

  const compColumns = [
    { key: 'roomNo', label: 'Room' }, 
    { key: 'description', label: 'Description' }, 
    { key: 'imageUrl', label: 'Photo', render: (row) => (
       row.imageUrl ? 
       <a href={row.imageUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs flex items-center gap-1">
         <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> View
       </a> : <span className="text-gray-400 text-xs italic">No Image</span>
    )},
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Date', render: (row) => new Date(row.createdAt).toLocaleDateString() }
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen bg-gray-50">
      
      {/* --- HEADER WITH PROFILE PIC --- */}
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-5">
           {/* Profile Picture */}
           <img 
             src={user?.profilePhoto || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"} 
             alt="Profile" 
             className="w-16 h-16 rounded-full object-cover border-2 border-blue-100 shadow-sm"
           />
           <div>
             <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.name}</h1>
             <p className="text-gray-500 text-sm">Room No: <span className="font-mono font-bold text-blue-600">{user?.roomNo || 'N/A'}</span></p>
           </div>
        </div>
        <button onClick={logout} className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition shadow-sm">
          Logout
        </button>
      </div>

      {/* DUES SECTION */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {bills.filter(b => b.status === 'Unpaid').map(bill => (
          <div key={bill._id} className="bg-white border-l-4 border-red-500 p-4 rounded shadow flex justify-between items-center">
            <div><p className="font-bold">{bill.month}</p><p className="text-red-600 text-sm">₹{bill.amount}</p></div>
            <button onClick={() => handlePayBill(bill)} className="bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700">Pay Now</button>
          </div>
        ))}
        {bills.filter(b => b.status === 'Unpaid').length === 0 && <div className="bg-green-50 text-green-700 p-4 rounded border-l-4 border-green-500">All caught up! No pending dues.</div>}
      </div>

      {/* TABS */}
      <div className="flex gap-4 mb-6 border-b pb-1">
        <button onClick={() => setActiveTab('rent')} className={`px-4 py-2 ${activeTab === 'rent' ? 'text-blue-600 border-b-2 border-blue-600 font-bold' : 'text-gray-500'}`}>Rents</button>
        <button onClick={() => setActiveTab('complaint')} className={`px-4 py-2 ${activeTab === 'complaint' ? 'text-blue-600 border-b-2 border-blue-600 font-bold' : 'text-gray-500'}`}>Complaints</button>
      </div>

      {/* RENT CONTENT */}
      {activeTab === 'rent' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded shadow h-fit">
            <h3 className="font-bold mb-4">Manual Upload</h3>
            <form onSubmit={handleRentSubmit} className="flex flex-col gap-3">
              <select className="border p-2 rounded" value={rentData.month} onChange={e => setRentData({...rentData, month: e.target.value})}>{MONTHS.map(m => <option key={m} value={m}>{m}</option>)}</select>
              <input type="number" placeholder="Amount" className="border p-2 rounded" value={rentData.amount} onChange={e => setRentData({...rentData, amount: e.target.value})} required />
              <input type="file" onChange={(e) => handleFileChange(e, setRentFile, setPreviewUrl)} className="text-sm" required />
              {previewUrl && <img src={previewUrl} alt="Preview" className="h-20 object-contain" />}
              <button className="bg-green-600 text-white py-2 rounded">Submit</button>
            </form>
          </div>
          <div className="md:col-span-2 bg-white rounded shadow overflow-hidden">
             <DataTable columns={rentColumns} data={rents.filter(r => rentFilter === 'All' ? true : r.status === rentFilter)} />
          </div>
        </div>
      ) : (
        // COMPLAINT CONTENT
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded shadow h-fit">
            <h3 className="font-bold mb-4">Lodge Complaint</h3>
            <form onSubmit={handleComplaintSubmit} className="flex flex-col gap-3">
              <input placeholder="Room / Area" className="border p-2 rounded" value={compData.roomNo} onChange={e => setCompData({...compData, roomNo: e.target.value})} required />
              <textarea placeholder="Description" className="border p-2 rounded h-24" value={compData.description} onChange={e => setCompData({...compData, description: e.target.value})} required />
              <div className="text-xs text-gray-500">Optional Photo:</div>
              <input type="file" onChange={(e) => handleFileChange(e, setCompFile)} className="text-sm" />
              <button className="bg-orange-600 text-white py-2 rounded">Submit</button>
            </form>
          </div>
          <div className="md:col-span-2 bg-white rounded shadow overflow-hidden">
             <DataTable columns={compColumns} data={complaints.filter(c => compFilter === 'All' ? true : c.status === compFilter)} />
          </div>
        </div>
      )}
    </div>
  );
};
export default TenantDashboard;