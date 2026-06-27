import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { apiFetch } from "../../lib/apiFetch";
import { API_URL } from "../../lib/config";
import { useTheme } from "../../theme/ThemeContext";
import Button from "../components/Button";
import Card from "../components/Card";
import Input from "../components/Input";
import ScreenWrapper from "../components/ScreenWrapper";

const FACULTY_DOMAIN = "itmgoi.in";

export default function FacultyRegister() {
  const router = useRouter();
  const { colors } = useTheme();

  const [step, setStep] = useState<"form" | "email">("form");
  const [emailOtp, setEmailOtp] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "email") {
      const trimmed = value.trim().toLowerCase();
      if (trimmed && !trimmed.endsWith(`@${FACULTY_DOMAIN}`)) {
        setEmailError(`Must use @${FACULTY_DOMAIN} email`);
      } else {
        setEmailError("");
      }
    }
  };

  const handleRegister = async () => {
    const { firstName, lastName, email, phone, password, confirmPassword } =
      form;
    const trimmedEmail = email.trim().toLowerCase();

    if (
      !firstName ||
      !lastName ||
      !trimmedEmail ||
      !phone ||
      !password ||
      !confirmPassword
    ) {
      return Alert.alert(
        "Missing Fields",
        "Please fill in all required fields.",
      );
    }
    if (!trimmedEmail.endsWith(`@${FACULTY_DOMAIN}`)) {
      return Alert.alert(
        "Invalid Email",
        `Faculty must use a @${FACULTY_DOMAIN} email.`,
      );
    }
    if (password !== confirmPassword) {
      return Alert.alert("Password Mismatch", "Passwords do not match.");
    }
    if (!agreed) {
      return Alert.alert(
        "Terms Required",
        "You must accept the Terms and Privacy Policy.",
      );
    }

    setLoading(true);
    try {
      const data: any = await apiFetch(`${API_URL}/faculty/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: trimmedEmail,
          phone: phone.trim(),
          password,
        }),
      });

      if (!data.success) return Alert.alert("Error", data.message);

      const otpRes: any = await apiFetch(
        `${API_URL}/forgot-password/send-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contact: trimmedEmail }),
        },
      );

      if (!otpRes.success) {
        Alert.alert(
          "Account Created",
          "Registration successful! Please login.",
          [{ text: "OK", onPress: () => router.push("./facultyLogin") }],
        );
        return;
      }
      setStep("email");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!emailOtp || emailOtp.length < 6) {
      return Alert.alert("Invalid Code", "Enter the 6-digit code.");
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
      Alert.alert(
        "🎉 All set!",
        "Your faculty account is ready. Please login.",
        [{ text: "OK", onPress: () => router.push("./facultyLogin") }],
      );
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
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: 24,
            justifyContent: "center",
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <View
              style={{
                backgroundColor: "#1a3a6b",
                borderRadius: 20,
                paddingHorizontal: 18,
                paddingVertical: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Text style={{ fontSize: 18 }}>🏛️</Text>
              <Text
                style={{ color: "#ffffff", fontWeight: "700", fontSize: 15 }}
              >
                Faculty Registration
              </Text>
            </View>
          </View>

          <Card>
            <Text
              style={{
                fontSize: 22,
                fontWeight: "700",
                marginBottom: 20,
                textAlign: "center",
                color: colors.text,
              }}
            >
              {step === "form" ? "Create Faculty Account" : "Verify Email"}
            </Text>

            {step === "form" && (
              <>
                <Input
                  placeholder="First Name *"
                  value={form.firstName}
                  onChangeText={(v: string) => handleChange("firstName", v)}
                />
                <Input
                  placeholder="Last Name *"
                  value={form.lastName}
                  onChangeText={(v: string) => handleChange("lastName", v)}
                />
                <Input
                  placeholder={`Faculty Email (@${FACULTY_DOMAIN}) *`}
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
                  placeholder="Phone Number *"
                  keyboardType="phone-pad"
                  value={form.phone}
                  onChangeText={(v: string) => handleChange("phone", v)}
                />
                <Input
                  placeholder="Password *"
                  secureTextEntry
                  value={form.password}
                  onChangeText={(v: string) => handleChange("password", v)}
                />
                <Input
                  placeholder="Confirm Password *"
                  secureTextEntry
                  value={form.confirmPassword}
                  onChangeText={(v: string) =>
                    handleChange("confirmPassword", v)
                  }
                />

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 10,
                    marginBottom: 20,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setAgreed(!agreed)}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: colors.primary,
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 10,
                      backgroundColor: agreed ? colors.primary : "transparent",
                    }}
                  >
                    {agreed && (
                      <Text style={{ color: "#fff", fontSize: 14 }}>✓</Text>
                    )}
                  </TouchableOpacity>
                  <Text style={{ color: colors.text, fontSize: 14 }}>
                    I agree to the{" "}
                    <Text
                      style={{
                        color: colors.primary,
                        textDecorationLine: "underline",
                      }}
                      onPress={() => router.push("../profile/privacy")}
                    >
                      Terms & Privacy Policy
                    </Text>
                  </Text>
                </View>

                {loading ? (
                  <ActivityIndicator size="large" color={colors.primary} />
                ) : (
                  <Button onPress={handleRegister}>Register as Faculty</Button>
                )}

                <View style={{ marginTop: 18, alignItems: "center" }}>
                  <Text style={{ color: colors.text }}>
                    Already have an account?{" "}
                    <Text
                      style={{
                        color: colors.primary,
                        textDecorationLine: "underline",
                      }}
                      onPress={() => router.push("./facultyLogin")}
                    >
                      Login
                    </Text>
                  </Text>
                </View>
              </>
            )}

            {step === "email" && (
              <>
                <Text
                  style={{
                    color: colors.textMuted,
                    marginBottom: 16,
                    lineHeight: 20,
                  }}
                >
                  A 6-digit code was sent to{"\n"}
                  <Text style={{ color: colors.primary, fontWeight: "600" }}>
                    {form.email.trim().toLowerCase()}
                  </Text>
                </Text>

                <Input
                  placeholder="Enter email code"
                  keyboardType="numeric"
                  maxLength={6}
                  value={emailOtp}
                  onChangeText={setEmailOtp}
                />

                {loading ? (
                  <ActivityIndicator size="large" color={colors.primary} />
                ) : (
                  <Button onPress={handleVerifyEmail}>Verify Email</Button>
                )}

                <TouchableOpacity
                  onPress={handleResendOtp}
                  style={{ marginTop: 16, alignItems: "center" }}
                >
                  <Text style={{ color: colors.primary }}>Resend code</Text>
                </TouchableOpacity>
              </>
            )}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
