import { Routes, Route, Outlet } from 'react-router-dom';
import { PrivateRoute, AdminRoute } from './RouteGuards';
import { AppLayout } from '../components/layout/AppLayout';

import Login from '../pages/auth/Login';
import Dashboard from '../pages/dashboard/Dashboard';
import MapPage from '../pages/map/MapPage';
import Profile from '../pages/profile/Profile';
import Settings from '../pages/settings/Settings';
import Admin from '../pages/admin/Admin';
import NotFound from '../pages/not-found/NotFound';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout><Outlet /></AppLayout>}>
          <Route path="/" element={<MapPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />

          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}