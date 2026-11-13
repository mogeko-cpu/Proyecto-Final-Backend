import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './Layout';
import { ScrollToTop } from './ScrollToTop';
import { StaffOnly } from './session';
import { AccountPage } from './pages/AccountPage';
import { AlertsPage } from './pages/AlertsPage';
import { DashboardPage } from './pages/DashboardPage';
import { DepositsPage } from './pages/DepositsPage';
import { EnvironmentPage } from './pages/EnvironmentPage';
import { LoginPage } from './pages/LoginPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { RecordDetail } from './pages/RecordDetail';
import { RecordsPage } from './pages/RecordsPage';
import { TasksPage } from './pages/TasksPage';
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
          <Route
            index
            element={
              <StaffOnly>
                <DashboardPage />
              </StaffOnly>
            }
          />
          <Route
            path="records"
            element={
              <StaffOnly>
                <RecordsPage />
              </StaffOnly>
            }
          />
          <Route
            path="records/:id"
            element={
              <StaffOnly>
                <RecordDetail />
              </StaffOnly>
            }
          />
          <Route
            path="alerts"
            element={
              <StaffOnly>
                <AlertsPage />
              </StaffOnly>
            }
          />
          <Route
            path="environment"
            element={
              <StaffOnly>
                <EnvironmentPage />
              </StaffOnly>
            }
          />
          <Route
            path="tasks"
            element={
              <StaffOnly>
                <TasksPage />
              </StaffOnly>
            }
          />
          <Route
            path="deposits"
            element={
              <StaffOnly admin>
                <DepositsPage />
              </StaffOnly>
            }
          />
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
