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

const Loading = () => <div className="grid h-64 place-items-center"><div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-navy-900" /></div>;
const S = (el) => <Suspense fallback={<Loading />}>{el}</Suspense>;

function App() {
  const token = useAuth((s) => s.token);
  if (!token) return <Login />;
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/hotels" element={S(<Hotels />)} />
        <Route path="/room-types" element={S(<Masters kind="room-types" />)} />
        <Route path="/meal-plans" element={S(<Masters kind="meal-plans" />)} />
        <Route path="/leads" element={S(<Leads />)} />
        <Route path="/users" element={S(<UsersPage />)} />
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
