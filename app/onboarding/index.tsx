import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, FlatList, Image, Text, View } from "react-native";

import { useTheme } from "../../theme/ThemeContext";

import Button from "../components/Button";
import Card from "../components/Card";
import ScreenWrapper from "../components/ScreenWrapper";

const { width } = Dimensions.get("window");

export default function Onboarding() {
  const router = useRouter();
  const { setTheme, colors } = useTheme();

  const flatRef = useRef<FlatList>(null);

  const [index, setIndex] = useState(0);
  const [themeChoice, setThemeChoice] = useState<"eco" | "dark">("eco");

  useEffect(() => {
    setTheme("eco");
  }, []);

  const slides = [
    {
      title: "Welcome to LiftBuddy!",
      desc: "Share rides, save money and travel smart.",
      image: require("../../assets/onboarding1.png"),
    },
    {
      title: "Offer & Get Lifts Easily",
      desc: "Post your ride or find a lift for your route.",
      image: require("../../assets/onboarding2.png"),
    },
    {
      title: "Save Money, Save Time",
      desc: "Cut down travel costs and reduce travel hassle.",
      image: require("../../assets/onboarding3.png"),
    },
  ];

  const handleNext = () => {
    if (index < slides.length - 1) {
      const next = index + 1;
      flatRef.current?.scrollToIndex({ index: next });
      setIndex(next);
    } else {
      setIndex(slides.length);
    }
  };
  const finishOnboarding = async () => {
    await AsyncStorage.setItem("@onboarding_seen", "true");
    setTheme(themeChoice);
    router.replace("../auth/login");
  };

  return (
    <ScreenWrapper>
      <View style={{ flex: 1, justifyContent: "center" }}>
        {index < slides.length ? (
          <FlatList
            ref={flatRef}
            data={slides}
            horizontal
            pagingEnabled
            scrollEnabled={false}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => (
              <View
                style={{
                  width,
                  padding: 24,
                  justifyContent: "center",
                }}
              >
                <Card style={{ alignItems: "center", paddingVertical: 40 }}>
                  <Image
                    source={item.image}
                    style={{ width: 220, height: 220, marginBottom: 20 }}
                    resizeMode="contain"
                  />

                  <Text
                    style={{
                      fontSize: 26,
                      fontWeight: "700",
                      textAlign: "center",
                      color: colors.text,
                      marginBottom: 10,
                    }}
                  >
                    {item.title}
                  </Text>

                  <Text
                    style={{
                      textAlign: "center",
                      color: colors.textMuted,
                      fontSize: 15,
                      marginBottom: 30,
                      paddingHorizontal: 10,
                    }}
                  >
                    {item.desc}
                  </Text>

                  <Button onPress={handleNext}>Next</Button>

                  <View style={{ flexDirection: "row", marginTop: 20 }}>
                    {slides.map((_, i) => (
                      <View
                        key={i}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          marginHorizontal: 4,
                          backgroundColor:
                            index === i ? colors.primary : "#ccc",
                        }}
                      />
                    ))}
                  </View>
                </Card>
              </View>
            )}
          />
        ) : (
          <View style={{ padding: 24 }}>
            <Card style={{ paddingVertical: 40, alignItems: "center" }}>
              <Text style={{ fontSize: 60, marginBottom: 20 }}>🎨</Text>

              <Text
                style={{
                  fontSize: 26,
                  fontWeight: "700",
                  textAlign: "center",
                  color: colors.text,
                  marginBottom: 12,
                }}
              >
                Choose Theme
              </Text>

              <Text
                style={{
                  textAlign: "center",
                  color: colors.textMuted,
                  marginBottom: 30,
                }}
              >
                Select your preferred app theme.
              </Text>

              <View style={{ marginBottom: 14, width: "100%" }}>
                <Button
                  onPress={() => {
                    setThemeChoice("eco");
                    setTheme("eco");
                  }}
                >
                  Eco Theme
                </Button>
              </View>

              <View style={{ marginBottom: 14, width: "100%" }}>
                <Button
                  onPress={() => {
                    setThemeChoice("dark");
                    setTheme("dark");
                  }}
                >
                  Dark Theme
                </Button>
              </View>

              <View style={{ marginTop: 16, width: "100%" }}>
                <Button onPress={finishOnboarding}>Continue</Button>
              </View>
            </Card>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}
