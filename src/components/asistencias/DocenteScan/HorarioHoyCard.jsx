import { parseClase } from "../../../utils/parsing";
import { getHoraDisplayDeRegistro } from "../../../utils/time";
import "./DocenteScan.css";

function HorarioHoyCard({ horarioHoy, diaSemana }) {
  if (!Array.isArray(horarioHoy) || horarioHoy.length === 0) {
    return (
      <div className="scan-horario-empty">
        <div className="scan-horario-empty__label">
          {diaSemana ? `Horario de hoy (${diaSemana.charAt(0)}${diaSemana.slice(1).toLowerCase()})` : "Horario de hoy"}
        </div>
        <div className="scan-horario-empty__text">No tienes clases asignadas hoy según el sistema.</div>
      </div>
    );
  }

  return (
    <div className="scan-horario-card">
      <div className="scan-horario-card__label">
        {diaSemana ? `Tu horario de hoy (${diaSemana.charAt(0)}${diaSemana.slice(1).toLowerCase()})` : "Tu horario de hoy"}
      </div>
      <div className="scan-horario-list">
        {horarioHoy.map((clase, i) => {
          const { materia } = parseClase(clase.materia);
          return (
            <div key={i} className="scan-horario-item">
              <div className="scan-horario-item__materia">{materia || clase.materia}</div>
              <div className="scan-horario-item__row">
                <span className="scan-horario-item__seccion">Sección {clase.sheet}</span>
                <span className="scan-horario-item__hora">{getHoraDisplayDeRegistro(clase)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HorarioHoyCard;
