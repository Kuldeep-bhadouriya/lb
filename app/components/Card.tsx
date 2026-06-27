import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../theme/ThemeContext";

export default function Card({ children, style }: any) {
  const { colors, theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          shadowColor: colors.shadow,
          borderWidth: theme === "dark" ? 1 : 0,
          borderColor: theme === "dark" ? colors.border : "transparent",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
});
