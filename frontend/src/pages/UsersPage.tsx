import { useState } from 'react';
import { Plus } from 'lucide-react';
import { api, Page, User } from '../api';
import {
  useData,
  Badge,
  ErrorNotice,
  Head,
  Pager,
  FormPanel,
  Field,
  Submit,
  useMutation,
  formData,
} from '../ui';

export function UsersPage() {
  const [page, setPage] = useState(1),
    [show, setShow] = useState(false);
  const result = useData<Page<User>>(`/users?page=${page}&limit=10&sort=name&order=ASC`);
  const { busy, error, run } = useMutation();
  return (
    <>
      <Head
        eyebrow="ACCESO INSTITUCIONAL"
        title="Usuarios y roles"
        description="Crea cuentas para el equipo de conservación."
        action={
          <button className="button" onClick={() => setShow(!show)}>
            <Plus size={17} /> Crear usuario
          </button>
        }
      />
      {show && (
        <FormPanel title="Nuevo usuario" onClose={() => setShow(false)}>
          <form
            className="form-grid"
            onSubmit={(e) => {
              const d = formData(e);
              void run(
                () =>
                  api('/users', {
                    method: 'POST',
                    body: JSON.stringify({ ...d, consent: d.consent === 'on' }),
                  }),
                () => {
                  setShow(false);
                  result.reload();
                },
              );
            }}
          >
            <Field label="Nombre">
              <input name="name" required minLength={2} maxLength={100} />
            </Field>
            <Field label="Correo">
              <input type="email" name="email" required />
            </Field>
            <Field label="Contraseña inicial (12–72 caracteres)">
              <input
                type="password"
                name="password"
                required
                minLength={12}
                maxLength={72}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Rol">
              <select name="role">
                <option value="STAFF">Personal CLENA</option>
                <option value="ADMIN">Administrador</option>
                <option value="PUBLIC">Usuario público</option>
              </select>
            </Field>
            <div className="span-all">
              <label className="check">
                <input name="consent" type="checkbox" required /> El titular ha aceptado el aviso de
                privacidad.
              </label>
              <ErrorNotice message={error} />
              <Submit busy={busy} />
            </div>
          </form>
        </FormPanel>
      )}
      <section className="panel">
        <ErrorNotice message={result.error} />
        {result.data?.items.map((u) => (
          <article className="task-item" key={u.id}>
            <span className="avatar">{u.name[0]}</span>
            <div>
              <h3>{u.name}</h3>
              <p className="muted">{u.email}</p>
            </div>
            <Badge value={u.role} />
          </article>
        ))}
        <Pager page={page} total={result.data?.total ?? 0} onPage={setPage} />
      </section>
    </>
  );
}
