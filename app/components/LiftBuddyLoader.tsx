import { Navigation } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import { useTheme } from "../../theme/ThemeContext";

export default function LiftBuddyLoader({
  text = "Finding your ride...",
}: {
  text?: string;
}) {
  const { colors } = useTheme();

  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.2,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
      }}
    >
      <Animated.View
        style={{
          transform: [{ scale }, { rotate: spin }],
          backgroundColor: colors.primary + "20",
          padding: 22,
          borderRadius: 50,
        }}
      >
        <Navigation size={32} color={colors.primary} />
      </Animated.View>

      <Text
        style={{
          marginTop: 16,
          color: colors.text,
          fontSize: 14,
          fontWeight: "500",
        }}
      >
        {text}
      </Text>
    </View>
  );
}
