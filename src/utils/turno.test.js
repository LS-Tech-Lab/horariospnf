// =====================================================================
// turno.test.js — Mejora 9: cobertura para detección de turno
//
// getTurnoByCodigo y normalizeTurno determinan si una hoja del Excel
// corresponde al turno diurno o vespertino. Un error aquí asigna mal
// el turno de secciones completas durante la importación.
// =====================================================================

import { describe, it, expect } from "vitest";
import { getTurnoByCodigo, normalizeTurno, getTurnoFromHora } from "./turno";

describe("getTurnoByCodigo", () => {
  it("detecta DIURNO cuando el penúltimo dígito es 1", () => {
    expect(getTurnoByCodigo("SEC11")).toBe("DIURNO");
  });

  it("detecta VESPERTINO cuando el penúltimo dígito es 2", () => {
    expect(getTurnoByCodigo("SEC21")).toBe("VESPERTINO");
  });

  it("ignora dígitos que no corresponden a la posición penúltima", () => {
    // dígitos extraídos de "SEC202" son "202"; el penúltimo es "0" → null
    expect(getTurnoByCodigo("SEC202")).toBeNull();
  });

  it("devuelve null si el penúltimo dígito no es 1 ni 2", () => {
    expect(getTurnoByCodigo("SEC303")).toBeNull();
  });

  it("devuelve null si no hay suficientes dígitos en el nombre", () => {
    expect(getTurnoByCodigo("SEC1")).toBeNull();
    expect(getTurnoByCodigo("ABC")).toBeNull();
  });

  it("devuelve null para entrada vacía o nula", () => {
    expect(getTurnoByCodigo("")).toBeNull();
    expect(getTurnoByCodigo(null)).toBeNull();
  });
});

describe("normalizeTurno", () => {
  it("normaliza MATUTINO y DIURNO al mismo valor", () => {
    expect(normalizeTurno("MATUTINO")).toBe("DIURNO");
    expect(normalizeTurno("DIURNO")).toBe("DIURNO");
  });

  it("normaliza VESPERTINO (y la variante con error de tipeo histórico)", () => {
    expect(normalizeTurno("VESPERTINO")).toBe("VESPERTINO");
    expect(normalizeTurno("VESPETINO")).toBe("VESPERTINO");
  });

  it("es insensible a mayúsculas/minúsculas y espacios", () => {
    expect(normalizeTurno("  diurno  ")).toBe("DIURNO");
  });

  it("devuelve null para un valor no reconocido", () => {
    expect(normalizeTurno("NOCTURNO")).toBeNull();
  });

  it("devuelve null para entrada vacía o nula", () => {
    expect(normalizeTurno("")).toBeNull();
    expect(normalizeTurno(null)).toBeNull();
  });
});

describe("getTurnoFromHora", () => {
  it("detecta DIURNO para horas dentro del rango matutino", () => {
    expect(getTurnoFromHora("7:00AM-7:45AM")).toBe("DIURNO");
    expect(getTurnoFromHora("12:00PM-12:45PM")).toBe("DIURNO");
  });

  it("detecta VESPERTINO para horas dentro del rango de tarde", () => {
    expect(getTurnoFromHora("1:00PM-1:45PM")).toBe("VESPERTINO");
    expect(getTurnoFromHora("5:30PM-6:15PM")).toBe("VESPERTINO");
  });

  it("devuelve null para horas fuera de ambos rangos", () => {
    expect(getTurnoFromHora("9:00PM-9:45PM")).toBeNull();
  });

  it("devuelve null para entrada vacía", () => {
    expect(getTurnoFromHora("")).toBeNull();
  });
});
