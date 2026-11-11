import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Activity, BookOpen, ShieldCheck } from 'lucide-react';
import { api, signIn } from '../api';
import { ErrorNotice, Field, Submit, useMutation, formData, Brand } from '../ui';
import { useUser } from '../session';

export function LoginPage() {
  const [register, setRegister] = useState(false);
  const { busy, error, run } = useMutation();
  const user = useUser();
  if (user) return <Navigate to="/" replace />;
  return (
    <div className="login">
      <section className="login-story">
        <Brand />
        <div>
          <p className="eyebrow">MEMORIA QUE PERMANECE</p>
          <h1>
            Cuidar el presente.
            <br />
            <em>Conservar la historia.</em>
          </h1>
          <p>
            Una mirada atenta al patrimonio documental. Monitoreo y prevención para el Archivo
            Histórico del CLENA.
          </p>
          <div className="story-lines">
            <span>
              <ShieldCheck /> Prevención de riesgos
            </span>
            <span>
              <Activity /> Seguimiento ambiental
            </span>
            <span>
              <BookOpen /> Memoria documental
            </span>
          </div>
        </div>
        <small>Corporación Luis Eduardo Nieto Arteta · Barranquilla</small>
      </section>
      <section className="login-form">
        <div>
          <p className="eyebrow">BIENVENIDO A CONSERVA</p>
          <h2>{register ? 'Crea tu cuenta' : 'Tu archivo, bajo cuidado.'}</h2>
          <p className="muted">
            {register
              ? 'Las cuentas nuevas tienen acceso público.'
              : 'Ingresa con tu cuenta para continuar.'}
          </p>
          <form
            onSubmit={(e) => {
              const d = formData(e);
              void run(
                async () => {
                  if (register)
                    await api('/auth/register', {
                      method: 'POST',
                      body: JSON.stringify({ ...d, consent: d.consent === 'on' }),
                    });
                  await signIn(String(d.email), String(d.password));
                },
                () => {},
              );
            }}
          >
            {register && (
              <Field label="Nombre">
                <input name="name" required minLength={2} maxLength={100} autoComplete="name" />
              </Field>
            )}
            <Field label="Correo electrónico">
              <input
                name="email"
                type="email"
                required
                autoComplete="username"
                placeholder="tu.correo@ejemplo.com"
              />
            </Field>
            <Field label="Contraseña">
              <input
                name="password"
                type="password"
                required
                minLength={register ? 12 : 1}
                maxLength={72}
                autoComplete={register ? 'new-password' : 'current-password'}
              />
            </Field>
            {register && (
              <label className="check">
                <input name="consent" type="checkbox" required /> Acepto el{' '}
                <Link to="/privacy">aviso de privacidad</Link>.
              </label>
            )}
            <ErrorNotice message={error} />
            <Submit busy={busy} label={register ? 'Crear cuenta' : 'Iniciar sesión'} />
          </form>
          <button className="text-button" onClick={() => setRegister(!register)}>
            {register ? 'Ya tengo cuenta' : 'Crear una cuenta pública'}
          </button>
          <p className="login-note">
            Acceso institucional para archivistas y restauradores.
            <br />
            <Link to="/privacy">Privacidad y uso de datos</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
