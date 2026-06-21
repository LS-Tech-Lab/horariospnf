import React from 'react';
import { S } from '../constants';

export default function StatCard({ label, value, icon, color = "#2563EB" }) {
  return (
    <div style={{ ...S.card, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 20, color }} aria-hidden="true" />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#0F172A", lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 12, color: "#64748B", marginTop: 2, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}
