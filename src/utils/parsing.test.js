// =====================================================================
// parsing.test.js
//
// Tests derivados del archivo real HORARIO_PNF_EDUCACION_ESPECIAL_II-2026.xlsx
// Cubre los 30 valores de celda observados en las hojas de secciones,
// más casos de regresión del formato v1.
// =====================================================================

import { describe, it, expect } from "vitest";
import { parseClase, normalizarPrograma } from "./parsing";

// Catálogo canónico tal como lo devuelve parseHojaDocentes() del Excel real
const CATALOGO = [
  "LISETH MORA",
  "OLEIDY BEATRIZ MONTERO DE GONZALEZ",
  "FRANCISCO JAVIER VÍLCHEZ RUÍZ",
  "ANILETH CAROLINA CALDERA RODRIGUEZ",
  "JORGE SULBARAN",
  "ALDEMARO JOSÉ FONSECA ANTUNEZ",
  "EDUDLAE CAROLINA BARRERA RIVERO",
  "GLORIA MARÍA FALCÓN DE CAÑIZALEZ",
  "JENIREE CAROLINA SAAVEDRA ISEA",
];

// ── Estrategia 1: separador \n (casos del Excel real) ────────────────

describe("parseClase — separador \\n con PROF. (formato v2 estándar)", () => {
  const casos = [
    {
      raw: "Proyecto I\nPROF. ANILETH CALDERA",
      materia: "Proyecto I",
      docente: "ANILETH CAROLINA CALDERA RODRIGUEZ",
    },
    {
      raw: "Tendencias, Enfoques y Modelos de la Pedagogía Contemporánea\nPROF. OLEIDY MONTERO",
      materia: "Tendencias, Enfoques y Modelos de la Pedagogía Contemporánea",
      docente: "OLEIDY BEATRIZ MONTERO DE GONZALEZ",
    },
    {
      raw: "ACREDITABLE\nPROF. JENIREE SAAVEDRA",
      materia: "ACREDITABLE",
      docente: "JENIREE CAROLINA SAAVEDRA ISEA",
    },
    {
      raw: "DESARROLLO HUMANO INTEGRAL\nPROF. FRANCISCO VILCHEZ",
      materia: "DESARROLLO HUMANO INTEGRAL",
      docente: "FRANCISCO JAVIER VÍLCHEZ RUÍZ",
    },
    {
      raw: "EDUCACION DESARROLLO Y SOCIEDAD\nPROF. OLEIDY MONTERO",
      materia: "EDUCACION DESARROLLO Y SOCIEDAD",
      docente: "OLEIDY BEATRIZ MONTERO DE GONZALEZ",
    },
    {
      raw: "SEMINARIO DE FORMACION SOCIOCRITICA I\nPROF. EDUGLAE BARRERA",
      materia: "SEMINARIO DE FORMACION SOCIOCRITICA I",
      docente: "EDUDLAE CAROLINA BARRERA RIVERO",
    },
    {
      raw: "PROYECTO II\nPROF. ANILETH CALDERA",
      materia: "PROYECTO II",
      docente: "ANILETH CAROLINA CALDERA RODRIGUEZ",
    },
    {
      raw: "Educación Ambiental para el Desarrollo Sustentable\nPROF. OLEIDY MONTERO",
      materia: "Educación Ambiental para el Desarrollo Sustentable",
      docente: "OLEIDY BEATRIZ MONTERO DE GONZALEZ",
    },
    {
      raw: "PROYECTO III\nPROF. GLORIA FALCON",
      materia: "PROYECTO III",
      docente: "GLORIA MARÍA FALCÓN DE CAÑIZALEZ",
    },
    {
      raw: "Educación Integral para Escolares con Dificultades de Aprendizaje\nPROF. LISETH MORA",
      materia: "Educación Integral para Escolares con Dificultades de Aprendizaje",
      docente: "LISETH MORA",
    },
    {
      raw: "Proyecto IV\nPROF. GLORIA FALCON",
      materia: "Proyecto IV",
      docente: "GLORIA MARÍA FALCÓN DE CAÑIZALEZ",
    },
    {
      raw: "SEMINARIO DE FORMACION SOCIOCRITICA II\nPROF. EDUGLAE BARRERA",
      materia: "SEMINARIO DE FORMACION SOCIOCRITICA II",
      docente: "EDUDLAE CAROLINA BARRERA RIVERO",
    },
    {
      raw: "ACTIVIDAD ACREDITABLE\nPROF. JENIREE SAAVEDRA",
      materia: "ACTIVIDAD ACREDITABLE",
      docente: "JENIREE CAROLINA SAAVEDRA ISEA",
    },
    {
      raw: "Prevención y Atención Integral Temprana\nPROF LISETH MORA",
      materia: "Prevención y Atención Integral Temprana",
      docente: "LISETH MORA",
    },
    {
      raw: "Educación Integral para la Persona Autista\nPROF. LISETH MORA",
      materia: "Educación Integral para la Persona Autista",
      docente: "LISETH MORA",
    },
  ];

  for (const { raw, materia, docente } of casos) {
    it(`"${materia.slice(0, 40)}…" → docente=${docente.split(" ")[0]}`, () => {
      const r = parseClase(raw, CATALOGO);
      expect(r.materia).toBe(materia);
      expect(r.docente).toBe(docente);
    });
  }
});

