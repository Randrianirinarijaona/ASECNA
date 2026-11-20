import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Map, Users, Wrench, Link2, Plane, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks';
import { airportService, linkService } from '../../services/network.service';
// ⚠️ Adapter ce chemin si adminService est exporté ailleurs
import { adminService } from '../../services/api.service';
import type { Airport, AdminStats, ActivityLog } from '../../types';
// @ts-ignore: CSS side-effect import handled by build tooling
import './Dashboard.css';

type AirportWithKey = Airport & { key: string };

interface LinkLite {
  status: string;
  fromAirportKey: string;
  toAirportKey: string;
}

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

function formatLogTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [airports, setAirports] = useState<AirportWithKey[]>([]);
  const [links, setLinks] = useState<LinkLite[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      // Données accessibles à tous les rôles
      const [airportsRes, linksRes] = await Promise.allSettled([
        airportService.list(),
        linkService.list(),
      ]);

      // Données réservées à l'admin (403 pour technicien / user → on ne les appelle pas)
      let statsRes: PromiseSettledResult<AdminStats> | null = null;
      let logsRes: PromiseSettledResult<{ items: ActivityLog[] }> | null = null;
      if (isAdmin) {
        [statsRes, logsRes] = await Promise.allSettled([
          adminService.getStats(),
          adminService.getLogs(1, 5),
        ]) as [PromiseSettledResult<AdminStats>, PromiseSettledResult<{ items: ActivityLog[] }>];
      }

      if (cancelled) return;

      if (airportsRes.status === 'fulfilled') {
        setAirports(airportsRes.value as unknown as AirportWithKey[]);
      } else {
        setError((airportsRes.reason as Error)?.message ?? 'Chargement impossible');
      }
      if (linksRes.status === 'fulfilled') setLinks(linksRes.value as unknown as LinkLite[]);
      if (statsRes?.status === 'fulfilled') setStats(statsRes.value);
      if (logsRes?.status === 'fulfilled') setLogs(logsRes.value.items ?? []);

      setIsLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  // Vrais aéroports uniquement (les points techniques sont exclus)
  const realAirports = useMemo(
    () => airports.filter((a) => !a.isTechnicalPoint),
    [airports]
  );

  // Un aéroport est "en maintenance" si un de ses items SMA/SRNA, un de ses
  // sous-paramètres ou une de ses liaisons n'est pas opérationnel.
  const maintenanceKeys = useMemo(() => {
    const keys = new Set<string>();
    airports.forEach((a) => {
      const items = Object.values(a.sections ?? {}).flat();
      const itemIssue = items.some(
        (i) =>
          i.status === 'maintenance' ||
          (i.subParameters ?? []).some((s) => s.status === 'maintenance')
      );
      if (itemIssue) keys.add(a.key);
    });
    links.forEach((l) => {
      if (l.status !== 'operational') {
        keys.add(l.fromAirportKey);
        keys.add(l.toAirportKey);
      }
    });
    return keys;
  }, [airports, links]);

  const operationalLinks = links.filter((l) => l.status === 'operational').length;
  const issueCount = realAirports.filter((a) => maintenanceKeys.has(a.key)).length;
  // Nombre de LIAISONS en maintenance (et non de points techniques / aéroports)
  const maintenanceLinks = links.filter((l) => l.status === 'maintenance').length;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="page dashboard-page">
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

      {error && (
        <div className="card" role="alert" style={{ padding: 16, marginBottom: 16 }}>
          Impossible de charger les données : {error}
        </div>
      )}

      <div className="stats-grid">
        <StatCard
          label="Airports monitored"
          value={isLoading ? '…' : realAirports.length}
          icon={<Plane size={20} />}
          color="rgba(99, 102, 241, 0.12)"
          trend={
            isLoading
              ? undefined
              : issueCount === 0
                ? '↑ All operational'
                : `${issueCount} with maintenance`
          }
        />
        <StatCard
          label="Active connections"
          value={isLoading ? '…' : operationalLinks}
          icon={<Link2 size={20} />}
          color="rgba(34, 197, 94, 0.12)"
          trend={isLoading ? undefined : `${links.length} link(s) in total`}
        />
        <StatCard
          label="Links in maintenance"
          value={isLoading ? '…' : maintenanceLinks}
          icon={<Wrench size={20} />}
          color="rgba(245, 158, 11, 0.12)"
          trend={
            isLoading
              ? undefined
              : maintenanceLinks === 0
                ? 'Nothing to report'
                : 'Needs attention'
          }
        />
        <StatCard
          label="System users"
          value={isAdmin ? (stats ? stats.totalUsers : '…') : '—'}
          icon={<Users size={20} />}
          color="rgba(96, 165, 250, 0.12)"
          trend={
            isAdmin
              ? stats
                ? `${stats.activeUsers} active`
                : undefined
              : 'Contact admin'
          }
        />
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Airports</h2>
          <Link to="/" className="section-link">
            <Map size={15} /> View on map
          </Link>
        </div>
        <div className="airport-grid">
          {!isLoading && realAirports.length === 0 && !error && (
            <p>Aucun aéroport en base. Lancez <code>python -m app.seed</code>.</p>
          )}
          {realAirports.map((airport) => {
            const hasIssue = maintenanceKeys.has(airport.key);
            const iata = airport.iata || airport.key;
            return (
              <Link to="/" key={airport.key} className="airport-card">
                <div className="airport-card-header">
                  <div className="airport-status-dot" />
                  <span className="airport-iata">{iata.split(' ')[0]}</span>
                </div>
                <div className="airport-card-body-content">
                  <div className="airport-name">{airport.name}</div>
                  <div className="airport-iata-full">{iata}</div>
                </div>
                <div className="airport-footer">
                  <span className="badge-status-dot">
                    {hasIssue ? 'Maintenance' : 'Operational'}
                  </span>
                  <ChevronRight size={16} className="airport-arrow" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Recent activity</h2>
        </div>
        <div className="card activity-card">
          {!isAdmin && (
            <div className="activity-item">
              <span className="activity-msg">
                Le journal d'activité est réservé aux administrateurs.
              </span>
            </div>
          )}
          {isAdmin && logs.length === 0 && (
            <div className="activity-item">
              <span className="activity-msg">Aucune activité enregistrée.</span>
            </div>
          )}
          {logs.map((log) => (
            <div key={log.id} className="activity-item">
              <span className="activity-time">{formatLogTime(log.createdAt)}</span>
              <span className="activity-msg">{log.action}</span>
              <span className="activity-tag">{log.username}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
