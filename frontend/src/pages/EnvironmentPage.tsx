import { useState } from 'react';
import { Activity, Droplets, Plus, RefreshCw, Thermometer } from 'lucide-react';
import { api, date, Deposit, Page, Reading } from '../api';
import {
  useData,
  ErrorNotice,
  Head,
  Empty,
  Pager,
  FormPanel,
  Field,
  Submit,
  useMutation,
  formData,
} from '../ui';

export function EnvironmentPage() {
  const [page, setPage] = useState(1),
    [deposit, setDeposit] = useState(''),
    [show, setShow] = useState(false);
  const deposits = useData<Page<Deposit>>('/deposits?limit=100&sort=name&order=ASC');
  const readings = useData<Page<Reading>>(
    `/readings?page=${page}&limit=10&sort=measuredAt&order=DESC${deposit ? `&depositId=${deposit}` : ''}`,
  );
  const names = Object.fromEntries((deposits.data?.items ?? []).map((d) => [d.id, d.name]));
  const { busy, error, run } = useMutation();
  return (
    <>
      <Head
        eyebrow="CONDICIONES DEL ENTORNO"
        title="Monitoreo ambiental"
        description="Temperatura y humedad relativa registradas por depósito."
        action={
          <button className="button" onClick={() => setShow(!show)}>
            <Plus size={17} /> Registrar lectura
          </button>
        }
      />
      {show && (
        <FormPanel title="Lectura manual o simulada" onClose={() => setShow(false)}>
          <form
            className="form-grid"
            onSubmit={(e) => {
              const d = formData(e);
              void run(
                () =>
                  api('/readings', {
                    method: 'POST',
                    body: JSON.stringify({
                      ...d,
                      temperature: Number(d.temperature),
                      humidity: Number(d.humidity),
                      measuredAt: new Date().toISOString(),
                    }),
                  }),
                () => {
                  setShow(false);
                  readings.reload();
                },
              );
            }}
          >
            <Field label="Depósito">
              <select name="depositId" required>
                <option value="">Selecciona un depósito</option>
                {deposits.data?.items.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Identificador del sensor">
              <input
                name="sensorId"
                defaultValue="MANUAL-01"
                required
                minLength={2}
                maxLength={80}
              />
            </Field>
            <Field label="Temperatura (°C)">
              <input name="temperature" type="number" step="0.1" min={-50} max={80} required />
            </Field>
            <Field label="Humedad relativa (%)">
              <input name="humidity" type="number" step="0.1" min={0} max={100} required />
            </Field>
            <div className="span-all">
              <ErrorNotice message={error} />
              <Submit busy={busy} label="Registrar lectura" />
            </div>
          </form>
        </FormPanel>
      )}
      <div className="notice">
        <Activity size={19} />
        <span>
          Los umbrales son configurables por depósito. El simulador de sensores también envía
          lecturas a esta API.
        </span>
      </div>
      <section className="panel">
        <div className="filters">
          <label>
            Depósito{' '}
            <select
              value={deposit}
              onChange={(e) => {
                setDeposit(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos los depósitos</option>
              {deposits.data?.items.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <button className="text-button" onClick={readings.reload}>
            <RefreshCw size={16} /> Actualizar
          </button>
        </div>
        <ErrorNotice message={readings.error || deposits.error} />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Depósito / sensor</th>
                <th>Temperatura</th>
                <th>Humedad relativa</th>
                <th>Medición</th>
              </tr>
            </thead>
            <tbody>
              {readings.data?.items.map((r) => (
                <tr key={r.id}>
                  <td>
                    {names[r.depositId]}
                    <small>{r.sensorId}</small>
                  </td>
                  <td>
                    <Thermometer className="inline-icon" size={16} />
                    {r.temperature} °C
                  </td>
                  <td>
                    <Droplets className="inline-icon" size={16} />
                    {r.humidity} %
                  </td>
                  <td>{date(r.measuredAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {readings.data?.total === 0 && <Empty />}
        <Pager page={page} total={readings.data?.total ?? 0} onPage={setPage} />
      </section>
    </>
  );
}
