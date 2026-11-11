import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { StatusPage } from './pages/StatusPage';

/** Rutas de la aplicación. Cada módulo agrega aquí sus páginas. */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StatusPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
