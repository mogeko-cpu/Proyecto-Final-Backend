import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { currentUser } from './api';

export function useUser() {
  const [user, setUser] = useState(currentUser());
  useEffect(() => {
    const update = () => setUser(currentUser());
    window.addEventListener('sessionchange', update);
    return () => window.removeEventListener('sessionchange', update);
  }, []);
  return user;
}
export function StaffOnly({
  children,
  admin = false,
}: {
  children: React.ReactNode;
  admin?: boolean;
}) {
  const user = useUser();
  return user && (admin ? user.role === 'ADMIN' : user.role !== 'PUBLIC') ? (
    children
  ) : (
    <section className="panel public-view">
      <ShieldCheck size={36} />
      <h1>Bienvenido a Conserva</h1>
      <p>
        El inventario y las condiciones de conservación son de acceso institucional. Tu cuenta
        pública no tiene acceso a estos datos.
      </p>
      <Link className="button" to="/account">
        Administrar mi cuenta
      </Link>
    </section>
  );
}
