import React, { useState } from "react";
import { StyleSheet, TextInput } from "react-native";
import { useTheme } from "../../theme/ThemeContext";

type Props = any;

export default function Input(props: Props) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      {...props}
      placeholderTextColor={colors.textMuted}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[
        styles.input,
        {
          backgroundColor: colors.surface,
          borderColor: focused ? colors.primary : colors.border,
          color: colors.text,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
});
