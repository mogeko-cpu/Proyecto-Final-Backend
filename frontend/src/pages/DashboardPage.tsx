import { Link } from 'react-router-dom';
import {
  Activity,
  Archive,
  ArrowRight,
  Bell,
  ClipboardCheck,
  Droplets,
  Leaf,
  RefreshCw,
  ShieldCheck,
  Thermometer,
} from 'lucide-react';
import { Alert, date, Deposit, Page, Reading } from '../api';
import { useData, ErrorNotice, Head, Empty } from '../ui';
import { AlertCard } from './AlertCard';

type Dashboard = {
  records: number;
  critical: number;
  openAlerts: number;
  pendingTasks: number;
  overdue: number;
  prioritizedAlerts: Alert[];
  recentReadings: Reading[];
};
export function DashboardPage() {
  const { data, error, loading, reload } = useData<Dashboard>('/dashboard');
  const deposits = useData<Page<Deposit>>('/deposits?limit=100&sort=name&order=ASC');
  const names = Object.fromEntries((deposits.data?.items ?? []).map((d) => [d.id, d.name]));
  return (
    <>
      <Head
        eyebrow="CUIDADO DEL PATRIMONIO"
        title="Una mirada al archivo"
        description="Anticipa los riesgos. Protege lo que nos cuenta la historia."
        action={
          <button className="button secondary" onClick={reload}>
            <RefreshCw size={16} /> Actualizar
          </button>
        }
      />
      <ErrorNotice message={error || deposits.error} />
      {loading && !data ? (
        <p role="status">Cargando el estado del archivo…</p>
      ) : (
        data && (
          <>
            <section className="stats">
              {[
                [Archive, data.records, 'Expedientes activos', 'Patrimonio en seguimiento'],
                [
                  Bell,
                  data.openAlerts,
                  'Alertas abiertas',
                  `${data.critical} expedientes en estado crítico`,
                ],
                [
                  ClipboardCheck,
                  data.pendingTasks,
                  'Intervenciones pendientes',
                  'Acciones de conservación',
                ],
                [Activity, data.overdue, 'Inspecciones vencidas', 'Requieren una nueva revisión'],
              ].map(([Icon, value, label, sub], i) => {
                const I = Icon as typeof Leaf;
                return (
                  <article className={`stat stat-${i}`} key={String(label)}>
                    <div>
                      <span>{String(label)}</span>
                      <I size={20} />
                    </div>
                    <strong>{String(value).padStart(2, '0')}</strong>
                    <small>{String(sub)}</small>
                  </article>
                );
              })}
            </section>
            <section className="dashboard-grid">
              <div className="panel">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">ATENCIÓN PRIORITARIA</p>
                    <h2>Lo que necesita cuidado</h2>
                  </div>
                  <Link className="text-link" to="/alerts">
                    Ver todas <ArrowRight size={16} />
                  </Link>
                </div>
                {data.prioritizedAlerts.length ? (
                  data.prioritizedAlerts.map((a) => (
                    <AlertCard key={a.id} alert={a} deposit={names[a.depositId]} />
                  ))
                ) : (
                  <Empty text="No hay alertas abiertas. Sigue con las inspecciones programadas." />
                )}
                <div className="panel-foot">
                  <ShieldCheck size={17} /> Priorizadas por tipo de riesgo y antigüedad.
                </div>
              </div>
              <div className="panel environment-summary">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">ENTORNO DEL ARCHIVO</p>
                    <h2>Pulso ambiental</h2>
                  </div>
                  <span className="round-icon">
                    <Activity size={20} />
                  </span>
                </div>
                {data.recentReadings.length ? (
                  Object.values(
                    Object.fromEntries(
                      [...data.recentReadings].reverse().map((r) => [r.depositId, r]),
                    ),
                  ).map((r) => (
                    <div className="environment-card" key={r.id}>
                      <h3>{names[r.depositId] ?? 'Depósito'}</h3>
                      <p className="muted">Última lectura recibida</p>
                      <div className="measurements">
                        <div>
                          <Thermometer size={19} />
                          <strong>
                            {r.temperature}
                            <small> °C</small>
                          </strong>
                          <span>Temperatura</span>
                        </div>
                        <div>
                          <Droplets size={19} />
                          <strong>
                            {r.humidity}
                            <small> %</small>
                          </strong>
                          <span>Humedad relativa</span>
                        </div>
                      </div>
                      <small>{date(r.measuredAt)}</small>
                    </div>
                  ))
                ) : (
                  <Empty text="Aún no se han recibido lecturas." />
                )}
                <Link className="button secondary full" to="/environment">
                  Explorar monitoreo <ArrowRight size={16} />
                </Link>
                <p className="muted small">
                  Los rangos de demostración deben validarse con el personal de conservación.
                </p>
              </div>
            </section>
            <section className="care-banner">
              <div className="banner-symbol">
                <Leaf size={40} />
              </div>
              <div>
                <p className="eyebrow">CADA REVISIÓN CUENTA</p>
                <h2>La prevención también conserva la memoria.</h2>
                <p>Registra una inspección y mantén al día el estado de cada expediente.</p>
              </div>
              <Link className="button" to="/records">
                Ir al inventario <ArrowRight size={16} />
              </Link>
            </section>
          </>
        )
      )}
    </>
  );
}
