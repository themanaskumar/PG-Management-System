import { useEffect, useState } from 'react';
import api from '../utils/axiosInstance';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

const AdminDashboard = () => {
  const { logout, user } = useAuth();
  const [activeView, setActiveView] = useState('menu');
  
  const [complaints, setComplaints] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);

  // Rent Tracking
  const [trackMonth, setTrackMonth] = useState(MONTHS[new Date().getMonth()]);
  const [trackYear, setTrackYear] = useState(new Date().getFullYear());
  const [trackingData, setTrackingData] = useState([]);

  const [compFilter, setCompFilter] = useState('All');
  const [newTenant, setNewTenant] = useState({ name: '', email: '', password: '', phone: '', roomNo: '', deposit: '', idType: 'aadhar', idNumber: '' });

  useEffect(() => {
    if (activeView === 'rent') fetchTrackedRents();
    if (activeView === 'complaint') fetchComplaints();
    if (activeView === 'tenant') { fetchTenants(); fetchRooms(); }
  }, [activeView, trackMonth, trackYear]);

  const fetchTrackedRents = async () => {
    try {
      const { data } = await api.get(`/rent/track?month=${trackMonth}&year=${trackYear}`);
      setTrackingData(data);
    } catch (e) { console.error(e); }
  };

  const fetchComplaints = async () => { try { const { data } = await api.get('/complaints'); setComplaints(data); } catch(e){} };
  const fetchTenants = async () => { try { const { data } = await api.get('/admin/tenants'); setTenants(data); } catch(e){} };
  const fetchRooms = async () => { try { const { data } = await api.get('/admin/rooms'); setRooms(data); } catch(e){} };

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

  const handleAddTenant = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/signup', newTenant);
      toast.success('Tenant Added');
      setNewTenant({ name: '', email: '', password: '', phone: '', roomNo: '', deposit: '', idType: 'aadhar', idNumber: '' });
      fetchTenants(); fetchRooms();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
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

        {activeView === 'menu' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <MenuCard title="Rent Tracking" desc="Track monthly payments" color="bg-blue-600" view="rent" />
            <MenuCard title="Complaints" desc="Track issues" color="bg-orange-500" view="complaint" />
            <MenuCard title="Tenant Management" desc="Manage Tenants & Rooms" color="bg-green-600" view="tenant" />
          </div>
        )}

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

        {/* --- COMPLAINT VIEW (UPDATED WITH PHOTO COLUMN) --- */}
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
                       
                       {/* NEW PHOTO COLUMN */}
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

        {activeView === 'tenant' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow col-span-1 h-fit">
              <h3 className="text-xl font-bold mb-6 text-gray-700">Add Tenant</h3>
              <form onSubmit={handleAddTenant} className="flex flex-col gap-4">
                <input placeholder="Name" className="border p-3 rounded" value={newTenant.name} onChange={e=>setNewTenant({...newTenant, name:e.target.value})} required />
                <input placeholder="Email" type="email" className="border p-3 rounded" value={newTenant.email} onChange={e=>setNewTenant({...newTenant, email:e.target.value})} required />
                <input placeholder="Password" type="password" className="border p-3 rounded" value={newTenant.password} onChange={e=>setNewTenant({...newTenant, password:e.target.value})} required />
                <div className="flex gap-2"><input placeholder="Phone" className="border p-3 w-1/2" value={newTenant.phone} onChange={e=>setNewTenant({...newTenant, phone:e.target.value})} required /><input placeholder="Deposit" type="number" className="border p-3 w-1/2" value={newTenant.deposit} onChange={e=>setNewTenant({...newTenant, deposit:e.target.value})} required /></div>
                <select className="border p-3 rounded" value={newTenant.roomNo} onChange={e=>setNewTenant({...newTenant, roomNo:e.target.value})} required>
                  <option value="">Select Room</option>{rooms.filter(r => r.status === 'Vacant').map(r => <option key={r._id} value={r.roomNo}>{r.roomNo}</option>)}
                </select>
                <div className="flex gap-2"><select className="border p-3 w-1/3" value={newTenant.idType} onChange={e=>setNewTenant({...newTenant, idType:e.target.value})}><option value="aadhar">Aadhar</option><option value="pan">PAN</option></select><input placeholder="ID Number" className="border p-3 w-2/3" value={newTenant.idNumber} onChange={e=>setNewTenant({...newTenant, idNumber:e.target.value})} required /></div>
                <button className="bg-green-600 text-white py-3 rounded font-bold">Create</button>
              </form>
            </div>
            <div className="col-span-1 lg:col-span-2 space-y-8">
              <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="text-xl font-bold mb-4">Rooms</h3>
                <div className="grid grid-cols-4 gap-4">{rooms.map(r => <div key={r._id} className={`p-3 rounded text-center border ${r.status==='Vacant'?'bg-green-50 border-green-200 text-green-700':'bg-red-50 border-red-200 text-red-700'}`}><div className="font-bold">{r.roomNo}</div><div className="text-xs">{r.status==='Vacant'?'Vacant':r.currentTenant?.name}</div></div>)}</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow">
                 <h3 className="text-xl font-bold mb-4">Tenants</h3>
                 <table className="w-full text-left text-sm"><thead><tr><th>Name</th><th>Room</th><th>Phone</th><th>Action</th></tr></thead><tbody>{tenants.map(t => <tr key={t._id} className="border-b"><td className="p-2">{t.name}</td><td className="p-2 font-bold text-blue-600">{t.roomNo}</td><td className="p-2">{t.phone}</td><td className="p-2"><button onClick={()=>handleDeleteTenant(t._id)} className="text-red-500 hover:underline">Remove</button></td></tr>)}</tbody></table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default AdminDashboard;