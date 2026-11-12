import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BookOpen, ChevronLeft, Plus } from 'lucide-react';
import { api, date, Inspection, Page, RecordFile } from '../api';
import {
  useData,
  Badge,
  ErrorNotice,
  Head,
  Empty,
  Pager,
  FormPanel,
  Field,
  Submit,
  useMutation,
  formData,
} from '../ui';
import { useUser } from '../session';
import { RecordForm } from './RecordForm';

export function RecordDetail() {
  const { id } = useParams();
  const record = useData<RecordFile>(`/records/${id}`);
  const [page, setPage] = useState(1);
  const history = useData<Page<Inspection>>(`/records/${id}/inspections?page=${page}&limit=10`);
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
            action={
              !r.archived && (
                <button className="button" onClick={() => setMode('inspect')}>
                  <Plus size={17} /> Registrar inspección
                </button>
              )
            }
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
          {mode === 'inspect' && (
            <FormPanel title="Nueva inspección" onClose={() => setMode('')}>
              <form
                onSubmit={(e) => {
                  const d = formData(e);
                  void run(
                    () =>
                      api(`/records/${id}/inspections`, {
                        method: 'POST',
                        body: JSON.stringify({
                          ...d,
                          pests: d.pests === 'on',
                          wear: d.wear === 'on',
                          moisture: d.moisture === 'on',
                        }),
                      }),
                    () => {
                      setMode('');
                      record.reload();
                      history.reload();
                    },
                  );
                }}
              >
                <Field label="Estado de conservación">
                  <select name="condition">
                    <option value="OPTIMO">Óptimo</option>
                    <option value="REGULAR">Regular</option>
                    <option value="CRITICO">Crítico</option>
                  </select>
                </Field>
                <div className="checks">
                  {[
                    ['moisture', 'Humedad visible'],
                    ['pests', 'Indicios de plagas'],
                    ['wear', 'Desgaste'],
                  ].map(([name, label]) => (
                    <label className="check" key={name}>
                      <input type="checkbox" name={name} />
                      {label}
                    </label>
                  ))}
                </div>
                <Field label="Hallazgos y observaciones">
                  <textarea name="notes" required minLength={10} maxLength={2000} />
                </Field>
                <ErrorNotice message={error} />
                <Submit busy={busy} label="Registrar inspección" />
              </form>
            </FormPanel>
          )}
          <section className="panel">
            <div className="section-head">
              <h2>Historial de conservación</h2>
              <BookOpen size={21} />
            </div>
            <ErrorNotice message={history.error} />
            {history.data?.items.map((i) => (
              <article className="history-item" key={i.id}>
                <div>
                  <Badge value={i.condition} />
                  <small>{date(i.createdAt)}</small>
                </div>
                <p>{i.notes}</p>
                <div className="muted small">
                  {[
                    i.moisture && 'Humedad visible',
                    i.pests && 'Indicios de plagas',
                    i.wear && 'Desgaste',
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'Sin factores adicionales registrados'}
                </div>
              </article>
            ))}
            {history.data?.total === 0 && (
              <Empty text="Este expediente aún no tiene inspecciones." />
            )}
            <Pager total={history.data?.total ?? 0} page={page} onPage={setPage} />
          </section>
        </>
      )}
    </>
  );
}
