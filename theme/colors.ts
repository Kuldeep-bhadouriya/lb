export type ThemeType = "light" | "dark";

export const gradients = {
  skyBlue: ["#4facfe", "#00f2fe"],
  skyBlueGreen: ["#00c6ff", "#00f2fe"],
  green: ["#11998e", "#38ef7d"],
  bluePurple: ["#6a11cb", "#2575fc"],
  sunset: ["#ff9966", "#ff5e62"],
  ocean: ["#2E3192", "#1BFFFF"],
  pinkWhite: ["#ff9a9e", "#fad0c4"],
};

export const lightTheme = {
  background: "#ffffff",
  surface: "#f4f4f4",
  text: "#000000",
  textMuted: "#666666",
  primary: "#000000",
  border: "#dddddd",
  card: "#f9f9f9",

  success: "#2ecc71",
  warning: "#f1c40f",
  danger: "#e74c3c",

  shadow: "rgba(0,0,0,0.1)",
  divider: "rgba(0,0,0,0.12)",
  gradients,
};

export const darkTheme = {
  background: "#0B0B0F",
  surface: "#15151C",
  card: "#1C1C24",

  text: "#FFFFFF",
  textMuted: "#9CA3AF",

  primary: "#22D3EE",
  primaryLight: "#67E8F9",

  border: "rgba(255,255,255,0.08)",

  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",

  shadow: "rgba(0,0,0,0.6)",
  divider: "rgba(255,255,255,0.06)",

  gradients,
};
export const ecoTheme = {
  background: "transparent",
  surface: "#FFFFFF",
  card: "#FFFFFF",

  text: "#1B4332",
  textMuted: "#52796F",

  primary: "#2D6A4F",
  primaryLight: "#52B788",

  border: "rgba(0,0,0,0.06)",

  success: "#40916C",
  warning: "#F4A261",
  danger: "#E76F51",

  shadow: "rgba(46, 125, 50, 0.15)",
  divider: "rgba(0,0,0,0.05)",

  gradients,
};
