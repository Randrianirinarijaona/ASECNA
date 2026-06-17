import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Map, Users, Bell, TrendingUp, Plane, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks';
import { AIRPORTS } from '../../data/airportsData';
import './Dashboard.css';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: string;
}

function StatCard({ label, value, icon, color, trend }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color }}>{icon}</div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {trend && <div className="stat-trend">{trend}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const airportList = useMemo(() => Object.entries(AIRPORTS), []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="page dashboard-page">
      {/* Greeting */}
      <div className="dashboard-greeting">
        <div>
          <h1 className="page-title">
            {greeting}, {user?.username} 👋
          </h1>
          <p className="page-subtitle">
            Welcome to ASECNA Madagascar Terminals dashboard
          </p>
        </div>
        <div className="dashboard-date">
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          })}
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-grid">
        <StatCard
          label="Airports monitored"
          value={airportList.length}
          icon={<Plane size={20} />}
          color="rgba(99,102,241,0.15)"
          trend="↑ All operational"
        />
        <StatCard
          label="Active connections"
          value={42}
          icon={<TrendingUp size={20} />}
          color="rgba(34,197,94,0.15)"
          trend="↑ 12% this week"
        />
        <StatCard
          label="Notifications"
          value={3}
          icon={<Bell size={20} />}
          color="rgba(245,158,11,0.15)"
          trend="3 unread"
        />
        <StatCard
          label="System users"
          value={user?.role === 'admin' ? '—' : '—'}
          icon={<Users size={20} />}
          color="rgba(96,165,250,0.15)"
          trend={user?.role === 'admin' ? 'View admin panel' : 'Contact admin'}
        />
      </div>

      {/* Airport grid */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Airports</h2>
          <Link to="/" className="section-link">
            <Map size={14} /> View on map
          </Link>
        </div>
        <div className="airport-grid">
          {airportList.map(([key, airport]) => (
            <Link to="/" key={key} className="airport-card">
              <div className="airport-card-header">
                <div className="airport-status-dot" />
                <span className="airport-iata">{airport.iata.split(' ')[0]}</span>
              </div>
              <div className="airport-name">{airport.name}</div>
              <div className="airport-iata-full">{airport.iata}</div>
              <div className="airport-footer">
                <span className="badge badge-active">Operational</span>
                <ChevronRight size={14} className="airport-arrow" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Recent activity</h2>
        </div>
        <div className="card activity-card">
          {[
            { time: '09:42', msg: 'SFA section accessed — AMHS/RSTA (aero)', airport: 'TNR' },
            { time: '09:15', msg: 'Map view opened', airport: '—' },
            { time: 'Yesterday', msg: 'Account login', airport: '—' },
          ].map((item, i) => (
            <div key={i} className="activity-item">
              <span className="activity-time">{item.time}</span>
              <span className="activity-msg">{item.msg}</span>
              {item.airport !== '—' && (
                <span className="activity-tag">{item.airport}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}