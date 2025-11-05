import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
adminAddBus,
adminAddRoute,
adminAddSchedule,
adminDeleteBus,
adminDeleteRoute,
adminDeleteSchedule,
adminUpdateSchedule // <-- 1. IMPORT
} from '../services/apiService';
import AddForm from '../components/admin/AddForm';
import UpdateScheduleModal from '../components/admin/UpdateScheduleModal'; // <-- 2. IMPORT

const API_URL = 'http://localhost:8080/api/admin';

// --- Form Definitions (static part) ---
const busFormFields = [
{ name: 'regNumber', label: 'Registration Number', type: 'text', placeholder: 'MH01AB1234' },
{ name: 'capacity', label: 'Capacity', type: 'number', placeholder: '40' },
{ name: 'busType', label: 'Bus Type', type: 'text', placeholder: 'AC Sleeper' }
];

const routeFormFields = [
{ name: 'source', label: 'Source', type: 'text', placeholder: 'Mumbai' },
{ name: 'destination', label: 'Destination', type: 'text', placeholder: 'Pune' }
];

function AdminDashboard() {
const [buses, setBuses] = useState([]);
const [routes, setRoutes] = useState([]);
const [schedules, setSchedules] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const { token } = useAuth();
// --- 3. ADD NEW STATE for the modal ---
const [editingSchedule, setEditingSchedule] = useState(null);

const fetchData = useCallback(async () => {
setLoading(true);
try {
const headers = {
'Content-Type': 'application/json',
'Authorization': `Bearer ${token}`
};
const [busRes, scheduleRes, routeRes] = await Promise.all([
fetch(`${API_URL}/bus`, { headers }),
fetch(`${API_URL}/schedule`, { headers }),
fetch(`${API_URL}/route`, { headers })
]);
if (!busRes.ok || !scheduleRes.ok || !routeRes.ok) throw new Error('Failed to fetch admin data');
const busData = await busRes.json();
const scheduleData = await scheduleRes.json();
const routeData = await routeRes.json();

setBuses(busData);
setSchedules(scheduleData);
setRoutes(routeData);

} catch (err) {
setError(err.message);
} finally {
setLoading(false);
}
}, [token]);

useEffect(() => {
if (token) {
fetchData();
}
}, [fetchData, token]);

// --- Handlers for Forms ---
const handleAddBus = (data) => (
adminAddBus(data, token).then(fetchData)
);

const handleAddRoute = (data) => (
adminAddRoute(data, token).then(fetchData)
);

const handleAddSchedule = (data) => {
const formattedData = {
...data,
departureTime: data.departureTime.replace('T', ' '),
arrivalTime: data.arrivalTime.replace('T', ' ')
};
return adminAddSchedule(formattedData, token).then(fetchData);
};
const handleDelete = async (type, id) => {
const confirmMsg = `Are you sure you want to delete this ${type}? ...`;
if (!window.confirm(confirmMsg)) return;

try {
if (type === 'bus') await adminDeleteBus(id, token);
else if (type === 'route') await adminDeleteRoute(id, token);
else if (type === 'schedule') await adminDeleteSchedule(id, token);
fetchData();
} catch (err) {
alert(`Error: ${err.message}`);
}
};

// --- 4. ADD NEW HANDLER for updating ---
const handleUpdateSchedule = async (scheduleId, formData) => {
try {
const result = await adminUpdateSchedule(scheduleId, formData, token);
alert(result.message);
setEditingSchedule(null); // Close the modal
fetchData(); // Refresh the list
} catch (err) {
alert(`Error: ${err.message}`);
}
};

// --- Dynamic Schedule Fields ---
const scheduleFormFields = [
{
name: 'busId',
label: 'Select Bus',
type: 'select',
defaultOption: 'Choose a bus...',
options: buses.map(bus => ({
value: bus.BusID,
label: `${bus.RegNumber} (${bus.BusType})`
}))
},
{
name: 'routeId',
label: 'Select Route',
type: 'select',
defaultOption: 'Choose a route...',
options: routes.map(route => ({
value: route.RouteID,
label: `${route.Source} to ${route.Destination}`
}))
},
{ name: 'departureTime', label: 'Departure Time', type: 'datetime-local' },
{ name: 'arrivalTime', label: 'Arrival Time', type: 'datetime-local' },
{ name: 'fare', label: 'Fare', type: 'number', placeholder: '650.00' },
{ name: 'availableSeats', label: 'Available Seats', type: 'number', placeholder: '40' }
];

// --- Render ---
const formatDate = (dateString) => new Date(dateString).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
if (loading) return <div className="p-8 text-center">Loading admin data...</div>;
if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

return (
<div className="container max-w-6xl p-8 mx-auto">
<h1 className="mb-6 text-3xl font-bold">Admin Dashboard</h1>

<div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
<AddForm title="Bus" formFields={busFormFields} onSubmit={handleAddBus} />
<AddForm title="Route" formFields={routeFormFields} onSubmit={handleAddRoute} />
<AddForm title="Schedule" formFields={scheduleFormFields} onSubmit={handleAddSchedule} />
</div>

<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
{/* Manage Buses */}
<div className="mb-8">
<h2 className="mb-4 text-2xl font-semibold">Manage Buses</h2>
<div className="p-4 bg-white rounded-lg shadow max-h-96 overflow-y-auto">
<ul className="divide-y divide-gray-200">
{buses.map(bus => (
<li key={bus.BusID} className="flex items-center justify-between py-3">
<div>
<span className="font-medium">{bus.RegNumber} ({bus.BusType})</span>
<span className="block text-sm text-gray-600">{bus.Capacity} Seats</span>
</div>
<button
onClick={() => handleDelete('bus', bus.BusID)}
className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded hover:bg-red-600"
>
Delete
</button>
</li>
))}
</ul>
</div>
</div>
{/* Manage Schedules */}
<div>
<h2 className="mb-4 text-2xl font-semibold">Manage Schedules</h2>
<div className="p-4 bg-white rounded-lg shadow max-h-96 overflow-y-auto">
<div className="space-y-4">
{schedules.map(sch => (
<div key={sch.ScheduleID} className="p-3 border rounded">
<div className="flex items-start justify-between">
<div>
<strong className="text-blue-700">{sch.Source} to {sch.Destination}</strong>
<p className="text-sm">Bus: {sch.RegNumber}</p>
<p className="text-sm">Time: {formatDate(sch.DepartureTime)}</p>
<p className="text-sm">Fare: ₹{sch.Fare} | Seats: {sch.AvailableSeats}</p>
</div>
{/* --- 5. ADD EDIT/DELETE BUTTONS --- */}
<div className="flex flex-col space-y-2">
<button
onClick={() => setEditingSchedule(sch)} // Open modal
className="px-2 py-1 text-xs font-medium text-white bg-yellow-500 rounded hover:bg-yellow-600"
>
Edit
</button>
<button
onClick={() => handleDelete('schedule', sch.ScheduleID)}
className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded hover:bg-red-600"
>
Delete
</button>
</div>
</div>
</div>
))}
</div>
</div>
</div>
</div>

{/* --- 6. RENDER THE MODAL --- */}
<UpdateScheduleModal
schedule={editingSchedule}
onClose={() => setEditingSchedule(null)}
onSave={handleUpdateSchedule}
/>
</div>
);
}

export default AdminDashboard;
