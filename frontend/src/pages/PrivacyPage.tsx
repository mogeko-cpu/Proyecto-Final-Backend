import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Brand } from '../ui';

export function PrivacyPage() {
  return (
    <main className="privacy">
      <Brand />
      <h1>Aviso de privacidad</h1>
      <p>
        Conserva es un prototipo académico del proyecto P3 para el Archivo Histórico del CLENA.
        Utiliza datos ficticios durante la demostración.
      </p>
      <h2>Datos y finalidad</h2>
      <p>
        Se solicitan nombre, correo, contraseña (almacenada como hash), rol y fecha de
        consentimiento para administrar el acceso y atribuir inspecciones e intervenciones. El
        inventario no es público.
      </p>
      <h2>Control de tus datos</h2>
      <p>
        Puedes consultar tus datos y solicitar la eliminación desde Mi cuenta. El sistema anonimiza
        el nombre y correo, revoca las sesiones y mantiene referencias anónimas en el historial de
        conservación.
      </p>
      <h2>Antes del uso institucional</h2>
      <p>
        El CLENA y la universidad deben validar el responsable del tratamiento, el canal de
        atención, los plazos de conservación y el texto definitivo. No se deben registrar datos
        personales reales hasta completar esa validación.
      </p>
      <Link className="button" to="/">
        Volver a Conserva <ArrowRight size={16} />
      </Link>
    </main>
  );
}
