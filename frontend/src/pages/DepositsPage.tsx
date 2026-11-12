import { useState } from 'react';
import { Archive, Plus } from 'lucide-react';
import { api, Deposit, Page } from '../api';
import {
  useData,
  ErrorNotice,
  Head,
  Pager,
  FormPanel,
  Field,
  Submit,
  useMutation,
  formData,
} from '../ui';

export function DepositsPage() {
  const [page, setPage] = useState(1);
  const result = useData<Page<Deposit>>(`/deposits?page=${page}&limit=10&sort=name&order=ASC`);
  const [edit, setEdit] = useState<Deposit | 'new' | null>(null);
  const { busy, error, run } = useMutation();
  const d = edit && edit !== 'new' ? edit : null;
  return (
    <>
      <Head
        eyebrow="CONFIGURACIÓN DEL ARCHIVO"
        title="Depósitos y umbrales"
        description="Define los rangos ambientales que activan las alertas."
        action={
          <button className="button" onClick={() => setEdit('new')}>
            <Plus size={17} /> Nuevo depósito
          </button>
        }
      />
      <div className="notice">
        Los valores semilla son ilustrativos. El personal de conservación debe definir los rangos
        adecuados para cada colección.
      </div>
      {edit && (
        <FormPanel title={d ? 'Editar depósito' : 'Nuevo depósito'} onClose={() => setEdit(null)}>
          <form
            key={d?.id ?? 'new'}
            className="form-grid"
            onSubmit={(e) => {
              const data = formData(e);
              void run(
                () =>
                  api(d ? `/deposits/${d.id}` : '/deposits', {
                    method: d ? 'PUT' : 'POST',
                    body: JSON.stringify({
                      ...data,
                      tempMin: Number(data.tempMin),
                      tempMax: Number(data.tempMax),
                      humidityMin: Number(data.humidityMin),
                      humidityMax: Number(data.humidityMax),
                    }),
                  }),
                () => {
                  setEdit(null);
                  result.reload();
                },
              );
            }}
          >
            <div className="span-all">
              <Field label="Nombre">
                <input name="name" required minLength={2} maxLength={100} defaultValue={d?.name} />
              </Field>
            </div>
            {(['tempMin', 'tempMax', 'humidityMin', 'humidityMax'] as const).map((key, i) => (
              <Field
                key={key}
                label={
                  [
                    'Temperatura mínima (°C)',
                    'Temperatura máxima (°C)',
                    'Humedad mínima (%)',
                    'Humedad máxima (%)',
                  ][i]
                }
              >
                <input
                  name={key}
                  type="number"
                  step="0.1"
                  required
                  min={i < 2 ? -50 : 0}
                  max={i < 2 ? 80 : 100}
                  defaultValue={d?.[key]}
                />
              </Field>
            ))}
            <div className="span-all">
              <ErrorNotice message={error} />
              <Submit busy={busy} />
              <p className="muted small">
                Los cambios de umbral se evalúan al recibir la próxima lectura.
              </p>
            </div>
          </form>
        </FormPanel>
      )}
      <section className="panel">
        <ErrorNotice message={result.error} />
        {result.data?.items.map((d) => (
          <article className="task-item" key={d.id}>
            <div className="task-marker">
              <Archive />
            </div>
            <div>
              <h3>{d.name}</h3>
              <p className="muted">
                Temperatura: {d.tempMin}–{d.tempMax} °C · Humedad: {d.humidityMin}–{d.humidityMax} %
              </p>
            </div>
            <button className="button secondary" onClick={() => setEdit(d)}>
              Editar
            </button>
          </article>
        ))}
        <Pager page={page} total={result.data?.total ?? 0} onPage={setPage} />
      </section>
    </>
  );
}
