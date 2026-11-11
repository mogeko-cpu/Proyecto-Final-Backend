import { api, Page, User } from '../api';
import { useData, ErrorNotice, Field, Submit, useMutation, formData } from '../ui';

export function TaskForm({ alertId, onSaved }: { alertId: string; onSaved: () => void }) {
  const users = useData<Page<User>>('/users?limit=100&sort=name&order=ASC');
  const { busy, error, run } = useMutation();
  return (
    <form
      className="form-grid"
      onSubmit={(e) => {
        const d = formData(e);
        void run(
          () =>
            api('/tasks', {
              method: 'POST',
              body: JSON.stringify({
                ...d,
                alertId,
                dueAt: new Date(String(d.dueAt)).toISOString(),
              }),
            }),
          onSaved,
        );
      }}
    >
      <Field label="Intervención a realizar">
        <input name="title" required minLength={5} maxLength={200} />
      </Field>
      <Field label="Responsable">
        <select name="assigneeId" required>
          <option value="">Selecciona personal</option>
          {users.data?.items
            .filter((u) => u.role !== 'PUBLIC')
            .map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
        </select>
      </Field>
      <Field label="Fecha límite">
        <input name="dueAt" type="datetime-local" required />
      </Field>
      <div className="span-all">
        <ErrorNotice message={error || users.error} />
        <Submit busy={busy} label="Asignar intervención" />
      </div>
    </form>
  );
}
