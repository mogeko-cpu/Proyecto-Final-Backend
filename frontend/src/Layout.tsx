import { useState } from 'react';
import { Link, Navigate, NavLink, Outlet } from 'react-router-dom';
import { BookOpen, LogOut, ShieldCheck } from 'lucide-react';
import { labels, signOut } from './api';
import { ErrorNotice, Brand } from './ui';
import { useUser } from './session';
import { staffLinks, adminLinks } from './navigation';

export function Layout() {
  const user = useUser();
  const [logoutError, setLogoutError] = useState('');
  if (!user) return <Navigate to="/login" replace />;
  const internal = user.role !== 'PUBLIC';
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <p className="nav-caption">ESPACIO DE TRABAJO</p>
        <nav aria-label="Navegación principal">
          {internal &&
            staffLinks.map(({ path, icon: Icon, title }) => (
              <NavLink key={path} to={path} end={path === '/'}>
                <Icon size={19} />
                {title}
              </NavLink>
            ))}
          {user.role === 'ADMIN' && (
            <>
              <p className="nav-caption">ADMINISTRACIÓN</p>
              {adminLinks.map(({ path, icon: Icon, title }) => (
                <NavLink key={path} to={path}>
                  <Icon size={19} /> {title}
                </NavLink>
              ))}
            </>
          )}
          <NavLink to="/account">
            <ShieldCheck size={19} /> Mi cuenta
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="institution">
            <BookOpen size={21} />
            <p>
              El valor de nuestra memoria.<span>Un expediente a la vez.</span>
            </p>
          </div>
          <div className="profile">
            <span className="avatar">{user.name.slice(0, 1)}</span>
            <div>
              <strong>{user.name}</strong>
              <small>{labels[user.role]}</small>
            </div>
            <button
              className="icon-button"
              aria-label="Cerrar sesión"
              onClick={() => void signOut().catch((e) => setLogoutError((e as Error).message))}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <div className="topbar">
          <span>
            CLENA <span className="separator">/</span> Conservación documental
          </span>
          <span className="live">
            <span /> Sistema de conservación
          </span>
        </div>
        <main id="main">
          <ErrorNotice message={logoutError} />
          <Outlet />
        </main>
        <footer>
          CONSERVA <span>Patrimonio documental, cuidado colectivo.</span>
          <Link to="/privacy">Privacidad</Link>
        </footer>
      </div>
    </div>
  );
}
