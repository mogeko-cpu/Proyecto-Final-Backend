import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus, Search } from 'lucide-react';
import { date, labels, Page, RecordFile } from '../api';
import { useData, Badge, ErrorNotice, Head, Empty, Pager, FormPanel } from '../ui';
import { RecordForm } from './RecordForm';

export function RecordsPage() {
  const [q, setQ] = useState(''),
    [status, setStatus] = useState(''),
    [page, setPage] = useState(1),
    [show, setShow] = useState(false),
    [sort, setSort] = useState('createdAt');
  const data = useData<Page<RecordFile>>(
    `/records?page=${page}&limit=10&archived=false&q=${encodeURIComponent(q)}&status=${status}&sort=${sort}&order=DESC`,
  );
  return (
    <>
      <Head
        eyebrow="INVENTARIO DOCUMENTAL"
        title="Expedientes bajo cuidado"
        description="Ubicación, estado de conservación y trazabilidad en un solo lugar."
        action={
          <button className="button" onClick={() => setShow(!show)}>
            <Plus size={17} /> Nuevo expediente
          </button>
        }
      />
      {show && (
        <FormPanel title="Registrar expediente" onClose={() => setShow(false)}>
          <RecordForm
            onSaved={() => {
              setShow(false);
              data.reload();
            }}
          />
        </FormPanel>
      )}
      <section className="panel">
        <div className="filters">
          <label className="search">
            <Search size={18} />
            <input
              aria-label="Buscar expediente"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por código o título…"
            />
          </label>
          <select
            aria-label="Filtrar por estado"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos los estados</option>
            {['OPTIMO', 'REGULAR', 'CRITICO'].map((s) => (
              <option key={s} value={s}>
                {labels[s]}
              </option>
            ))}
          </select>
          <select
            aria-label="Ordenar expedientes"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            <option value="createdAt">Más recientes</option>
            <option value="title">Título (Z–A)</option>
            <option value="nextInspectionAt">Próxima inspección (desc.)</option>
          </select>
        </div>
        <ErrorNotice message={data.error} />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Expediente</th>
                <th>Ubicación</th>
                <th>Estado</th>
                <th>Próxima inspección</th>
                <th>
                  <span className="sr-only">Detalle</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.data?.items.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link className="record-title" to={`/records/${r.id}`}>
                      {r.title}
                    </Link>
                    <small>{r.code}</small>
                  </td>
                  <td>
                    Est. {r.shelf}
                    <small>Caja {r.box}</small>
                  </td>
                  <td>
                    <Badge value={r.condition} />
                  </td>
                  <td>{date(r.nextInspectionAt)}</td>
                  <td>
                    <Link aria-label={`Ver ${r.code}`} to={`/records/${r.id}`}>
                      <ArrowRight size={18} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.loading ? (
          <p className="loading" role="status">
            Cargando inventario…
          </p>
        ) : (
          data.data?.total === 0 && <Empty />
        )}
        <Pager page={page} total={data.data?.total ?? 0} onPage={setPage} />
      </section>
    </>
  );
}