describe("parseClase — separador \\n sin punto (PROF sin punto)", () => {
  it("PROF sin punto — JORGE SULBARAN", () => {
    const r = parseClase("SEMINARIO DE FORMACION SOCIOCRITICA II\nPROF JORGE SULBARAN", CATALOGO);
    expect(r.materia).toBe("SEMINARIO DE FORMACION SOCIOCRITICA II");
    expect(r.docente).toBe("JORGE SULBARAN");
  });

  it("PROF sin punto — ALDEMARO FONSECA", () => {
    const r = parseClase("FORMACION CRITICA III\nPROF ALDEMARO FONSECA", CATALOGO);
    expect(r.materia).toBe("FORMACION CRITICA III");
    expect(r.docente).toBe("ALDEMARO JOSÉ FONSECA ANTUNEZ");
  });

  it("PROF sin punto — LISETH MORA", () => {
    const r = parseClase("Enseñanza y Adaptaciones Curriculares para la Lectura, Escritura y Matemática\nPROF LISETH MORA", CATALOGO);
    expect(r.materia).toBe("Enseñanza y Adaptaciones Curriculares para la Lectura, Escritura y Matemática");
    expect(r.docente).toBe("LISETH MORA");
  });
});

describe("parseClase — separador \\n con prof: (dos puntos, minúsculas)", () => {
  it("prof: minúscula con dos puntos — Eduglae Barrera", () => {
    const r = parseClase("planificacion de los entornos de enseñanza\nprof: Eduglae Barrera", CATALOGO);
    expect(r.materia).toBe("planificacion de los entornos de enseñanza");
    expect(r.docente).toBe("EDUDLAE CAROLINA BARRERA RIVERO");
  });

  it("prof: minúscula con dos puntos — evaluacion de los aprendizajes", () => {
    const r = parseClase("evaluacion de los aprendizajes\nprof: Eduglae Barrera", CATALOGO);
    expect(r.materia).toBe("evaluacion de los aprendizajes");
    expect(r.docente).toBe("EDUDLAE CAROLINA BARRERA RIVERO");
  });
});

describe("parseClase — separador en la misma línea (sin \\n)", () => {
  it("PROF: en misma línea — JENIREE SAAVEDRA", () => {
    const r = parseClase("ACREDITABLE PROF: JENIREE SAAVEDRA", CATALOGO);
    expect(r.materia).toBe("ACREDITABLE");
    expect(r.docente).toBe("JENIREE CAROLINA SAAVEDRA ISEA");
  });
});

describe("parseClase — typos en nombre del docente", () => {
  it("OLEYDY (typo) → OLEIDY BEATRIZ MONTERO DE GONZALEZ", () => {
    const r = parseClase("sistema alternativo de comunicación\nPROF. OLEYDY MONTERO", CATALOGO);
    expect(r.materia).toBe("sistema alternativo de comunicación");
    expect(r.docente).toBe("OLEIDY BEATRIZ MONTERO DE GONZALEZ");
  });

  it("EDUGLAE (typo de EDUDLAE) → EDUDLAE CAROLINA BARRERA RIVERO", () => {
    const r = parseClase("SEMINARIO DE FORMACION SOCIOCRITICA I\nPROF. EDUGLAE BARRERA", CATALOGO);
    expect(r.docente).toBe("EDUDLAE CAROLINA BARRERA RIVERO");
  });

  it("materia en minúsculas — educ. para la salud integral", () => {
    const r = parseClase("educ. para la salud integral\nPROF FRANCISCO VILCHEZ", CATALOGO);
    expect(r.materia).toBe("educ. para la salud integral");
    expect(r.docente).toBe("FRANCISCO JAVIER VÍLCHEZ RUÍZ");
  });
});

