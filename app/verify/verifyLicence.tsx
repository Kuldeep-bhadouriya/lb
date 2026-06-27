import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "../../lib/apiFetch";
import { API_URL } from "../../lib/config";
import { useTheme } from "../../theme/ThemeContext";
import Button from "../components/Button";
import Card from "../components/Card";
import ScreenWrapper from "../components/ScreenWrapper";

export default function VerifyLicence() {
  const { colors } = useTheme();
  const router = useRouter();

  const [image, setImage] = useState<string | null>(null);

  const pickCollegeId = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Allow photo access to upload your ID.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch {}
  };

  const submitCollegeId = async () => {
    if (!image) {
      return Alert.alert("Upload Required", "Please upload your College ID.");
    }

    try {
      const token = await AsyncStorage.getItem("token");

      const form = new FormData();
      const filename = image.split("/").pop()!;
      const ext = filename.split(".").pop();

      form.append("file", {
        uri: image,
        type: `image/${ext}`,
        name: filename,
      } as any);

      const res: any = await apiFetch(`${API_URL}/verify-licence`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!res.success) {
        return Alert.alert("Error", res.message || "Verification failed");
      }

      try {
        const prof: any = await apiFetch(`${API_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (prof?.success) {
          await AsyncStorage.setItem("user", JSON.stringify(prof.user));
        }
      } catch {}

      Alert.alert(
        "Verified! 🎉",
        "Your ID has been verified. You can now create your ride.",
        [{ text: "Continue", onPress: () => router.back() }],
      );
    } catch (e: any) {
      Alert.alert("Error", e.message || "Something went wrong");
    }
  };

  return (
    <ScreenWrapper>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, padding: 20 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              color: colors.text,
              marginBottom: 20,
            }}
          >
            Verify Licence
          </Text>

          <Card>
            <Text
              style={{
                color: colors.textMuted,
                marginBottom: 18,
                lineHeight: 20,
              }}
            >
              Upload your College ID for verification. Make sure the image is
              clear and readable.
            </Text>

            <Pressable
              onPress={pickCollegeId}
              style={{
                height: 200,
                borderRadius: 20,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
              }}
            >
              {image ? (
                <Image
                  source={{ uri: image }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <Text style={{ color: colors.textMuted, fontWeight: "500" }}>
                  Tap to upload College ID
                </Text>
              )}
            </Pressable>

            {image && (
              <Text
                style={{
                  textAlign: "center",
                  color: colors.primary,
                  marginTop: 10,
                  marginBottom: 4,
                }}
              >
                Tap to change image
              </Text>
            )}

            <View style={{ marginTop: 24 }}>
              <Button onPress={submitCollegeId}>Submit for Verification</Button>
            </View>
          </Card>
        </View>
      </SafeAreaView>
    </ScreenWrapper>
  );
}
