// Submenú "Asistencias" dentro del módulo Horarios.
// Wrapper delgado: la lógica vive en PlanillaImprimibleBase (compartida
// con la pestaña "Planilla" del módulo Asistencias QR). Este componente
// solo pasa los datos que ya están disponibles vía AppDataContext.
import React from 'react';
import PlanillaImprimibleBase from './asistencias/PlanillaImprimibleBase';

export default function AsistenciasView({ data, getDocName, getMateriaName, lapso }) {
  return (
    <PlanillaImprimibleBase
      data={data}
      getDocName={getDocName}
      getMateriaName={getMateriaName}
      lapso={lapso}
    />
  );
}
