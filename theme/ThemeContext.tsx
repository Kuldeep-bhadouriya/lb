import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { darkTheme, ecoTheme, lightTheme } from "./colors";

export type ThemeType = "light" | "dark" | "eco";

interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryLight?: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  shadow: string;
  divider: string;
  gradients: {
    [key: string]: string | string[];
  };
}

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (t: ThemeType) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "eco",
  setTheme: () => {},
  colors: ecoTheme as ThemeColors,
});

export const ThemeProvider = ({ children }: any) => {
  const [theme, setTheme] = useState<ThemeType>("eco");
  const [colors, setColors] = useState<ThemeColors>(ecoTheme as ThemeColors);

  const applyTheme = (mode: ThemeType) => {
    if (mode === "light") setColors(lightTheme as ThemeColors);
    else if (mode === "dark") setColors(darkTheme as ThemeColors);
    else setColors(ecoTheme as ThemeColors);
  };

  useEffect(() => {
    const loadTheme = async () => {
      const saved = await AsyncStorage.getItem("theme");
      if (saved) setTheme(saved as ThemeType);
    };
    loadTheme();
  }, []);

  useEffect(() => {
    applyTheme(theme);
    AsyncStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
