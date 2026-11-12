import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { api, date, RecordFile } from '../api';
import { useData, Badge, ErrorNotice, Head, FormPanel, useMutation } from '../ui';
import { useUser } from '../session';
import { RecordForm } from './RecordForm';

export function RecordDetail() {
  const { id } = useParams();
  const record = useData<RecordFile>(`/records/${id}`);
  const [mode, setMode] = useState('');
  const { busy, error, run } = useMutation();
  const user = useUser();
  const navigate = useNavigate();
  const r = record.data;
  return (
    <>
      <Link className="back-link" to="/records">
        <ChevronLeft size={16} /> Inventario
      </Link>
      <ErrorNotice message={record.error} />
      {r && (
        <>
          <Head
            eyebrow={r.code}
            title={r.title}
            description={`Estantería ${r.shelf} · Caja ${r.box} · Revisión cada ${r.inspectionDays} días`}
          />
          <section className="panel record-summary">
            <Badge value={r.condition} />
            {r.archived && <strong>Expediente archivado</strong>}
            <p>{r.description || 'Sin descripción adicional.'}</p>
            <p className="muted">Próxima inspección: {date(r.nextInspectionAt)}</p>
            {!r.archived && (
              <div className="actions">
                <button className="button secondary" onClick={() => setMode('edit')}>
                  Editar expediente
                </button>
                {user?.role === 'ADMIN' && (
                  <button className="text-button danger" onClick={() => setMode('archive')}>
                    Archivar expediente
                  </button>
                )}
              </div>
            )}
          </section>
          {mode === 'edit' && (
            <FormPanel title="Editar expediente" onClose={() => setMode('')}>
              <RecordForm
                record={r}
                onSaved={() => {
                  setMode('');
                  record.reload();
                }}
              />
            </FormPanel>
          )}
          {mode === 'archive' && (
            <FormPanel title="Archivar este expediente" onClose={() => setMode('')}>
              <p>
                Se retirará del inventario activo y se resolverán sus alertas. El historial se
                conserva.
              </p>
              <ErrorNotice message={error} />
              <button
                className="button danger-button"
                disabled={busy}
                onClick={() =>
                  void run(
                    () => api(`/records/${id}`, { method: 'DELETE' }),
                    () => navigate('/records'),
                  )
                }
              >
                Confirmar archivo
              </button>
            </FormPanel>
          )}
        </>
      )}
    </>
  );
}
