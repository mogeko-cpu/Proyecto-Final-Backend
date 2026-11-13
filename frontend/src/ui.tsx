import React, { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, FolderOpen, Leaf } from 'lucide-react';
import { api, labels } from './api';

export function useData<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api<T>(path)
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError((e as Error).message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [path, version]);
  return { data, error, loading, reload: () => setVersion((v) => v + 1) };
}
export function Badge({ value }: { value: string }) {
  return <span className={`badge ${value.toLowerCase()}`}>{labels[value] ?? value}</span>;
}
export function ErrorNotice({ message }: { message: string }) {
  return message ? (
    <div className="notice error" role="alert">
      {message}
    </div>
  ) : null;
}
export function Head({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="page-head">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {action}
    </header>
  );
}
export function Empty({ text = 'No hay registros para estos filtros.' }: { text?: string }) {
  return (
    <div className="empty">
      <FolderOpen size={30} />
      <p>{text}</p>
    </div>
  );
}
export function Pager({
  total,
  page,
  onPage,
}: {
  total: number;
  page: number;
  onPage: (n: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / 10));
  return (
    <div className="pager">
      <span>
        {total} registros · Página {page} de {pages}
      </span>
      <div>
        <button
          className="icon-button"
          aria-label="Página anterior"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft size={18} />
        </button>
        <button
          className="icon-button"
          aria-label="Página siguiente"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
export function FormPanel({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="panel form-panel">
      <div className="section-head">
        <h2>{title}</h2>
        <button type="button" className="text-button" onClick={onClose}>
          Cancelar
        </button>
      </div>
      {children}
    </section>
  );
}
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Submit({ busy, label = 'Guardar' }: { busy: boolean; label?: string }) {
  return (
    <button className="button" disabled={busy} type="submit">
      {busy ? 'Guardando…' : label}
      <ArrowRight size={16} />
    </button>
  );
}
export function useMutation() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function run(action: () => Promise<unknown>, done: () => void) {
    setBusy(true);
    setError('');
    try {
      await action();
      done();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, run };
}
export function formData(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  return Object.fromEntries(new FormData(e.currentTarget));
}
export function Brand() {
  return (
    <div className="brand">
      <span className="brand-icon">
        <Leaf size={24} />
      </span>
      <div>
        conserva<span>ARCHIVO HISTÓRICO · CLENA</span>
      </div>
    </div>
  );
}
