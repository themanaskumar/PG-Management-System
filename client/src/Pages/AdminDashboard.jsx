import { useEffect, useState } from 'react';
import api from '../utils/axiosInstance';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { logout, user } = useAuth();
  const [activeView, setActiveView] = useState('menu'); // 'menu', 'rent', 'complaint', 'tenant'
  
  // Data States
  const [rents, setRents] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);

  // Add Tenant Form State
  const [newTenant, setNewTenant] = useState({ name: '', email: '', password: '', phone: '', roomNo: '', deposit: '', idType: 'aadhar', idNumber: '' });

  // FETCH DATA based on view
  useEffect(() => {
    if (activeView === 'rent') fetchRents();
    if (activeView === 'complaint') fetchComplaints();
    if (activeView === 'tenant') { fetchTenants(); fetchRooms(); }
  }, [activeView]);

  const fetchRents = async () => { try { const { data } = await api.get('/rent'); setRents(data); } catch(e){} };
  const fetchComplaints = async () => { try { const { data } = await api.get('/complaints'); setComplaints(data); } catch(e){} };
  const fetchTenants = async () => { try { const { data } = await api.get('/admin/tenants'); setTenants(data); } catch(e){} };
  const fetchRooms = async () => { try { const { data } = await api.get('/admin/rooms'); setRooms(data); } catch(e){} };

  // ACTIONS
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
      await api.post('/auth/signup', newTenant); // Reusing auth route
      toast.success('Tenant Added Successfully');
      setNewTenant({ name: '', email: '', password: '', phone: '', roomNo: '', deposit: '', idType: 'aadhar', idNumber: '' }); // Reset
      fetchTenants();
      fetchRooms();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add tenant');
    }
  };

  // --- RENDER HELPERS ---
  const MenuCard = ({ title, desc, color, view }) => (
    <div onClick={() => setActiveView(view)} className={`p-6 rounded-xl shadow-md cursor-pointer transition-transform hover:scale-105 ${color} text-white`}>
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <p className="opacity-90">{desc}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800">
            {activeView === 'menu' ? `Welcome, ${user?.name}` : 
             activeView === 'rent' ? 'Rent Tracking' :
             activeView === 'complaint' ? 'Complaint Tracking' : 'Tenant Management'}
          </h1>
          <div className="flex gap-4">
            {activeView !== 'menu' && (
              <button onClick={() => setActiveView('menu')} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Back to Menu</button>
            )}
            <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">Logout</button>
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
            <table className="w-full text-left">
              <thead><tr className="border-b bg-gray-100"><th className="p-3">Tenant</th><th className="p-3">Amount</th><th className="p-3">Proof</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead>
              <tbody>
                {rents.map(r => (
                  <tr key={r._id} className="border-b">
                    <td className="p-3">{r.user?.name} (Rm: {r.user?.roomNo})</td>
                    <td className="p-3">₹{r.amount}</td>
                    <td className="p-3"><a href={r.proofUrl} target="_blank" className="text-blue-500 underline">View</a></td>
                    <td className={`p-3 font-bold ${r.status==='Approved'?'text-green-600':'text-yellow-600'}`}>{r.status}</td>
                    <td className="p-3 flex gap-2">
                      {r.status === 'Pending' && <><button onClick={()=>handleRentAction(r._id, 'Approved')} className="bg-green-500 text-white px-2 py-1 rounded">Approve</button><button onClick={()=>handleRentAction(r._id, 'Rejected')} className="bg-red-500 text-white px-2 py-1 rounded">Reject</button></>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- COMPLAINT VIEW --- */}
        {activeView === 'complaint' && (
           <div className="bg-white rounded-xl shadow p-6">
             <table className="w-full text-left">
               <thead><tr className="border-b bg-gray-100"><th className="p-3">Issue</th><th className="p-3">Tenant</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead>
               <tbody>
                 {complaints.map(c => (
                   <tr key={c._id} className="border-b">
                     <td className="p-3">{c.title}<br/><span className="text-xs text-gray-500">{c.description}</span></td>
                     <td className="p-3">{c.user?.name} (Rm: {c.user?.roomNo})</td>
                     <td className={`p-3 font-bold ${c.status==='Resolved'?'text-green-600':'text-red-600'}`}>{c.status}</td>
                     <td className="p-3">{c.status==='Open' && <button onClick={()=>handleComplaintResolve(c._id)} className="bg-blue-600 text-white px-2 py-1 rounded">Mark Resolved</button>}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}

        {/* --- TENANT MANAGEMENT VIEW (NEW) --- */}
        {activeView === 'tenant' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Add Tenant Form */}
            <div className="bg-white p-6 rounded-xl shadow col-span-1">
              <h3 className="text-xl font-bold mb-4">Add New Tenant</h3>
              <form onSubmit={handleAddTenant} className="flex flex-col gap-3">
                <input placeholder="Name" className="border p-2 rounded" value={newTenant.name} onChange={e=>setNewTenant({...newTenant, name:e.target.value})} required />
                <input placeholder="Email" className="border p-2 rounded" value={newTenant.email} onChange={e=>setNewTenant({...newTenant, email:e.target.value})} required />
                <input placeholder="Password" type="password" className="border p-2 rounded" value={newTenant.password} onChange={e=>setNewTenant({...newTenant, password:e.target.value})} required />
                <input placeholder="Phone" className="border p-2 rounded" value={newTenant.phone} onChange={e=>setNewTenant({...newTenant, phone:e.target.value})} required />
                <input placeholder="Security Deposit (₹)" type="number" className="border p-2 rounded" value={newTenant.deposit} onChange={e=>setNewTenant({...newTenant, deposit:e.target.value})} required />
                
                {/* Room Selector (Only Vacant) */}
                <select className="border p-2 rounded" value={newTenant.roomNo} onChange={e=>setNewTenant({...newTenant, roomNo:e.target.value})} required>
                  <option value="">Select Vacant Room</option>
                  {rooms.filter(r => r.status === 'Vacant').map(r => (
                    <option key={r._id} value={r.roomNo}>Room {r.roomNo} (Floor {r.floor})</option>
                  ))}
                </select>
                
                <div className="flex gap-2">
                   <select className="border p-2 rounded w-1/3" value={newTenant.idType} onChange={e=>setNewTenant({...newTenant, idType:e.target.value})}>
                     <option value="aadhar">Aadhar</option><option value="pan">PAN</option><option value="voter">Voter</option>
                   </select>
                   <input placeholder="ID Number" className="border p-2 rounded w-2/3" value={newTenant.idNumber} onChange={e=>setNewTenant({...newTenant, idNumber:e.target.value})} required />
                </div>
                <button className="bg-green-600 text-white py-2 rounded hover:bg-green-700">Create Tenant</button>
              </form>
            </div>

            {/* Right: Tenant List & Room Grid */}
            <div className="col-span-1 lg:col-span-2 space-y-8">
              {/* Room Grid Status */}
              <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="text-xl font-bold mb-4">Room Status</h3>
                <div className="grid grid-cols-5 gap-4">
                  {rooms.map(r => (
                    <div key={r._id} className={`p-3 rounded-lg text-center text-sm font-bold border ${r.status==='Vacant' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                      {r.roomNo}
                      <div className="text-xs font-normal opacity-70">{r.status}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tenant Table */}
              <div className="bg-white p-6 rounded-xl shadow">
                 <h3 className="text-xl font-bold mb-4">Current Tenants</h3>
                 <table className="w-full text-left">
                   <thead><tr className="border-b bg-gray-100"><th className="p-2">Name</th><th className="p-2">Room</th><th className="p-2">Deposit</th><th className="p-2">Action</th></tr></thead>
                   <tbody>
                     {tenants.map(t => (
                       <tr key={t._id} className="border-b">
                         <td className="p-2">{t.name}<br/><span className="text-xs text-gray-500">{t.email}</span></td>
                         <td className="p-2 font-bold">{t.roomNo}</td>
                         <td className="p-2">₹{t.deposit}</td>
                         <td className="p-2"><button onClick={()=>handleDeleteTenant(t._id)} className="text-red-600 hover:underline">Remove</button></td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;