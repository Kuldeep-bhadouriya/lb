import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useTheme } from "../../theme/ThemeContext";

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: any;
};

export default function Button({ children, onPress, disabled, style }: Props) {
  const { colors, theme } = useTheme();

  if (theme === "eco") {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.9}
        style={style}
      >
        <LinearGradient
          colors={["#2D6A4F", "#52B788"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.btn, { opacity: disabled ? 0.6 : 1 }]}
        >
          <Text style={[styles.text, { color: "#fff" }]}>{children}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        { backgroundColor: colors.primary, opacity: disabled ? 0.6 : 1 },
        style,
      ]}
    >
      <Text style={[styles.text, { color: colors.background }]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignItems: "center",

    shadowColor: "#2D6A4F",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  text: {
    fontWeight: "600",
    fontSize: 16,
  },
});
