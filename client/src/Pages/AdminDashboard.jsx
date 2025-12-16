import { useEffect, useState } from 'react';
import api from '../utils/axiosInstance';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { logout, user } = useAuth();
  const [activeView, setActiveView] = useState('menu'); // 'menu', 'rent', 'complaint', 'tenant'
  
  // --- Data States ---
  const [rents, setRents] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);

  // --- Filter States ---
  const [rentFilter, setRentFilter] = useState('All');
  const [compFilter, setCompFilter] = useState('All');

  // --- Form State ---
  const [newTenant, setNewTenant] = useState({
    name: '', email: '', password: '', phone: '', roomNo: '', deposit: '', idType: 'aadhar', idNumber: ''
  });

  // --- Fetch Data Effects ---
  useEffect(() => {
    if (activeView === 'rent') fetchRents();
    if (activeView === 'complaint') fetchComplaints();
    if (activeView === 'tenant') { fetchTenants(); fetchRooms(); }
  }, [activeView]);

  const fetchRents = async () => { try { const { data } = await api.get('/rent'); setRents(data); } catch(e){} };
  const fetchComplaints = async () => { try { const { data } = await api.get('/complaints'); setComplaints(data); } catch(e){} };
  const fetchTenants = async () => { try { const { data } = await api.get('/admin/tenants'); setTenants(data); } catch(e){} };
  const fetchRooms = async () => { try { const { data } = await api.get('/admin/rooms'); setRooms(data); } catch(e){} };

  // --- Actions ---
  const handleRentAction = async (id, status) => {
    try { await api.put(`/rent/${id}`, { status }); toast.success(`Rent ${status}`); fetchRents(); } catch (e) { toast.error('Failed'); }
  };

  const handleComplaintResolve = async (id) => {
    try { await api.put(`/complaints/${id}`, { status: 'Resolved' }); toast.success('Resolved'); fetchComplaints(); } catch (e) { toast.error('Failed'); }
  };

  const handleDeleteTenant = async (id) => {
    if(!window.confirm("Remove tenant? This will free the room.")) return;
    try { await api.delete(`/admin/tenants/${id}`); toast.success('Tenant Removed'); fetchTenants(); fetchRooms(); } catch (e) { toast.error('Failed'); }
  };

  const handleAddTenant = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/signup', newTenant);
      toast.success('Tenant Added Successfully');
      setNewTenant({ name: '', email: '', password: '', phone: '', roomNo: '', deposit: '', idType: 'aadhar', idNumber: '' });
      fetchTenants(); fetchRooms();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add tenant');
    }
  };

  // --- Filter Logic ---
  const filteredRents = rents.filter(r => rentFilter === 'All' ? true : r.status === rentFilter);
  const filteredComplaints = complaints.filter(c => compFilter === 'All' ? true : c.status === compFilter);

  // --- UI Components ---
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
            <h1 className="text-3xl font-bold text-gray-800">
              {activeView === 'menu' ? 'Admin Dashboard' : 
               activeView === 'rent' ? 'Rent Tracking' :
               activeView === 'complaint' ? 'Complaints' : 'Tenant Management'}
            </h1>
            <p className="text-sm text-gray-500">Welcome back, {user?.name}</p>
          </div>
          <div className="flex gap-4">
            {activeView !== 'menu' && (
              <button onClick={() => setActiveView('menu')} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition">Back to Menu</button>
            )}
            <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">Logout</button>
          </div>
        </div>

        {/* --- MENU VIEW --- */}
        {activeView === 'menu' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <MenuCard title="Rent Tracking" desc="View payment proofs and approve status" color="bg-blue-600" view="rent" />
            <MenuCard title="Complaints" desc="Track issues and mark them resolved" color="bg-orange-500" view="complaint" />
            <MenuCard title="Tenant Management" desc="Add/Remove tenants & View Room Status" color="bg-green-600" view="tenant" />
          </div>
        )}

        {/* --- RENT VIEW --- */}
        {activeView === 'rent' && (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-gray-700">Rent Approvals</h3>
               <div className="flex items-center gap-2">
                 <span className="text-sm text-gray-500">Filter:</span>
                 <select className="border p-2 rounded text-sm bg-gray-50" value={rentFilter} onChange={e => setRentFilter(e.target.value)}>
                   <option value="All">All Status</option>
                   <option value="Pending">Pending</option>
                   <option value="Approved">Approved</option>
                   <option value="Rejected">Rejected</option>
                 </select>
               </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="border-b bg-gray-50 text-gray-600 uppercase text-xs"><th className="p-4">Tenant</th><th className="p-4">Period</th><th className="p-4">Amount</th><th className="p-4">Proof</th><th className="p-4">Status</th><th className="p-4">Action</th></tr></thead>
                <tbody>
                  {filteredRents.map(r => (
                    <tr key={r._id} className="border-b hover:bg-gray-50 transition">
                      <td className="p-4 font-medium">{r.user?.name} <span className="text-gray-400 text-xs">(Rm: {r.user?.roomNo})</span></td>
                      <td className="p-4">{r.month} {r.year}</td>
                      <td className="p-4 font-mono">₹{r.amount}</td>
                      <td className="p-4"><a href={r.proofUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm">View Proof</a></td>
                      <td className={`p-4 font-bold ${r.status==='Approved'?'text-green-600':r.status==='Rejected'?'text-red-600':'text-yellow-600'}`}>{r.status}</td>
                      <td className="p-4 flex gap-2">
                        {r.status === 'Pending' && <><button onClick={()=>handleRentAction(r._id, 'Approved')} className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm hover:bg-green-200">Approve</button><button onClick={()=>handleRentAction(r._id, 'Rejected')} className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200">Reject</button></>}
                      </td>
                    </tr>
                  ))}
                  {filteredRents.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-gray-400">No rent records found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- COMPLAINT VIEW --- */}
        {activeView === 'complaint' && (
           <div className="bg-white rounded-xl shadow p-6">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-gray-700">Tenant Complaints</h3>
               <div className="flex items-center gap-2">
                 <span className="text-sm text-gray-500">Filter:</span>
                 <select className="border p-2 rounded text-sm bg-gray-50" value={compFilter} onChange={e => setCompFilter(e.target.value)}>
                   <option value="All">All Status</option>
                   <option value="Open">Open</option>
                   <option value="Resolved">Resolved</option>
                 </select>
               </div>
             </div>
             <table className="w-full text-left">
               <thead><tr className="border-b bg-gray-50 text-gray-600 uppercase text-xs"><th className="p-4">Issue</th><th className="p-4">Tenant</th><th className="p-4">Status</th><th className="p-4">Action</th></tr></thead>
               <tbody>
                 {filteredComplaints.map(c => (
                   <tr key={c._id} className="border-b hover:bg-gray-50 transition">
                     <td className="p-4 font-medium">{c.title}<br/><span className="text-xs text-gray-500 font-normal">{c.description}</span></td>
                     <td className="p-4">{c.user?.name} <span className="text-gray-400 text-xs">(Rm: {c.user?.roomNo})</span></td>
                     <td className={`p-4 font-bold ${c.status==='Resolved'?'text-green-600':'text-red-600'}`}>{c.status}</td>
                     <td className="p-4">{c.status==='Open' && <button onClick={()=>handleComplaintResolve(c._id)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Mark Resolved</button>}</td>
                   </tr>
                 ))}
                 {filteredComplaints.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-gray-400">No complaints found.</td></tr>}
               </tbody>
             </table>
           </div>
        )}

        {/* --- TENANT MANAGEMENT VIEW --- */}
        {activeView === 'tenant' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Add Tenant Form */}
            <div className="bg-white p-6 rounded-xl shadow col-span-1 h-fit">
              <h3 className="text-xl font-bold mb-6 text-gray-700">Add New Tenant</h3>
              <form onSubmit={handleAddTenant} className="flex flex-col gap-4">
                <input placeholder="Full Name" className="border p-3 rounded bg-gray-50" value={newTenant.name} onChange={e=>setNewTenant({...newTenant, name:e.target.value})} required />
                <input placeholder="Email Address" type="email" className="border p-3 rounded bg-gray-50" value={newTenant.email} onChange={e=>setNewTenant({...newTenant, email:e.target.value})} required />
                <input placeholder="Password" type="password" className="border p-3 rounded bg-gray-50" value={newTenant.password} onChange={e=>setNewTenant({...newTenant, password:e.target.value})} required />
                <div className="flex gap-2">
                  <input placeholder="Phone" className="border p-3 rounded bg-gray-50 w-1/2" value={newTenant.phone} onChange={e=>setNewTenant({...newTenant, phone:e.target.value})} required />
                  <input placeholder="Deposit (₹)" type="number" className="border p-3 rounded bg-gray-50 w-1/2" value={newTenant.deposit} onChange={e=>setNewTenant({...newTenant, deposit:e.target.value})} required />
                </div>
                
                {/* Room Selector */}
                <select className="border p-3 rounded bg-gray-50" value={newTenant.roomNo} onChange={e=>setNewTenant({...newTenant, roomNo:e.target.value})} required>
                  <option value="">Select Vacant Room</option>
                  {rooms.filter(r => r.status === 'Vacant').map(r => (
                    <option key={r._id} value={r.roomNo}>Room {r.roomNo} (Floor {r.floor})</option>
                  ))}
                </select>
                
                <div className="flex gap-2">
                   <select className="border p-3 rounded bg-gray-50 w-1/3" value={newTenant.idType} onChange={e=>setNewTenant({...newTenant, idType:e.target.value})}>
                     <option value="aadhar">Aadhar</option><option value="pan">PAN</option><option value="voter">Voter</option>
                   </select>
                   <input placeholder="ID Number" className="border p-3 rounded bg-gray-50 w-2/3" value={newTenant.idNumber} onChange={e=>setNewTenant({...newTenant, idNumber:e.target.value})} required />
                </div>
                <button className="bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-bold mt-2 shadow-md transition-colors">Create Tenant</button>
              </form>
            </div>

            {/* Right: Tenant List & Room Grid */}
            <div className="col-span-1 lg:col-span-2 space-y-8">
              
              {/* Room Grid Status */}
              <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="text-xl font-bold mb-4 text-gray-700">Room Status</h3>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {rooms.map(r => (
                    <div 
                      key={r._id} 
                      className={`p-3 rounded-lg text-center border transition-all flex flex-col justify-center items-center min-h-[80px] shadow-sm ${
                        r.status === 'Vacant' 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className={`text-xl font-extrabold ${r.status === 'Vacant' ? 'text-green-700' : 'text-red-700'}`}>
                        {r.roomNo}
                      </div>
                      
                      {/* Displays Tenant Name or 'Vacant' */}
                      <div className="text-xs mt-1 font-medium truncate w-full px-1">
                        {r.status === 'Vacant' ? (
                           <span className="text-green-600 italic">Vacant</span>
                        ) : (
                           <span className="text-red-800 font-bold truncate block">
                             {r.currentTenant?.name || 'Occupied'}
                           </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tenant Table */}
              <div className="bg-white p-6 rounded-xl shadow">
                 <h3 className="text-xl font-bold mb-4 text-gray-700">Current Tenants</h3>
                 <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead><tr className="border-b bg-gray-50 text-gray-600 uppercase text-xs">
                        <th className="p-3">Name</th>
                        <th className="p-3">Room</th>
                        <th className="p-3">Deposit</th>
                        <th className="p-3">Contact</th>
                        <th className="p-3">ID Proof</th>
                        <th className="p-3">Action</th>
                     </tr></thead>
                     <tbody>
                       {tenants.map(t => (
                         <tr key={t._id} className="border-b hover:bg-gray-50 transition">
                           <td className="p-3 font-medium">{t.name}<br/><span className="text-xs text-gray-500">{t.email}</span></td>
                           <td className="p-3 font-bold text-blue-600">{t.roomNo}</td>
                           <td className="p-3">₹{t.deposit}</td>
                           <td className="p-3 text-sm">{t.phone}</td>
                           <td className="p-3 text-sm"><span className="font-bold uppercase text-gray-700">{t.idType}</span><br/><span className="text-gray-500 text-xs">{t.idNumber}</span></td>
                           <td className="p-3"><button onClick={()=>handleDeleteTenant(t._id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded text-sm transition">Remove</button></td>
                         </tr>
                       ))}
                       {tenants.length === 0 && <tr><td colSpan="6" className="p-6 text-center text-gray-400">No tenants found.</td></tr>}
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