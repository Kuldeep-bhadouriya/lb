import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as Updates from "expo-updates";
import React, { useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "../../lib/apiFetch";
import { API_URL } from "../../lib/config";
import { useTheme } from "../../theme/ThemeContext";
import Button from "../components/Button";
import Card from "../components/Card";
import ScreenWrapper from "../components/ScreenWrapper";

export default function VerifyPhone() {
  const router = useRouter();
  const { colors } = useTheme();

  const [contact, setContact] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (!contact) return Alert.alert("Error", "Enter your phone number");

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");

      const res: any = await apiFetch(`${API_URL}/send-otp`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contact }),
      });

      if (res.success) {
        setOtpSent(true);
        Alert.alert("OTP Sent", "Please check your phone");
      } else {
        Alert.alert("Error", res.message);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
    setLoading(false);
  };

  const verifyOtp = async () => {
    if (!code) return Alert.alert("Error", "Enter the OTP");

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");

      const res: any = await apiFetch(`${API_URL}/verify-otp`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contact, code }),
      });

      if (res.success) {
        try {
          const token = await AsyncStorage.getItem("token");
          if (token) {
            const prof: any = await apiFetch(`${API_URL}/profile`, {
              headers: { Authorization: `Bearer ${token}` },
            }).catch(() => null);
            if (prof?.success)
              await AsyncStorage.setItem("user", JSON.stringify(prof.user));
          }
          await Updates.reloadAsync();
        } catch {
          router.replace("/home/passenger");
        }
      } else {
        Alert.alert("Error", res.message);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }

    setLoading(false);
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
            Verify Phone
          </Text>

          <Card>
            {!otpSent ? (
              <>
                <Text
                  style={{
                    color: colors.textMuted,
                    marginBottom: 16,
                    lineHeight: 20,
                  }}
                >
                  Enter your phone number to receive a verification code.
                </Text>

                <TextInput
                  placeholder="Enter phone number"
                  placeholderTextColor={colors.textMuted}
                  value={contact}
                  onChangeText={setContact}
                  keyboardType="phone-pad"
                  style={{
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderRadius: 18,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    marginBottom: 16,
                  }}
                />

                <Button onPress={sendOtp}>
                  {loading ? "Sending..." : "Send OTP"}
                </Button>
              </>
            ) : (
              <>
                <Text
                  style={{
                    color: colors.textMuted,
                    marginBottom: 16,
                    lineHeight: 20,
                  }}
                >
                  Enter the 6-digit OTP sent to{" "}
                  <Text
                    style={{
                      color: colors.primary,
                      fontWeight: "600",
                    }}
                  >
                    {contact}
                  </Text>
                </Text>

                <TextInput
                  placeholder="Enter OTP"
                  placeholderTextColor={colors.textMuted}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="numeric"
                  maxLength={6}
                  style={{
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderRadius: 18,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    marginBottom: 16,
                  }}
                />

                <Button onPress={verifyOtp}>
                  {loading ? "Verifying..." : "Verify Phone"}
                </Button>
              </>
            )}
          </Card>
        </View>
      </SafeAreaView>
    </ScreenWrapper>
  );
}
