import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './Layout';
import { ScrollToTop } from './ScrollToTop';
import { StaffOnly } from './session';
import { AccountPage } from './pages/AccountPage';
import { LoginPage } from './pages/LoginPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { UsersPage } from './pages/UsersPage';

/** Rutas de la aplicación. Cada módulo agrega aquí sus páginas. */
export function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <a className="skip-link" href="#main">
        Saltar al contenido
      </a>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/account" replace />} />
          <Route
            path="users"
            element={
              <StaffOnly admin>
                <UsersPage />
              </StaffOnly>
            }
          />
          <Route path="account" element={<AccountPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
