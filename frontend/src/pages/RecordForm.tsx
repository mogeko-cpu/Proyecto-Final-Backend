import { api, Deposit, Page, RecordFile } from '../api';
import { useData, ErrorNotice, Field, Submit, useMutation, formData } from '../ui';

export function RecordForm({ record, onSaved }: { record?: RecordFile; onSaved: () => void }) {
  const deposits = useData<Page<Deposit>>('/deposits?limit=100&sort=name&order=ASC');
  const { busy, error, run } = useMutation();
  return (
    <form
      className="form-grid"
      onSubmit={(e) => {
        const d = formData(e);
        void run(
          () =>
            api(record ? `/records/${record.id}` : '/records', {
              method: record ? 'PUT' : 'POST',
              body: JSON.stringify({ ...d, inspectionDays: Number(d.inspectionDays) }),
            }),
          onSaved,
        );
      }}
    >
      <Field label="Código único">
        <input name="code" required minLength={2} maxLength={40} defaultValue={record?.code} />
      </Field>
      <Field label="Título">
        <input name="title" required minLength={3} maxLength={200} defaultValue={record?.title} />
      </Field>
      <Field label="Depósito">
        <select name="depositId" required defaultValue={record?.depositId ?? ''}>
          <option value="" disabled>
            Selecciona un depósito
          </option>
          {deposits.data?.items.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Estantería">
        <input name="shelf" required maxLength={50} defaultValue={record?.shelf} />
      </Field>
      <Field label="Caja">
        <input name="box" required maxLength={50} defaultValue={record?.box} />
      </Field>
      <Field label="Inspeccionar cada (días)">
        <input
          name="inspectionDays"
          type="number"
          required
          min={1}
          max={365}
          defaultValue={record?.inspectionDays ?? 30}
        />
      </Field>
      <div className="span-all">
        <Field label="Descripción">
          <textarea name="description" maxLength={2000} defaultValue={record?.description ?? ''} />
        </Field>
      </div>
      <div className="span-all">
        <ErrorNotice message={error || deposits.error} />
        <Submit busy={busy} />
      </div>
    </form>
  );
}
