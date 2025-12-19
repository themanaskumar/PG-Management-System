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
  const [rooms, setRooms] = useState([]);
  const [trackingData, setTrackingData] = useState([]);

  // Filter States
  const [trackMonth, setTrackMonth] = useState(MONTHS[new Date().getMonth()]);
  const [trackYear, setTrackYear] = useState(new Date().getFullYear());
  const [compFilter, setCompFilter] = useState('All');

  // Form States
  const [newTenant, setNewTenant] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    roomNo: '', 
    deposit: '', 
    idType: 'aadhar', 
    idNumber: '' 
  });
  
  // File States
  const [idProofFile, setIdProofFile] = useState(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);

  useEffect(() => {
    if (activeView === 'rent') fetchTrackedRents();
    if (activeView === 'complaint') fetchComplaints();
    if (activeView === 'tenant') { fetchTenants(); fetchRooms(); }
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

  // --- ACTION HANDLERS ---
  const handleRentAction = async (id, status) => {
    try { await api.put(`/rent/${id}`, { status }); toast.success(`Rent ${status}`); fetchTrackedRents(); } catch (e) { toast.error('Failed'); }
  };

  const handleComplaintResolve = async (id) => {
    try { await api.put(`/complaints/${id}`, { status: 'Resolved' }); toast.success('Resolved'); fetchComplaints(); } catch (e) { toast.error('Failed'); }
  };

  const handleDeleteTenant = async (id) => {
    if(!window.confirm("Remove tenant? This will free the room.")) return;
    try { await api.delete(`/admin/tenants/${id}`); toast.success('Tenant Removed'); fetchTenants(); fetchRooms(); } catch (e) { toast.error('Failed'); }
  };

  // --- ADD TENANT HANDLER (Multipart) ---
  const handleAddTenant = async (e) => {
    e.preventDefault();

    if (!idProofFile) {
      return toast.error("Please upload the ID Proof document.");
    }

    const formData = new FormData();
    formData.append('name', newTenant.name);
    formData.append('email', newTenant.email);
    formData.append('phone', newTenant.phone);
    formData.append('roomNo', newTenant.roomNo);
    formData.append('deposit', newTenant.deposit);
    formData.append('idType', newTenant.idType);
    formData.append('idNumber', newTenant.idNumber);
    
    // Append Files
    formData.append('idProof', idProofFile);
    if (profilePhotoFile) {
      formData.append('profilePhoto', profilePhotoFile);
    }

    try {
      await api.post('/admin/create-tenant', formData);
      toast.success('Tenant Created Successfully');
      
      // Reset Form
      setNewTenant({ name: '', email: '', phone: '', roomNo: '', deposit: '', idType: 'aadhar', idNumber: '' });
      setIdProofFile(null);
      setProfilePhotoFile(null);
      // Reset file inputs visually
      document.getElementById('file-id-proof').value = "";
      document.getElementById('file-profile').value = "";

      fetchTenants(); 
      fetchRooms();
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10 bg-white p-6 rounded-xl shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{activeView === 'menu' ? 'Admin Dashboard' : activeView.charAt(0).toUpperCase() + activeView.slice(1)}</h1>
            <p className="text-sm text-gray-500">Welcome back, {user?.name}</p>
          </div>
          <div className="flex gap-4">
            {activeView !== 'menu' && <button onClick={() => setActiveView('menu')} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">Back</button>}
            <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">Logout</button>
          </div>
        </div>

        {/* Menu View */}
        {activeView === 'menu' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <MenuCard title="Rent Tracking" desc="Track monthly payments" color="bg-blue-600" view="rent" />
            <MenuCard title="Complaints" desc="Track issues" color="bg-orange-500" view="complaint" />
            <MenuCard title="Tenant Management" desc="Manage Tenants & Rooms" color="bg-green-600" view="tenant" />
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
                        {record.proofUrl ? <a href={record.proofUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm">View Proof</a> : <span className="text-gray-400 text-sm">No Submission</span>}
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
                       <td className="p-4">{c.status==='Open' && <button onClick={()=>handleComplaintResolve(c._id)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Resolve</button>}</td>
                     </tr>
                   ))}
                   {filteredComplaints.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-gray-400">No complaints.</td></tr>}
                 </tbody>
               </table>
             </div>
           </div>
        )}

        {/* Tenant Management View */}
        {activeView === 'tenant' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Add Tenant Form */}
            <div className="bg-white p-6 rounded-xl shadow col-span-1 h-fit">
              <h3 className="text-xl font-bold mb-6 text-gray-700">Add New Tenant</h3>
              
              <form onSubmit={handleAddTenant} className="flex flex-col gap-4">
                <input placeholder="Full Name" className="border p-3 rounded" value={newTenant.name} onChange={e=>setNewTenant({...newTenant, name:e.target.value})} required />
                <input placeholder="Email Address" type="email" className="border p-3 rounded" value={newTenant.email} onChange={e=>setNewTenant({...newTenant, email:e.target.value})} required />
                
                <div className="flex gap-2">
                  <input placeholder="Phone" className="border p-3 w-1/2 rounded" value={newTenant.phone} onChange={e=>setNewTenant({...newTenant, phone:e.target.value})} required />
                  <input placeholder="Deposit (₹)" type="number" className="border p-3 w-1/2 rounded" value={newTenant.deposit} onChange={e=>setNewTenant({...newTenant, deposit:e.target.value})} required />
                </div>
                
                <select className="border p-3 rounded" value={newTenant.roomNo} onChange={e=>setNewTenant({...newTenant, roomNo:e.target.value})} required>
                  <option value="">Select Room</option>{rooms.filter(r => r.status === 'Vacant').map(r => <option key={r._id} value={r.roomNo}>{r.roomNo}</option>)}
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

            {/* Right: Rooms & Tenants */}
            <div className="col-span-1 lg:col-span-2 space-y-8">
              {/* Rooms Grid */}
              <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="text-xl font-bold mb-4">Room Status</h3>
                <div className="grid grid-cols-4 gap-4">
                  {rooms.map(r => (
                    <div key={r._id} className={`p-3 rounded text-center border transition-all ${r.status==='Vacant'?'bg-green-50 border-green-200 text-green-700':'bg-red-50 border-red-200 text-red-700'}`}>
                      <div className="font-bold text-lg">{r.roomNo}</div>
                      <div className="text-xs truncate">{r.status==='Vacant'?'Vacant':r.currentTenant?.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tenants Table (Updated) */}
              <div className="bg-white p-6 rounded-xl shadow">
                 <h3 className="text-xl font-bold mb-4">Current Tenants</h3>
                 <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm">
                     <thead className="bg-gray-50 text-gray-500 border-b">
                       <tr>
                         <th className="p-3">Photo</th>
                         <th className="p-3">Name / Email</th>
                         <th className="p-3">Room</th>
                         <th className="p-3">Phone</th>
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
                             <button onClick={()=>handleDeleteTenant(t._id)} className="text-red-500 hover:text-white hover:bg-red-500 border border-red-500 px-3 py-1 rounded transition text-xs font-semibold">Remove</button>
                           </td>
                         </tr>
                       ))}
                       {tenants.length === 0 && <tr><td colSpan="7" className="p-8 text-center text-gray-400 italic">No tenants found currently.</td></tr>}
                     </tbody>
                   </table>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default AdminDashboard;