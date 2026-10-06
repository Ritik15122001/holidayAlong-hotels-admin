import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import Shell from './components/Shell.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { useAuth } from './store/useAdmin';

const Hotels = lazy(() => import('./pages/Hotels.jsx'));
const Masters = lazy(() => import('./pages/Masters.jsx'));
const Leads = lazy(() => import('./pages/Leads.jsx'));
const UsersPage = lazy(() => import('./pages/Users.jsx'));
const Places = lazy(() => import('./pages/Places.jsx'));
const Vendors = lazy(() => import('./pages/Vendors.jsx'));
const Brochures = lazy(() => import('./pages/Brochures.jsx'));
const Formats = lazy(() => import('./pages/Formats.jsx'));
const Amenities = lazy(() => import('./pages/Amenities.jsx'));
const Finance = lazy(() => import('./pages/Finance.jsx'));
const Documents = lazy(() => import('./pages/Documents.jsx'));
const Staff = lazy(() => import('./pages/Staff.jsx'));

const Loading = () => <div className="grid h-64 place-items-center"><div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-navy-900" /></div>;
const S = (el) => <Suspense fallback={<Loading />}>{el}</Suspense>;

/** Typing a URL must not reach an area this account cannot use. */
function Gate({ area, children }) {
  const can = useAuth((s) => s.can);
  if (can(area)) return children;
  return (
    <div className="card p-12 text-center">
      <p className="text-[17px] font-bold text-slate-900">No access to this area</p>
      <p className="mt-1.5 text-[13.5px] text-slate-500">Your account does not have rights here. Ask a Super Admin if you need them.</p>
    </div>
  );
}

function App() {
  const token = useAuth((s) => s.token);
  if (!token) return <Login />;
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/hotels" element={S(<Gate area="hotels"><Hotels /></Gate>)} />
        <Route path="/cities" element={S(<Gate area="cities"><Places kind="cities" /></Gate>)} />
        <Route path="/locations" element={S(<Gate area="locations"><Places kind="locations" /></Gate>)} />
        <Route path="/amenities" element={S(<Gate area="amenities"><Amenities /></Gate>)} />
        <Route path="/room-types" element={S(<Gate area="room-types"><Masters kind="room-types" /></Gate>)} />
        <Route path="/meal-plans" element={S(<Gate area="meal-plans"><Masters kind="meal-plans" /></Gate>)} />
        <Route path="/vendors" element={S(<Gate area="vendors"><Vendors /></Gate>)} />
        <Route path="/brochures" element={S(<Gate area="brochures"><Brochures /></Gate>)} />
        <Route path="/formats" element={S(<Gate area="formats"><Formats /></Gate>)} />
        <Route path="/leads" element={S(<Gate area="leads"><Leads /></Gate>)} />
        <Route path="/users" element={S(<Gate area="users"><UsersPage /></Gate>)} />
        <Route path="/finance" element={S(<Gate area="finance"><Finance /></Gate>)} />
        <Route path="/documents" element={S(<Gate area="documents"><Documents /></Gate>)} />
        <Route path="/staff" element={S(<Gate area="staff"><Staff /></Gate>)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
