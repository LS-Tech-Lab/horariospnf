// Capa de caché IndexedDB para reportes de asistencias diarias.
// Permite que ReporteAsistencias funcione en modo offline mostrando
// el último resultado guardado para cada combinación de filtros.

const DB_NAME  = 'sigma_offline';
const STORE    = 'reportes_asistencias';
const DB_VER   = 2; // v1 = asistencias_pendientes, v2 agrega reportes_asistencias

function abrirDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      // Store de la cola offline (ya existe en v1)
      if (!db.objectStoreNames.contains('asistencias_pendientes')) {
        db.createObjectStore('asistencias_pendientes', { keyPath: 'id', autoIncrement: true });
      }
      // Store nuevo para caché de reportes
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'clave' });
      }
    };
    req.onsuccess = e => res(e.target.result);
    req.onerror   = e => rej(e.target.error);
  });
}

// Genera una clave única por combinación de filtros
export function claveReporte(fecha, turno, programa) {
  return `${fecha}__${turno}__${programa || 'todos'}`;
}

export async function guardarReporteEnIDB(fecha, turno, programa, datos) {
  try {
    const db = await abrirDB();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({
      clave:      claveReporte(fecha, turno, programa),
      fecha,
      turno,
      programa:   programa || '',
      datos,
      guardadoEn: Date.now(),
    });
    return new Promise((res, rej) => {
      tx.oncomplete = res;
      tx.onerror    = rej;
    });
  } catch (err) {
    // No crítico — fallar silenciosamente
    console.warn('[reporteCache] No se pudo guardar en IDB:', err);
  }
}

export async function cargarReporteDeIDB(fecha, turno, programa) {
  try {
    const db  = await abrirDB();
    const tx  = db.transaction(STORE, 'readonly');
    const key = claveReporte(fecha, turno, programa);
    return new Promise((res, rej) => {
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => res(req.result ?? null);  // { datos, guardadoEn, ... } | null
      req.onerror   = () => rej(req.error);
    });
  } catch {
    return null;
  }
}
