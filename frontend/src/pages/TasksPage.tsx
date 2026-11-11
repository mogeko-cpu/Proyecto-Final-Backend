import { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { api, date, labels, Page, Task, User } from '../api';
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

export function TasksPage() {
  const [page, setPage] = useState(1),
    [status, setStatus] = useState(''),
    [editing, setEditing] = useState<Task | null>(null);
  const result = useData<Page<Task>>(
    `/tasks?page=${page}&limit=10&sort=dueAt&order=ASC&status=${status}`,
  );
  const users = useData<Page<User>>('/users?limit=100');
  const names = Object.fromEntries((users.data?.items ?? []).map((u) => [u.id, u.name]));
  const user = useUser();
  const { busy, error, run } = useMutation();
  return (
    <>
      <Head
        eyebrow="DEL HALLAZGO A LA ACCIÓN"
        title="Intervenciones"
        description="Organiza el trabajo de cuidado y documenta cada acción realizada."
      />
      {editing && (
        <FormPanel title="Actualizar intervención" onClose={() => setEditing(null)}>
          <form
            onSubmit={(e) => {
              const d = formData(e);
              void run(
                () => api(`/tasks/${editing.id}`, { method: 'PATCH', body: JSON.stringify(d) }),
                () => {
                  setEditing(null);
                  result.reload();
                },
              );
            }}
          >
            <Field label="Nuevo estado">
              <select name="status">
                {editing.status === 'PENDING' && <option value="IN_PROGRESS">En curso</option>}
                <option value="DONE">Completada</option>
              </select>
            </Field>
            <Field label="Resultado de la intervención (obligatorio al completar)">
              <textarea name="resolution" maxLength={2000} defaultValue={editing.resolution} />
            </Field>
            <ErrorNotice message={error} />
            <Submit busy={busy} />
            <p className="muted small">
              Al completar, registra una inspección o lectura para comprobar si el riesgo
              desapareció.
            </p>
          </form>
        </FormPanel>
      )}
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
              <option value="">Todos</option>
              {['PENDING', 'IN_PROGRESS', 'DONE'].map((s) => (
                <option key={s} value={s}>
                  {labels[s]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <ErrorNotice message={result.error || users.error} />
        {result.data?.items.map((t) => (
          <article className="task-item" key={t.id}>
            <div className="task-marker">
              <ClipboardCheck size={22} />
            </div>
            <div>
              <Badge value={t.status} />
              <h3>{t.title}</h3>
              <p className="muted">
                {names[t.assigneeId] ?? 'Responsable'} · Límite: {date(t.dueAt)}
              </p>
              {t.resolution && <p>{t.resolution}</p>}
            </div>
            {t.status !== 'DONE' && (user?.role === 'ADMIN' || t.assigneeId === user?.id) && (
              <button className="button secondary" onClick={() => setEditing(t)}>
                Actualizar
              </button>
            )}
          </article>
        ))}
        {result.data?.total === 0 && (
          <Empty text="No hay intervenciones. Asigna una desde el módulo de alertas." />
        )}
        <Pager page={page} total={result.data?.total ?? 0} onPage={setPage} />
      </section>
    </>
  );
}
