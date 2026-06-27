import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { apiFetch } from "../../lib/apiFetch";
import { API_URL } from "../../lib/config";
import { registerPushToken } from "../../lib/notifications";
import { useTheme } from "../../theme/ThemeContext";
import Button from "../components/Button";
import Card from "../components/Card";
import Input from "../components/Input";
import ScreenWrapper from "../components/ScreenWrapper";

const FACULTY_DOMAIN = "itmgoi.in";

export default function FacultyLogin() {
  const router = useRouter();
  const { colors } = useTheme();

  const [step, setStep] = useState<"login" | "verify">("login");
  const [form, setForm] = useState({ email: "", password: "" });
  const [emailOtp, setEmailOtp] = useState("");
  const [pendingLoginData, setPendingLoginData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "email") {
      const trimmed = value.trim().toLowerCase();
      if (trimmed && !trimmed.endsWith(`@${FACULTY_DOMAIN}`)) {
        setEmailError(`Faculty email must end with @${FACULTY_DOMAIN}`);
      } else {
        setEmailError("");
      }
    }
  };

  const finalizeLogin = async (loginData: any) => {
    const normalizedUser = {
      ...loginData.user,
      emailVerified: true,
      isFaculty: true,
    };
    await AsyncStorage.setItem("token", loginData.token);
    await AsyncStorage.setItem("user", JSON.stringify(normalizedUser));
    await registerPushToken();
    router.replace("/home/passenger");
  };

  const handleLogin = async () => {
    const { email, password } = form;
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      return Alert.alert(
        "Missing Fields",
        "Please enter both email and password.",
      );
    }

    if (!trimmedEmail.endsWith(`@${FACULTY_DOMAIN}`)) {
      return Alert.alert(
        "Invalid Faculty Email",
        `Faculty accounts must use an @${FACULTY_DOMAIN} email address.`,
      );
    }

    setLoading(true);
    try {
      const data: any = await apiFetch(`${API_URL}/faculty/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      if (!data.success) {
        return Alert.alert(
          "Login Failed",
          data.message || "Invalid credentials",
        );
      }

      if (data.user.EmailVerified) {
        await finalizeLogin(data);
        return;
      }

      const otpRes: any = await apiFetch(
        `${API_URL}/forgot-password/send-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contact: trimmedEmail }),
        },
      );

      if (!otpRes.success) {
        return Alert.alert(
          "Error",
          otpRes.message || "Could not send verification code.",
        );
      }

      setPendingLoginData(data);
      setStep("verify");
    } catch (err: any) {
      Alert.alert(
        "Login Failed",
        err.message || "Unable to connect to server.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!emailOtp || emailOtp.length < 6) {
      return Alert.alert(
        "Invalid Code",
        "Enter the 6-digit code sent to your email.",
      );
    }
    setLoading(true);
    try {
      const data: any = await apiFetch(`${API_URL}/register/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          code: emailOtp,
        }),
      });
      if (!data.success) return Alert.alert("Error", data.message);
      await finalizeLogin(pendingLoginData);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      await apiFetch(`${API_URL}/forgot-password/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: form.email.trim().toLowerCase() }),
      });
      Alert.alert("Resent", "A new code has been sent to your email.");
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24 }}
      >
        <View style={{ alignItems: "center", marginBottom: 28 }}>
          <View
            style={{
              backgroundColor: "#1a3a6b",
              borderRadius: 20,
              paddingHorizontal: 20,
              paddingVertical: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 20 }}>🏛️</Text>
            <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 16 }}>
              Faculty Portal
            </Text>
          </View>
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 12,
              marginTop: 8,
              textAlign: "center",
            }}
          >
            ITM Gwalior Faculty Ride System
          </Text>
        </View>

        <Card style={{ paddingVertical: 28 }}>
          {step === "login" && (
            <>
              <Text
                style={{
                  fontSize: 26,
                  fontWeight: "700",
                  marginBottom: 8,
                  textAlign: "center",
                  color: colors.text,
                }}
              >
                Faculty Login
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: colors.textMuted,
                  textAlign: "center",
                }}
              >
                Use your @{FACULTY_DOMAIN} email
              </Text>

              <Input
                placeholder={`faculty@${FACULTY_DOMAIN}`}
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(v: string) => handleChange("email", v)}
              />
              {emailError ? (
                <Text
                  style={{
                    color: "#ef4444",
                    fontSize: 12,
                    marginTop: -8,
                    marginBottom: 8,
                    marginLeft: 4,
                  }}
                >
                  {emailError}
                </Text>
              ) : null}

              <Input
                placeholder="Password"
                secureTextEntry
                value={form.password}
                onChangeText={(v: string) => handleChange("password", v)}
              />

              <Text
                style={{
                  alignSelf: "flex-end",
                  marginBottom: 18,
                  color: colors.primary,
                  textDecorationLine: "underline",
                }}
                onPress={() => router.push("./forgotPassword")}
              >
                Forgot Password?
              </Text>

              {loading ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : (
                <Button onPress={handleLogin}>Login as Faculty</Button>
              )}

              <View style={{ marginTop: 22, alignItems: "center" }}>
                <Text style={{ color: colors.text }}>
                  Not faculty?{" "}
                  <Text
                    style={{
                      color: colors.primary,
                      textDecorationLine: "underline",
                    }}
                    onPress={() => router.replace("./login")}
                  >
                    Student / General Login
                  </Text>
                </Text>
              </View>

              <View style={{ marginTop: 12, alignItems: "center" }}>
                <Text style={{ color: colors.text }}>
                  New faculty?{" "}
                  <Text
                    style={{
                      color: colors.primary,
                      textDecorationLine: "underline",
                    }}
                    onPress={() => router.push("./facultyRegister")}
                  >
                    Register
                  </Text>
                </Text>
              </View>
            </>
          )}

          {step === "verify" && (
            <>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  marginBottom: 12,
                  textAlign: "center",
                  color: colors.text,
                }}
              >
                Verify Your Email
              </Text>
              <Text
                style={{
                  color: colors.textMuted,
                  marginBottom: 24,
                  lineHeight: 20,
                  textAlign: "center",
                }}
              >
                A 6-digit code was sent to{"\n"}
                <Text style={{ color: colors.primary, fontWeight: "600" }}>
                  {form.email.trim().toLowerCase()}
                </Text>
              </Text>

              <Input
                placeholder="Enter 6-digit code"
                keyboardType="numeric"
                maxLength={6}
                value={emailOtp}
                onChangeText={setEmailOtp}
              />

              {loading ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : (
                <Button onPress={handleVerifyEmail}>Verify & Login</Button>
              )}

              <TouchableOpacity
                onPress={handleResendOtp}
                style={{ marginTop: 16, alignItems: "center" }}
              >
                <Text style={{ color: colors.primary }}>Resend code</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setStep("login");
                  setEmailOtp("");
                  setPendingLoginData(null);
                }}
                style={{ marginTop: 10, alignItems: "center" }}
              >
                <Text style={{ color: colors.textMuted }}>← Back to login</Text>
              </TouchableOpacity>
            </>
          )}
        </Card>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
