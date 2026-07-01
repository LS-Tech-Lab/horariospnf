import Shell from "./Shell";
import "./DocenteScan.css";

function SelectorTipo({ onElegir }) {
  return (
    <Shell>
      <div className="scan-selector-header">
        <div className="scan-selector-icon-wrap">
          <i className="ti ti-qrcode scan-selector-icon" aria-hidden="true" />
        </div>
        <h1 className="scan-selector-title">
          Control de Asistencia
        </h1>
        <p className="scan-selector-subtitle">
          ¿Qué deseas registrar?
        </p>
      </div>

      <button
        onClick={() => onElegir("ENTRADA")}
        className="scan-btn-primary"
      >
        <i className="ti ti-login scan-selector-btn-icon" aria-hidden="true" />
        Marcar Entrada
      </button>

      <button
        onClick={() => onElegir("SALIDA")}
        className="scan-btn-secondary"
      >
        <i className="ti ti-logout scan-selector-btn-icon" aria-hidden="true" />
        Marcar Salida
      </button>

      <p className="scan-selector-footer-hint">
        Debes marcar tu entrada antes de poder marcar la salida.
      </p>
    </Shell>
  );
}

export default SelectorTipo;
