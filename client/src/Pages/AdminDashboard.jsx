import { useEffect, useState } from 'react';
import api from '../utils/axiosInstance';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

const AdminDashboard = () => {
  const { logout, user } = useAuth();
  const [activeView, setActiveView] = useState('menu');
  
  // Data States
  const [complaints, setComplaints] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [pastTenants, setPastTenants] = useState([]); // --- NEW STATE ---
  const [rooms, setRooms] = useState([]);
  const [notices, setNotices] = useState([]);
  const [trackingData, setTrackingData] = useState([]);

  // Filter States
  const [trackMonth, setTrackMonth] = useState(MONTHS[new Date().getMonth()]);
  const [trackYear, setTrackYear] = useState(new Date().getFullYear());
  const [compFilter, setCompFilter] = useState('All');

  // Form States
  const [newTenant, setNewTenant] = useState({ 
    name: '', email: '', phone: '', roomNo: '', deposit: '', idType: 'aadhar', idNumber: '' 
  });
  
  // File States
  const [idProofFile, setIdProofFile] = useState(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  // Inline edit state for changing room
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editingRoomValue, setEditingRoomValue] = useState('');

  useEffect(() => {
    if (activeView === 'rent') fetchTrackedRents();
    if (activeView === 'complaint') fetchComplaints();
    if (activeView === 'tenant') { fetchTenants(); fetchRooms(); }
    if (activeView === 'history') fetchPastTenants(); // --- NEW CALL ---
    if (activeView === 'manage-rent') fetchRooms();
    if (activeView === 'electricity') { fetchTenants(); }
    if (activeView === 'notices') fetchNotices();
  }, [activeView, trackMonth, trackYear]);
  // --- FETCH FUNCTIONS ---
  const fetchTrackedRents = async () => {
    try {
      const { data } = await api.get(`/rent/track?month=${trackMonth}&year=${trackYear}`);
      setTrackingData(data);
    } catch (e) { console.error(e); }
  };
  const fetchComplaints = async () => { try { const { data } = await api.get('/complaints'); setComplaints(data); } catch(e){} };
  const fetchTenants = async () => { try { const { data } = await api.get('/admin/tenants'); setTenants(data); } catch(e){} };
  const fetchRooms = async () => { try { const { data } = await api.get('/admin/rooms'); setRooms(data); } catch(e){} };
  const fetchNotices = async () => { try { const { data } = await api.get('/admin/notices'); setNotices(data); } catch(e){} };
  // --- NEW FETCH FUNCTION ---
  const fetchPastTenants = async () => { try { const { data } = await api.get('/admin/history'); setPastTenants(data); } catch(e){} };
  // --- ACTION HANDLERS ---
  const handleRentAction = async (id, status) => {
    try { await api.put(`/rent/${id}`, { status }); toast.success(`Rent ${status}`); fetchTrackedRents(); } catch (e) { toast.error('Failed'); }
  };
  const handleComplaintResolve = async (id) => {
    try { await api.put(`/complaints/${id}`, { status: 'Resolved' }); toast.success('Resolved'); fetchComplaints(); } catch (e) { toast.error('Failed'); }
  };
  const handleDeleteTenant = async (id) => {
    if(!window.confirm("Remove tenant? This will free the room and archive the tenant.")) return;
    try { await api.delete(`/admin/tenants/${id}`); toast.success('Tenant Archived & Removed'); fetchTenants(); fetchRooms(); } catch (e) { toast.error('Failed'); }
  };
  const startEditRoom = (id, currentRoom) => {
    setEditingRoomId(id);
    setEditingRoomValue(currentRoom || '');
  };
  const cancelEditRoom = () => {
    setEditingRoomId(null);
    setEditingRoomValue('');
  };
  const handleChangeRoom = async (id) => {
    if (!editingRoomValue) return toast.error('Please enter a room number');
    try {
      await api.put(`/admin/tenants/${id}/change-room`, { newRoomNo: editingRoomValue });
      toast.success('Room changed successfully');
      setEditingRoomId(null);
      setEditingRoomValue('');
      fetchTenants(); fetchRooms();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to change room';
      toast.error(msg);
    }
  };
  // --- UPDATE ROOM PRICE ---
  const handleUpdateRoomPrice = async (roomNo, price) => {
    try {
      await api.put(`/admin/rooms/${roomNo}`, { price });
      toast.success('Updated price');
      fetchRooms();
    } catch (e) { toast.error('Failed to update'); }
  };
  // --- ELECTRICITY BILL ---
  const [elecAmount, setElecAmount] = useState('');
  const [selectedTenants, setSelectedTenants] = useState([]);
  const handleToggleTenant = (id) => {
    setSelectedTenants(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
  };
  const handleCreateElectricity = async (e) => {
    e.preventDefault();
    if (!elecAmount || selectedTenants.length === 0) return toast.error('Amount & tenants required');
    try {
      await api.post('/admin/electricity', { amount: Number(elecAmount), tenantIds: selectedTenants });
      toast.success('Electricity bills created');
      setElecAmount(''); setSelectedTenants([]);
    } catch (err) { toast.error('Failed'); }
  };
  // --- NOTICES ---
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!noticeTitle || !noticeMessage) return toast.error('Title & message required');
    try {
      await api.post('/admin/notices', { title: noticeTitle, message: noticeMessage });
      toast.success('Notice posted');
      setNoticeTitle(''); setNoticeMessage('');
      fetchNotices();
    } catch (err) { toast.error('Failed'); }
  };
  const handleDeleteNotice = async (id) => {
    if (!window.confirm('Delete this notice?')) return;
    try {
      await api.delete(`/admin/notices/${id}`);
      toast.success('Notice deleted');
      fetchNotices();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete';
      toast.error(msg);
    }
  };
  // --- ADD TENANT HANDLER ---
  const handleAddTenant = async (e) => {
    e.preventDefault();
    if (!idProofFile) return toast.error("Please upload the ID Proof document.");
    const formData = new FormData();
    formData.append('name', newTenant.name);
    formData.append('email', newTenant.email);
    formData.append('phone', newTenant.phone);
    formData.append('roomNo', newTenant.roomNo);
    formData.append('deposit', newTenant.deposit);
    formData.append('idType', newTenant.idType);
    formData.append('idNumber', newTenant.idNumber);
    formData.append('idProof', idProofFile);
    if (profilePhotoFile) formData.append('profilePhoto', profilePhotoFile);
    try {
      await api.post('/admin/create-tenant', formData);
      toast.success('Tenant Created Successfully');
      setNewTenant({ name: '', email: '', phone: '', roomNo: '', deposit: '', idType: 'aadhar', idNumber: '' });
      setIdProofFile(null); setProfilePhotoFile(null);
      document.getElementById('file-id-proof').value = "";
      document.getElementById('file-profile').value = "";
      fetchTenants(); fetchRooms();
    } catch (e) { 
      toast.error(e.response?.data?.message || 'Failed to create tenant'); 
    }
  };
  const filteredComplaints = complaints.filter(c => compFilter === 'All' ? true : c.status === compFilter);
  const MenuCard = ({ title, desc, color, view }) => (
    <div onClick={() => setActiveView(view)} className={`p-6 rounded-xl shadow-md cursor-pointer transition-transform hover:scale-105 ${color} text-white`}>
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <p className="opacity-90">{desc}</p>
    </div>
  );

  return (
    <div className="bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10 bg-white p-6 rounded-xl shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{activeView === 'menu' ? 'Admin Dashboard' : activeView.replace(/([A-Z])/g, ' $1').trim()}</h1>
            <p className="text-sm text-gray-500">Welcome back, {user?.name}</p>
          </div>
          <div className="flex gap-4">
            {activeView !== 'menu' && <button onClick={() => setActiveView('menu')} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">Back</button>}
            <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">Logout</button>
          </div>
        </div>
        {/* Menu View */}
        {activeView === 'menu' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <MenuCard title="Rent Tracking" desc="Track monthly payments" color="bg-blue-600" view="rent" />
            <MenuCard title="Complaints" desc="Track issues" color="bg-orange-500" view="complaint" />
            <MenuCard title="Tenant Management" desc="Manage Tenants & Rooms" color="bg-green-600" view="tenant" />
            <MenuCard title="Manage Rents" desc="Adjust rent per room" color="bg-indigo-600" view="manage-rent" />
            <MenuCard title="Electricity" desc="Split electricity bills" color="bg-yellow-600" view="electricity" />
            <MenuCard title="Notices" desc="Post announcements" color="bg-pink-600" view="notices" />
            <MenuCard title="Past Tenants" desc="View Archived History" color="bg-gray-600" view="history" />
          </div>
        )}
        {/* Manage Rents View */}
        {activeView === 'manage-rent' && (
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-xl font-bold mb-4">Manage Room Rents</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rooms.map(r => (
                <div key={r._id} className="p-4 border rounded">
                  <div className="font-mono font-bold mb-2">{r.roomNo}</div>
                  <div className="flex items-center gap-2">
                    <input type="number" className="border p-2 rounded w-32" defaultValue={r.price} onBlur={(e)=>handleUpdateRoomPrice(r.roomNo, e.target.value)} />
                    <div className="text-sm text-gray-500">(Blur to save)</div>
                  </div>
                  <div className="text-xs mt-2">Status: {r.status}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Electricity View */}
        {activeView === 'electricity' && (
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-xl font-bold mb-4">Create Electricity Bill</h3>
            <form onSubmit={handleCreateElectricity} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Amount (₹)</label>
                <input className="border p-2 rounded w-full" value={elecAmount} onChange={e=>setElecAmount(e.target.value)} required />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Select Tenants to Split Between</label>
                <div className="max-h-48 overflow-auto border p-2 rounded mt-2">
                  {tenants.map(t => (
                    <label key={t._id} className="flex items-center gap-2 p-1">
                      <input type="checkbox" checked={selectedTenants.includes(t._id)} onChange={()=>handleToggleTenant(t._id)} />
                      <div className="text-sm">{t.name} — {t.roomNo}</div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="md:col-span-3">
                <button className="bg-yellow-600 text-white px-4 py-2 rounded">Create Electricity Bills</button>
              </div>
            </form>
          </div>
        )}

        {/* Notices View */}
        {activeView === 'notices' && (
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Notices</h3>
            </div>
            <form onSubmit={handleCreateNotice} className="mb-6">
              <input className="border p-2 rounded w-full mb-2" placeholder="Title" value={noticeTitle} onChange={e=>setNoticeTitle(e.target.value)} />
              <textarea className="border p-2 rounded w-full mb-2" placeholder="Message" value={noticeMessage} onChange={e=>setNoticeMessage(e.target.value)} />
              <button className="bg-pink-600 text-white px-4 py-2 rounded">Post Notice</button>
            </form>

            <div className="space-y-3">
              {notices.map(n => (
                <div key={n._id} className="border p-3 rounded flex justify-between items-start">
                  <div>
                    <div className="font-bold">{n.title}</div>
                    <div className="text-xs text-gray-500">Posted by: {n.createdBy?.name} — {new Date(n.createdAt).toLocaleString()}</div>
                    <div className="mt-2">{n.message}</div>
                  </div>
                  <div>
                    <button onClick={() => handleDeleteNotice(n._id)} className="text-sm text-red-500 hover:underline">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rent View */}
        {activeView === 'rent' && (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
               <div><h3 className="text-xl font-bold text-gray-700">Monthly Rent Tracker</h3><p className="text-sm text-gray-500">Status for <strong>{trackMonth} {trackYear}</strong></p></div>
               <div className="flex gap-3">
                 <select value={trackMonth} onChange={(e) => setTrackMonth(e.target.value)} className="border p-2 rounded-lg bg-gray-50">{MONTHS.map(m => <option key={m} value={m}>{m}</option>)}</select>
                 <select value={trackYear} onChange={(e) => setTrackYear(parseInt(e.target.value))} className="border p-2 rounded-lg bg-gray-50">{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
               </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-gray-100 text-gray-600 uppercase text-xs">
                    <th className="p-4">Tenant</th><th className="p-4">Room</th><th className="p-4">Status</th><th className="p-4">Amount</th><th className="p-4">Proof</th><th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {trackingData.map((record) => (
                    <tr key={record.tenantId} className="hover:bg-blue-50 transition">
                      <td className="p-4"><div className="font-bold">{record.name}</div><div className="text-xs text-gray-500">{record.phone}</div></td>
                      <td className="p-4 font-mono">{record.roomNo || "N/A"}</td>
                      <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold border ${record.status === 'Approved' ? 'bg-green-100 text-green-700' : record.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-50 text-red-700'}`}>{record.status}</span></td>
                      <td className="p-4">{record.amount > 0 ? `₹${record.amount}` : '-'}</td>
                      <td className="p-4">
                        {record.proofUrl?.includes('Razorpay') ? (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200">
                             <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                             RazorPay
                          </span>
                        ) : record.proofUrl ? (
                          <a href={record.proofUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm hover:text-blue-800">View Proof</a>
                        ) : <span className="text-gray-400 text-sm">No Submission</span>}
                      </td>
                      <td className="p-4">
                        {record.status === 'Pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleRentAction(record.rentId, 'Approved')} className="bg-green-500 text-white p-1.5 rounded hover:bg-green-600">✓</button>
                            <button onClick={() => handleRentAction(record.rentId, 'Rejected')} className="bg-red-500 text-white p-1.5 rounded hover:bg-red-600">✕</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {trackingData.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-gray-400">No active tenants.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Complaint View */}
        {activeView === 'complaint' && (
           <div className="bg-white rounded-xl shadow p-6">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-gray-700">Complaints</h3>
               <select className="border p-2 rounded text-sm bg-gray-50" value={compFilter} onChange={e => setCompFilter(e.target.value)}>
                 <option value="All">All Status</option><option value="Open">Open</option><option value="Resolved">Resolved</option>
               </select>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="border-b bg-gray-100 text-gray-600 uppercase text-xs">
                     <th className="p-4">Room / Area</th><th className="p-4">Description</th><th className="p-4">Tenant</th><th className="p-4">Photo</th><th className="p-4">Status</th><th className="p-4">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {filteredComplaints.map(c => (
                     <tr key={c._id} className="hover:bg-gray-50">
                       <td className="p-4 font-bold">{c.roomNo}</td>
                       <td className="p-4 text-sm max-w-xs">{c.description}</td>
                       <td className="p-4"><div>{c.user?.name}</div><div className="text-xs text-gray-500">Rm: {c.user?.roomNo}</div></td>
                       <td className="p-4">
                         {c.imageUrl ? (
                           <a href={c.imageUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs flex items-center gap-1">
                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> View
                           </a>
                         ) : <span className="text-gray-400 text-xs">No Image</span>}
                       </td>
                       <td className={`p-4 font-bold ${c.status==='Resolved'?'text-green-600':'text-red-600'}`}>{c.status}</td>
                       <td className="p-4">{c.status==='Open' && <button onClick={()=>handleComplaintResolve(c._id)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Mark Resolved</button>}</td>
                     </tr>
                   ))}
                   {filteredComplaints.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-gray-400">No complaints.</td></tr>}
                 </tbody>
               </table>
             </div>
           </div>
        )}
        {/* --- NEW HISTORY VIEW (PAST TENANTS) --- */}
        {activeView === 'history' && (
           <div className="bg-white rounded-xl shadow p-6">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-gray-700">Archived Tenants</h3>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                 <thead className="bg-gray-50 text-gray-500 border-b">
                   <tr>
                     <th className="p-3">Profile</th>
                     <th className="p-3">Tenant Details</th>
                     <th className="p-3">Stay Details</th>
                     <th className="p-3">ID Proof</th>
                     <th className="p-3">Dates</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y">
                   {pastTenants.map(t => (
                     <tr key={t._id} className="hover:bg-gray-50">
                       <td className="p-3">
                         <img 
                           src={t.profilePhoto || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"} 
                           alt="profile" 
                           className="w-10 h-10 rounded-full object-cover border shadow-sm grayscale opacity-75"
                         />
                       </td>
                       <td className="p-3">
                         <div className="font-bold text-gray-800">{t.name}</div>
                         <div className="text-xs text-gray-500">{t.email}</div>
                         <div className="text-xs text-gray-500">{t.phone}</div>
                       </td>
                       <td className="p-3">
                         <div className="text-gray-500 text-xs">Past Room:</div>
                         <div className="font-mono font-bold text-gray-700 text-lg">{t.roomNo}</div>
                       </td>
                       <td className="p-3">
                         <div className="text-xs font-bold uppercase bg-gray-100 px-2 py-0.5 rounded text-gray-600 inline-block mb-1">{t.idType}</div>
                         <br/>
                         <a href={t.idProof} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">View Document</a>
                       </td>
                       <td className="p-3 text-xs">
                         <div className="text-green-700">Joined: {new Date(t.joinedAt).toLocaleDateString()}</div>
                         <div className="text-red-700 font-bold">Left: {new Date(t.leftAt).toLocaleDateString()}</div>
                       </td>
                     </tr>
                   ))}
                   {pastTenants.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-400">No history available.</td></tr>}
                 </tbody>
               </table>
             </div>
           </div>
        )}
        {/* Tenant Management View */}
        {activeView === 'tenant' && (
          <div className="flex flex-col gap-8">
            {/* Room Status */}
            <div className="bg-white p-6 rounded-xl shadow max-h-screen overflow-auto">
              <h3 className="text-xl font-bold mb-4">Room Status</h3>
              <div className="grid grid-cols-4 gap-4">
                {rooms.map(r => (
                  <div key={r._id} className={`p-3 rounded text-center border transition-all ${r.status==='Vacant' ? 'bg-green-50 border-green-200 text-green-700' : r.status==='Partially Occupied' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    <div className="font-bold text-lg">{r.roomNo}</div>
                    <div className="text-sm mt-1">
                      {r.status === 'Vacant' && <span>Vacant</span>}
                      {r.status === 'Partially Occupied' && (
                        <>
                          <div className="font-medium">{r.currentTenants?.[0]?.name || '1 bed occupied'}</div>
                          <div className="inline-block mt-2 px-2 py-0.5 text-xs font-semibold rounded bg-orange-100 text-orange-800">Partially Occupied</div>
                        </>
                      )}
                      {r.status === 'Occupied' && (
                        <>
                          <div className="font-medium">{r.currentTenants?.map(t => t.name).join(', ') || '2 tenants'}</div>
                          <div className="inline-block mt-2 px-2 py-0.5 text-xs font-semibold rounded bg-red-100 text-red-800">Occupied</div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Current Tenants */}
            <div className="bg-white p-6 rounded-xl shadow max-h-screen overflow-auto">
               <h3 className="text-xl font-bold mb-4">Current Tenants</h3>
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-gray-50 text-gray-500 border-b">
                     <tr>
                       <th className="p-3">Photo</th>
                       <th className="p-3">Name / Email</th>
                       <th className="p-3">Room</th>
                       <th className="p-3">Phone</th>
                       <th className="p-3">Deposit</th>
                       <th className="p-3">ID Details</th>
                       <th className="p-3">ID Document</th>
                       <th className="p-3">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y">
                     {tenants.map(t => (
                       <tr key={t._id} className="hover:bg-gray-50 transition">
                         <td className="p-3">
                           <img 
                             src={t.profilePhoto || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"} 
                             alt="profile" 
                             className="w-10 h-10 rounded-full object-cover border shadow-sm"
                           />
                         </td>
                         <td className="p-3">
                           <div className="font-bold text-gray-800">{t.name}</div>
                           <div className="text-xs text-gray-500">{t.email}</div>
                         </td>
                         <td className="p-3 font-mono font-bold text-blue-600 text-lg">{t.roomNo}</td>
                         <td className="p-3 font-medium text-gray-600">{t.phone}</td>
                         <td className="p-3 font-medium text-gray-700">{t.deposit ? `₹${t.deposit}` : '—'}</td>
                         <td className="p-3">
                           <span className="text-xs font-bold uppercase bg-gray-200 px-2 py-0.5 rounded text-gray-600 mr-2">{t.idType}</span>
                           <br />
                           <span className="font-mono text-gray-700"><strong>{t.idNumber}</strong></span>
                         </td>
                         <td className="p-3">
                           <a href={t.idProof} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline text-xs font-bold">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> View Proof
                           </a>
                         </td>
                         <td className="p-3">
                           {editingRoomId === t._id ? (
                             <div className="flex items-center gap-2">
                               <input value={editingRoomValue} onChange={(e)=>setEditingRoomValue(e.target.value)} className="border p-1 rounded w-28 text-sm" />
                               <button onClick={()=>handleChangeRoom(t._id)} className="text-green-600 bg-green-50 hover:bg-green-600 hover:text-white border border-green-600 px-2 py-1 rounded transition text-xs font-semibold">✓</button>
                               <button onClick={cancelEditRoom} className="text-gray-600 bg-gray-50 hover:bg-gray-600 hover:text-white border border-gray-300 px-2 py-1 rounded transition text-xs font-semibold">✕</button>
                             </div>
                           ) : (
                             <div className="flex gap-2">
                               <button onClick={()=>handleDeleteTenant(t._id)} className="text-red-500 hover:text-white hover:bg-red-500 border border-red-500 px-3 py-1 rounded transition text-xs font-semibold">Remove</button>
                               <button onClick={()=>startEditRoom(t._id, t.roomNo)} className="text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-600 px-3 py-1 rounded transition text-xs font-semibold">Change Room</button>
                             </div>
                           )}
                         </td>
                       </tr>
                     ))}
                     {tenants.length === 0 && <tr><td colSpan="8" className="p-8 text-center text-gray-400 italic">No tenants found currently.</td></tr>}
                   </tbody>
                 </table>
               </div>
            </div>
            {/* Add New Tenant Form */}
            <div className="bg-white p-6 rounded-xl shadow max-h-screen overflow-auto">
              <h3 className="text-xl font-bold mb-6 text-gray-700">Add New Tenant</h3>
              <form onSubmit={handleAddTenant} className="flex flex-col gap-4">
                <input placeholder="Full Name" className="border p-3 rounded" value={newTenant.name} onChange={e=>setNewTenant({...newTenant, name:e.target.value})} required />
                <input placeholder="Email Address" type="email" className="border p-3 rounded" value={newTenant.email} onChange={e=>setNewTenant({...newTenant, email:e.target.value})} required />
                <div className="flex gap-2">
                  <input placeholder="Phone" className="border p-3 w-1/2 rounded" value={newTenant.phone} onChange={e=>setNewTenant({...newTenant, phone:e.target.value})} required />
                  <input placeholder="Deposit (₹)" type="number" className="border p-3 w-1/2 rounded" value={newTenant.deposit} onChange={e=>setNewTenant({...newTenant, deposit:e.target.value})} required />
                </div>
                <select className="border p-3 rounded" value={newTenant.roomNo} onChange={e=>setNewTenant({...newTenant, roomNo:e.target.value})} required>
                  <option value="">Select Room</option>{rooms.filter(r => r.status !== 'Occupied').map(r => <option key={r._id} value={r.roomNo}>{r.roomNo} {r.status==='Partially Occupied' ? '(1 bed taken)' : ''}</option>)}
                </select>
                <div className="flex gap-2">
                  <select className="border p-3 w-1/3 rounded" value={newTenant.idType} onChange={e=>setNewTenant({...newTenant, idType:e.target.value})}>
                    <option value="aadhar">Aadhar</option><option value="pan">PAN</option><option value="voter">Voter ID</option>
                  </select>
                  <input placeholder="ID Number" className="border p-3 w-2/3 rounded" value={newTenant.idNumber} onChange={e=>setNewTenant({...newTenant, idNumber:e.target.value})} required />
                </div>
                {/* File Uploads */}
                <div className="space-y-2 border-t pt-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-600 mb-1">Upload ID Proof <span className="text-red-500">*</span></label>
                    <input 
                      id="file-id-proof"
                      type="file" 
                      accept="image/*,application/pdf"
                      onChange={(e) => setIdProofFile(e.target.files[0])}
                      className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      required
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-600 mb-1">Profile Photo (Optional)</label>
                    <input 
                      id="file-profile"
                      type="file" 
                      accept="image/*"
                      onChange={(e) => setProfilePhotoFile(e.target.files[0])}
                      className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">Note: Password will be set to the <strong>email username</strong> (e.g., john for john@gmail.com).</p>
                <button type="submit" className="bg-green-600 text-white py-3 rounded font-bold hover:bg-green-700 transition shadow-lg mt-2">Create Tenant</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default AdminDashboard;