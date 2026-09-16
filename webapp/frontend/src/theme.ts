/** Espelha os tokens de cor definidos em index.css (@theme) para uso em SVG/Recharts. */
export const COLORS = {
  surface: "#14162f",
  surfaceHi: "#1b1e3d",
  border: "rgba(255,255,255,0.08)",
  textPrimary: "#f5f5fb",
  textSecondary: "#b7b8d1",
  textMuted: "#7d7fa0",

  blue: "#3987e5",
  orange: "#d97a26",
  aqua: "#19b088",
  yellow: "#c98500",
  magenta: "#e155a0",
  green: "#3fae4a",
  violet: "#9085e9",
  red: "#e6667a",

  good: "#22c55e",
  warning: "#fab219",
  critical: "#f2495c",
  gray: "#5a5c7a",
};

export const CATEGORICAL = [
  COLORS.blue,
  COLORS.orange,
  COLORS.aqua,
  COLORS.yellow,
  COLORS.magenta,
  COLORS.green,
  COLORS.violet,
  COLORS.red,
];

/** Gradientes decorativos para os cartões de KPI (não usados como codificação de dado). */
export const KPI_GRADIENTS: [string, string][] = [
  ["#3987e5", "#7c6ff0"],
  ["#19b088", "#3fae4a"],
  ["#e155a0", "#9085e9"],
  ["#d97a26", "#e6667a"],
  ["#3987e5", "#19b088"],
  ["#9085e9", "#e155a0"],
];

export const GRID_COLOR = "rgba(255,255,255,0.06)";
export const AXIS_COLOR = "rgba(255,255,255,0.12)";

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

/** Cor divergente: vermelho (negativo) -> cinza (zero) -> azul (positivo), escalada por `maxAbs`. */
export function divergingColor(value: number, maxAbs: number): string {
  if (!maxAbs) return COLORS.gray;
  const t = Math.max(-1, Math.min(1, value / maxAbs));
  const pole = hexToRgb(t < 0 ? COLORS.red : COLORS.blue);
  const gray = hexToRgb(COLORS.gray);
  const frac = Math.abs(t);
  const r = Math.round(gray.r + (pole.r - gray.r) * frac);
  const g = Math.round(gray.g + (pole.g - gray.g) * frac);
  const b = Math.round(gray.b + (pole.b - gray.b) * frac);
  return `rgb(${r}, ${g}, ${b})`;
}
