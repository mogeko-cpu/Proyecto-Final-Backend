import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { api, Alert, Page } from '../api';
import { useData, ErrorNotice, Head, Empty, Pager, useMutation } from '../ui';
import { AlertCard } from './AlertCard';

export function AlertsPage() {
  const [page, setPage] = useState(1),
    [status, setStatus] = useState('OPEN');
  const result = useData<Page<Alert>>(
    `/alerts?page=${page}&limit=10&sort=priority&order=ASC&status=${status}`,
  );
  const { busy, error, run } = useMutation();
  return (
    <>
      <Head
        eyebrow="PREVENCIÓN Y RESPUESTA"
        title="Alertas de conservación"
        description="Estado crítico, condiciones ambientales y revisiones pendientes."
        action={
          <button
            className="button secondary"
            disabled={busy}
            onClick={() =>
              void run(() => api('/alerts/evaluate', { method: 'POST' }), result.reload)
            }
          >
            <RefreshCw size={16} /> Evaluar vencimientos
          </button>
        }
      />
      <ErrorNotice message={error} />
      <section className="panel">
        <div className="filters">
          <label>
            Estado{' '}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="OPEN">Abiertas</option>
              <option value="RESOLVED">Resueltas</option>
              <option value="">Todas</option>
            </select>
          </label>
          <span className="muted small">Prioridad 1: crítica · 2: ambiental · 3: vencimiento</span>
        </div>
        <ErrorNotice message={result.error} />
        {result.data?.items.map((a) => (
          <AlertCard key={a.id} alert={a} />
        ))}
        {result.data?.total === 0 && <Empty text="No hay alertas en este estado." />}
        <Pager page={page} total={result.data?.total ?? 0} onPage={setPage} />
      </section>
    </>
  );
}
