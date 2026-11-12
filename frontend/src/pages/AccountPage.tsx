import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, saveSession } from '../api';
import { Badge, ErrorNotice, Head, Field, Submit, useMutation, formData } from '../ui';
import { useUser } from '../session';

export function AccountPage() {
  const user = useUser();
  const [deleting, setDeleting] = useState(false);
  const { busy, error, run } = useMutation();
  return (
    <>
      <Head
        eyebrow="TU SESIÓN"
        title="Mi cuenta"
        description="Información de acceso y control de tus datos."
      />
      <section className="panel record-summary">
        <h2>{user?.name}</h2>
        <p>{user?.email}</p>
        <Badge value={user?.role ?? 'PUBLIC'} />
        <p>Los datos del inventario son de acceso restringido al personal autorizado.</p>
        <Link to="/privacy">Consultar aviso de privacidad</Link>
        <hr />
        <button className="text-button danger" onClick={() => setDeleting(!deleting)}>
          Eliminar mi cuenta
        </button>
        {deleting && (
          <form
            onSubmit={(e) => {
              const d = formData(e);
              void run(
                () => api('/auth/account', { method: 'DELETE', body: JSON.stringify(d) }),
                () => saveSession(null),
              );
            }}
          >
            <p>
              Tu nombre y correo se anonimizarán y se cerrarán tus sesiones. Las inspecciones e
              intervenciones institucionales conservarán una referencia anónima.
            </p>
            <Field label="Confirma tu contraseña">
              <input type="password" name="password" required autoComplete="current-password" />
            </Field>
            <ErrorNotice message={error} />
            <Submit busy={busy} label="Confirmar eliminación" />
          </form>
        )}
      </section>
    </>
  );
}
