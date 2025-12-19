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
  // Grab updateUser from context to update the UI instantly without reloading
  const { user, logout, updateUser } = useAuth();
  
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

  // Password Change State
  const [passData, setPassData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  
  // Password Visibility States
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

  // --- NEW: PROFILE PHOTO HANDLER ---
  const handleProfileUpdate = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) return toast.error("Image too large (Max 2MB)");

    const toastId = toast.loading("Updating Profile Photo...");
    const formData = new FormData();
    formData.append('profilePhoto', file);

    try {
      const { data } = await api.put('/auth/update-profile', formData);
      
      // Update Context & LocalStorage immediately
      updateUser({ profilePhoto: data.profilePhoto });
      
      toast.success("Profile Photo Updated!", { id: toastId });
    } catch (err) {
      toast.error("Update failed", { id: toastId });
    }
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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      return toast.error("New passwords do not match");
    }
    if (passData.newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    try {
      await api.put('/auth/change-password', {
        oldPassword: passData.oldPassword,
        newPassword: passData.newPassword
      });
      toast.success("Password Updated Successfully");
      setPassData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    }
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
    <div className="p-8 max-w-6xl mx-auto bg-gray-50">
      
      {/* HEADER WITH PROFILE PIC */}
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-5">
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
        <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 ${activeTab === 'settings' ? 'text-blue-600 border-b-2 border-blue-600 font-bold' : 'text-gray-500'}`}>Settings</button>
      </div>

      {/* RENT CONTENT */}
      {activeTab === 'rent' && (
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
      )}

      {/* COMPLAINT CONTENT */}
      {activeTab === 'complaint' && (
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

      {/* SETTINGS CONTENT */}
      {activeTab === 'settings' && (
        <div className="max-w-xl mx-auto space-y-8">
          
          {/* 1. PROFILE PHOTO SECTION */}
          <div className="bg-white p-8 rounded-xl shadow">
            <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">Profile Photo</h3>
            <div className="flex items-center gap-6">
              <img 
                 src={user?.profilePhoto || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"} 
                 alt="Current Profile" 
                 className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 shadow"
              />
              <div className="flex flex-col gap-2">
                <label className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded cursor-pointer transition text-sm font-semibold border">
                  <span>Upload New Photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleProfileUpdate} />
                </label>
                <p className="text-xs text-gray-400">Supported: JPG, PNG (Max 2MB)</p>
              </div>
            </div>
          </div>

          {/* 2. PASSWORD SECTION */}
          <div className="bg-white p-8 rounded-xl shadow">
            <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">Change Password</h3>
            <form onSubmit={handlePasswordChange} className="flex flex-col gap-5">
              
              <PasswordInput 
                label="Current Password" 
                value={passData.oldPassword} 
                onChange={e => setPassData({...passData, oldPassword: e.target.value})}
                isVisible={showOld}
                toggleVisibility={() => setShowOld(!showOld)}
              />

              <PasswordInput 
                label="New Password" 
                value={passData.newPassword} 
                onChange={e => setPassData({...passData, newPassword: e.target.value})}
                isVisible={showNew}
                toggleVisibility={() => setShowNew(!showNew)}
              />

              <PasswordInput 
                label="Confirm New Password" 
                value={passData.confirmPassword} 
                onChange={e => setPassData({...passData, confirmPassword: e.target.value})}
                isVisible={showConfirm}
                toggleVisibility={() => setShowConfirm(!showConfirm)}
              />

              <button className="bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-md mt-2">
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- HELPER COMPONENT (MOVED OUTSIDE) ---
const PasswordInput = ({ label, value, onChange, isVisible, toggleVisibility }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="relative">
      <input 
        type={isVisible ? "text" : "password"} 
        className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-10" 
        value={value} 
        onChange={onChange} 
        required 
      />
      <button 
        type="button"
        onClick={toggleVisibility}
        className="absolute right-3 top-3.5 text-gray-500 hover:text-blue-600 focus:outline-none"
      >
        {isVisible ? (
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
        ) : (
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        )}
      </button>
    </div>
  </div>
);

export default TenantDashboard;