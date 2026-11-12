import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bell } from 'lucide-react';
import { Alert, date } from '../api';
import { Badge } from '../ui';

export function AlertCard({
  alert: a,
  deposit,
  children,
}: {
  alert: Alert;
  deposit?: string;
  children?: React.ReactNode;
}) {
  return (
    <article className={`alert-card priority-${a.priority}`}>
      <span className="alert-icon">
        <Bell size={18} />
      </span>
      <div className="alert-content">
        <div className="alert-meta">
          <Badge value={a.kind} />
          <span>Prioridad {a.priority}</span>
          <Badge value={a.status} />
        </div>
        <p>{a.message}</p>
        <small>
          {deposit ?? 'Archivo Histórico'} <span>·</span> {date(a.createdAt)}
        </small>
        {a.recordId && (
          <Link className="text-link" to={`/records/${a.recordId}`}>
            Abrir expediente <ArrowRight size={14} />
          </Link>
        )}
        {children}
      </div>
    </article>
  );
}
