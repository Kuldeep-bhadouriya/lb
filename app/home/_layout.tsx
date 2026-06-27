import * as NavigationBar from "expo-navigation-bar";
import { Tabs } from "expo-router";
import { BarChart2, Car, ClipboardList, User, Users } from "lucide-react-native";
import React, { useEffect, useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

export default function HomeTabsLayout() {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const timer = setTimeout(() => {
      try {
        NavigationBar.setBackgroundColorAsync(colors.background);
        NavigationBar.setButtonStyleAsync(theme === "dark" ? "light" : "dark");
      } catch (e) {}
    }, 100);

    return () => clearTimeout(timer);
  }, [colors.background, theme]);

  const tabBarStyle = useMemo(
    () => ({
      backgroundColor: colors.background,
      borderTopColor: colors.border,
      height: 60 + (insets.bottom || 0),
      paddingBottom: (insets.bottom || 0) > 0 ? insets.bottom : 6,
      paddingTop: 4,
      elevation: 0,
    }),
    [colors.background, colors.border, insets.bottom],
  );

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
    <Tabs
      initialRouteName="passenger"
      screenOptions={{
        headerShown: true,
        headerTitle: () => <LiftBuddyLogo colors={colors} />,
        headerTitleAlign: "center",
        headerStyle: headerStyle,
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: theme === "dark" ? "#aaa" : "#666",
        tabBarStyle: tabBarStyle,
        tabBarItemStyle: {
          paddingVertical: 0,
        },
      }}
    >
      <Tabs.Screen
        name="passenger"
        options={{
          title: "Passenger",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="driver"
        options={{
          title: "Rider",
          tabBarIcon: ({ color, size }) => <Car color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="Myrides"
        options={{
          title: "MyRides",
          tabBarIcon: ({ color, size }) => (
            <ClipboardList color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <BarChart2 color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profileTab"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
    </Tabs>
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
