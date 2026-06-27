import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
import Svg, { Path } from "react-native-svg";
import Button from "../components/Button";
import Card from "../components/Card";
import Input from "../components/Input";
import ScreenWrapper from "../components/ScreenWrapper";

function GoogleLogo() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <Path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
        fill="#4285F4"
      />
      <Path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
        fill="#34A853"
      />
      <Path
        d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <Path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </Svg>
  );
}

export default function Login() {
  const router = useRouter();
  const { colors } = useTheme();

  const [step, setStep] = useState<"login" | "verify">("login");
  const [form, setForm] = useState({ email: "", password: "" });
  const [emailOtp, setEmailOtp] = useState("");
  const [pendingLoginData, setPendingLoginData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        "169336561822-1ia89rq27tu8thr3t54irqtaqss8abs2.apps.googleusercontent.com",
      offlineAccess: true,
    });
  }, []);

  const handleChange = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const finalizeLogin = async (loginData: any) => {
    const normalizedUser = { ...loginData.user, emailVerified: true };
    await AsyncStorage.setItem("token", loginData.token);
    await AsyncStorage.setItem("user", JSON.stringify(normalizedUser));
    await registerPushToken();
    router.replace("/home/passenger");
  };

  const handleLogin = async () => {
    const { email, password } = form;
    if (!email || !password)
      return Alert.alert(
        "Missing Fields",
        "Please enter both email and password.",
      );

    if (email.trim().toLowerCase().endsWith("@itmgoi.in")) {
      return Alert.alert(
        "Faculty Account Detected",
        "Please use the Faculty Login portal for @itmgoi.in accounts.",
        [
          {
            text: "Faculty Login",
            onPress: () => router.push("./facultyLogin"),
          },
          { text: "Cancel", style: "cancel" },
        ],
      );
    }

    setLoading(true);
    try {
      const data: any = await apiFetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!data.success)
        return Alert.alert(
          "Login Failed",
          data.message || "Invalid credentials",
        );

      if (data.user.EmailVerified) {
        await finalizeLogin(data);
        return;
      }

      const otpRes: any = await apiFetch(
        `${API_URL}/forgot-password/send-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contact: email }),
        },
      );

      if (!otpRes.success)
        return Alert.alert(
          "Error",
          otpRes.message || "Could not send verification code.",
        );

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
    if (!emailOtp || emailOtp.length < 6)
      return Alert.alert(
        "Invalid Code",
        "Enter the 6-digit code sent to your email.",
      );
    setLoading(true);
    try {
      const data: any = await apiFetch(`${API_URL}/register/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, code: emailOtp }),
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
        body: JSON.stringify({ contact: form.email }),
      });
      Alert.alert("Resent", "A new code has been sent to your email.");
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      if (!userInfo.data) {
        Alert.alert(
          "Google Login Failed",
          "Unable to retrieve user information",
        );
        return;
      }
      const { email, name, id } = userInfo.data.user;

      if (email?.toLowerCase().endsWith("@itmgoi.in")) {
        Alert.alert(
          "Faculty Account",
          "Please use the Faculty Login portal for @itmgoi.in accounts.",
          [
            {
              text: "Faculty Login",
              onPress: () => router.push("./facultyLogin"),
            },
          ],
        );
        return;
      }

      const data: any = await apiFetch(`${API_URL}/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, googleId: id }),
      });

      if (!data.success) {
        Alert.alert("Google Login Failed", data.message);
        return;
      }

      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem(
        "user",
        JSON.stringify({ ...data.user, isGoogleUser: true }),
      );
      await registerPushToken();
      router.replace("/home/passenger");
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) return;
      if (error.code === statusCodes.IN_PROGRESS) return;
      Alert.alert("Google Login Failed", error.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24 }}
      >
        <Card style={{ paddingVertical: 28 }}>
          {step === "login" && (
            <>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "700",
                  marginBottom: 4,
                  textAlign: "center",
                  color: colors.text,
                }}
              >
                Welcome Back
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textMuted,
                  textAlign: "center",
                  marginBottom: 24,
                }}
              >
                Student / General Login
              </Text>

              <Input
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(v: string) => handleChange("email", v)}
              />
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
                <Button onPress={handleLogin}>Login</Button>
              )}

              <TouchableOpacity
                onPress={() => router.push("./facultyLogin")}
                style={{
                  marginTop: 14,
                  padding: 13,
                  borderRadius: 10,
                  borderWidth: 1.5,
                  borderColor: "#1a3a6b",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  backgroundColor: "#eef2ff",
                }}
              >
                <Text style={{ fontSize: 15 }}>🏛️</Text>
                <Text
                  style={{ color: "#1a3a6b", fontWeight: "600", fontSize: 13 }}
                >
                  Faculty Login (@itmgoi.in)
                </Text>
              </TouchableOpacity>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginVertical: 22,
                }}
              >
                <View
                  style={{ flex: 1, height: 1, backgroundColor: colors.border }}
                />
                <Text style={{ marginHorizontal: 12, color: colors.textMuted }}>
                  OR
                </Text>
                <View
                  style={{ flex: 1, height: 1, backgroundColor: colors.border }}
                />
              </View>

              {googleLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <TouchableOpacity
                  onPress={handleGoogleLogin}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    height: 48,
                    backgroundColor: "#ffffff",
                    borderWidth: 1,
                    borderColor: "#dadce0",
                    borderRadius: 4,
                    paddingHorizontal: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.08,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  <GoogleLogo />
                  <Text
                    style={{
                      color: "#3c4043",
                      fontSize: 14,
                      fontWeight: "500",
                      letterSpacing: 0.25,
                      fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
                    }}
                  >
                    Continue with Google
                  </Text>
                </TouchableOpacity>
              )}

              <View style={{ marginTop: 22, alignItems: "center" }}>
                <Text style={{ color: colors.text }}>
                  Don't have an account?{" "}
                  <Text
                    style={{
                      color: colors.primary,
                      textDecorationLine: "underline",
                    }}
                    onPress={() => router.push("./register")}
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
                  fontSize: 24,
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
                  {form.email}
                </Text>
                {"\n\n"}You must verify your email to continue.
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