describe("parseClase — nombres parciales sin segundo nombre/apellido", () => {
  it("ANILETH CALDERA → ANILETH CAROLINA CALDERA RODRIGUEZ", () => {
    const r = parseClase("estrategia para la prevencion y atencion de transtornos conductuales\nPROF. ANILETH CALDERA", CATALOGO);
    expect(r.docente).toBe("ANILETH CAROLINA CALDERA RODRIGUEZ");
  });

  it("FRANCISCO VILCHEZ (sin tilde, sin segundo nombre) → FRANCISCO JAVIER VÍLCHEZ RUÍZ", () => {
    const r = parseClase("DESARROLLO HUMANO INTEGRAL\nPROF. FRANCISCO VILCHEZ", CATALOGO);
    expect(r.docente).toBe("FRANCISCO JAVIER VÍLCHEZ RUÍZ");
  });

  it("GLORIA FALCON (sin tilde, sin segundo apellido) → GLORIA MARÍA FALCÓN DE CAÑIZALEZ", () => {
    const r = parseClase("PROYECTO III\nPROF. GLORIA FALCON", CATALOGO);
    expect(r.docente).toBe("GLORIA MARÍA FALCÓN DE CAÑIZALEZ");
  });

  it("ALDEMARO FONSECA (sin segundo nombre, sin segundo apellido) → ALDEMARO JOSÉ FONSECA ANTUNEZ", () => {
    const r = parseClase("FORMACION CRITICA III\nPROF ALDEMARO FONSECA", CATALOGO);
    expect(r.docente).toBe("ALDEMARO JOSÉ FONSECA ANTUNEZ");
  });

  it("JENIREE SAAVEDRA → JENIREE CAROLINA SAAVEDRA ISEA", () => {
    const r = parseClase("ACREDITABLE\nPROF. JENIREE SAAVEDRA", CATALOGO);
    expect(r.docente).toBe("JENIREE CAROLINA SAAVEDRA ISEA");
  });
});

// ── Regresión: formato v1 (separador "Prof." en misma línea) ─────────

describe("parseClase — regresión formato v1", () => {
  it("Prof. con punto — v1 clásico", () => {
    const { materia, docente } = parseClase("Programación I Prof. Juan Pérez");
    expect(materia).toBe("Programación I");
    expect(docente).toBe("Juan Pérez");
  });

  it("Profa — variante femenina", () => {
    const { materia, docente } = parseClase("Matemáticas Profa Ana López");
    expect(materia).toBe("Matemáticas");
    expect(docente).toBe("Ana López");
  });

  it("sin catálogo — backward compatible", () => {
    const { materia, docente } = parseClase("Bases de Datos Prof. García");
    expect(materia).toBe("Bases de Datos");
    expect(docente).toBe("García");
  });
});

// ── Casos borde ───────────────────────────────────────────────────────

describe("parseClase — casos borde", () => {
  it("cadena vacía → materia y docente vacíos", () => {
    expect(parseClase("")).toEqual({ materia: "", docente: "" });
    expect(parseClase(null)).toEqual({ materia: "", docente: "" });
    expect(parseClase(undefined)).toEqual({ materia: "", docente: "" });
  });

  it("sin docente reconocible → materia=toda la cadena, docente=''", () => {
    const { materia, docente } = parseClase("ORIENTACION Y TUTORIA", CATALOGO);
    expect(materia).toBe("ORIENTACION Y TUTORIA");
    expect(docente).toBe("");
  });

  it("teléfono pegado al nombre → se descarta el teléfono", () => {
    const r = parseClase("Materia Prof. ALDEMARO FONSECA 041214229615", CATALOGO);
    expect(r.materia).toBe("Materia");
    expect(r.docente).toBe("ALDEMARO JOSÉ FONSECA ANTUNEZ");
  });

  it("sin catálogo con \\n — devuelve docente como aparece en celda", () => {
    const r = parseClase("Proyecto I\nPROF. ANILETH CALDERA");
    expect(r.materia).toBe("Proyecto I");
    expect(r.docente).toBe("ANILETH CALDERA");
  });
});

// ── normalizarPrograma ────────────────────────────────────────────────

describe("normalizarPrograma", () => {
  it("normaliza educacion especial con y sin tilde", () => {
    expect(normalizarPrograma("PNF EN EDUCACIÓN ESPECIAL")).toBe("PNF Educación Especial");
    expect(normalizarPrograma("PNF EN EDUCACION ESPECIAL")).toBe("PNF Educación Especial");
  });

  it("normaliza informática", () => {
    expect(normalizarPrograma("pnf informatica")).toBe("PNF Informática");
  });

  it("null → null", () => {
    expect(normalizarPrograma(null)).toBeNull();
  });
});
