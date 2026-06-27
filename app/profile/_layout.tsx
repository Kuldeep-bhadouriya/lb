import { Stack } from "expo-router";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../theme/ThemeContext";

function LiftBuddyLogo({ colors }: { colors: any }) {
  return (
    <View style={styles.logoContainer}>
      <Text style={[styles.logoText, { color: colors.text }]}>
        Lift
        <Text style={[styles.logoAccent, { color: colors.primary }]}>
          Buddy
        </Text>
      </Text>
    </View>
  );
}

export default function RideLayout() {
  const { colors } = useTheme();

  const headerStyle = useMemo(
    () => ({
      backgroundColor: colors.background,
      borderBottomColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      elevation: 0,
      shadowOpacity: 0,
    }),
    [colors.background, colors.border],
  );

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: () => <LiftBuddyLogo colors={colors} />,
        headerTitleAlign: "center",
        headerStyle: headerStyle,
        headerShadowVisible: false,
        headerTintColor: colors.primary,
      }}
    />
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logoIcon: {
    marginRight: 2,
  },
  logoText: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  logoAccent: {
    fontWeight: "800",
  },
});
