import React from "react";
import { ImageBackground, StatusBar, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeContext";

export default function ScreenWrapper({ children }: any) {
  const { theme, colors } = useTheme();

  const isEco = theme === "eco";
  const isDark = theme === "dark";

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["left", "right", "bottom"]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={false}
      />

      {isEco && (
        <ImageBackground
          source={require("../../assets/eco-bg.png")}
          resizeMode="cover"
          style={StyleSheet.absoluteFillObject}
        >
          <View style={styles.overlay} />
        </ImageBackground>
      )}

      <View style={{ flex: 1 }}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
});
