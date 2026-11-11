import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { api } from '../api';
import { Brand, ErrorNotice } from '../ui';

/** Página inicial de la base técnica: confirma que el frontend se comunica con la API. */
export function StatusPage() {
  const [status, setStatus] = useState('Consultando…');
  const [error, setError] = useState('');
  useEffect(() => {
    api<{ status: string; database: string }>('/health')
      .then((h) => setStatus(`API: ${h.status} · Base de datos: ${h.database}`))
      .catch((e) => setError((e as Error).message));
  }, []);
  return (
    <main className="privacy" id="main">
      <Brand />
      <h1>Conserva · CLENA P3</h1>
      <p>
        <Activity size={18} /> {status}
      </p>
      <ErrorNotice message={error} />
      <p className="muted">Base técnica lista. Los módulos se agregan en los siguientes PR.</p>
    </main>
  );
}
