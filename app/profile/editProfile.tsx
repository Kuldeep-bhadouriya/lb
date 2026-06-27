import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as Updates from "expo-updates";
import { Calendar, ChevronDown, Mail, Phone, User } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL } from "../../lib/config";
import { useTheme } from "../../theme/ThemeContext";
import Button from "../components/Button";
import Card from "../components/Card";
import ScreenWrapper from "../components/ScreenWrapper";

type OtpStep = "idle" | "sending" | "pending" | "verifying";

function FieldError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <Text
      style={{ color: "#ef4444", fontSize: 12, marginTop: 4, marginLeft: 4 }}
    >
      {message}
    </Text>
  );
}

function OptionalBadge() {
  return (
    <Text
      style={{
        fontSize: 11,
        color: "#94a3b8",
        fontWeight: "400",
        marginLeft: 6,
      }}
    >
      (optional)
    </Text>
  );
}

export default function EditProfile() {
  const router = useRouter();
  const { colors } = useTheme();

  const [user, setUser] = useState<any>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [dobDate, setDobDate] = useState<Date>(new Date());
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [genderModal, setGenderModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [availableSeats, setAvailableSeats] = useState("");

  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [seatsError, setSeatsError] = useState("");
  const [plateError, setPlateError] = useState("");
  const [dobError, setDobError] = useState("");

  const [otpStep, setOtpStep] = useState<OtpStep>("idle");
  const [otpCode, setOtpCode] = useState("");
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [pendingPhone, setPendingPhone] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    load();
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const load = async () => {
    const raw = await AsyncStorage.getItem("user");
    if (!raw) return;
    const u = JSON.parse(raw);
    setUser(u);
    setFirstName(u.firstName || "");
    setLastName(u.lastName || "");
    setEmail(u.email || "");
    setGender(u.gender || "");
    setPhone(u.phone || u.Phone || "");
    if (u.dob) {
      const d = new Date(u.dob);
      if (!isNaN(d.getTime())) {
        setDobDate(d);
        setDob(d.toISOString().slice(0, 10));
      }
    } else {
      setDob("");
    }
    setProfilePic(u.profile_pic || null);
    setVehicleNumber(u.vehicleNumber || "");
    setAvailableSeats(u.availableSeats ? String(u.availableSeats) : "");
  };

  const handleFirstNameChange = (text: string) => {
    setFirstName(text);
    if (!text.trim()) setFirstNameError("First name is required");
    else if (text.trim().length < 2) setFirstNameError("Too short");
    else setFirstNameError("");
  };

  const handleLastNameChange = (text: string) => {
    setLastName(text);
    if (!text.trim()) setLastNameError("Last name is required");
    else if (text.trim().length < 2) setLastNameError("Too short");
    else setLastNameError("");
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (!text.trim()) {
      setEmailError("Email is required");
    } else if (text.length > 3) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(text)) setEmailError("Enter a valid email address");
      else setEmailError("");
    } else {
      setEmailError("");
    }
  };

  const handlePhoneChange = (text: string) => {
    if (!/^\d*$/.test(text)) return;
    setPhone(text);
    if (!text) {
      setPhoneError("Phone number is required");
      return;
    }
    if (text.length < 10) {
      setPhoneError(
        `${10 - text.length} more digit${10 - text.length > 1 ? "s" : ""} needed`,
      );
    } else if (!/^[6-9]\d{9}$/.test(text)) {
      setPhoneError("Must start with 6, 7, 8 or 9");
    } else {
      setPhoneError("");
    }
  };

  const handleSeatsChange = (text: string) => {
    if (!/^\d*$/.test(text)) return;
    setAvailableSeats(text);
    if (!text) {
      setSeatsError("");
      return;
    }
    const num = Number(text);
    if (num < 1) setSeatsError("Minimum 1 seat");
    else if (num > 4) setSeatsError("Max 4 seats allowed");
    else setSeatsError("");
  };

  const handlePlateChange = (text: string) => {
    setVehicleNumber(text);
    if (!text) {
      setPlateError("");
      return;
    }
    const cleaned = text.replace(/\s+/g, "").toUpperCase();
    if (cleaned.length >= 8) {
      const regex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;
      if (!regex.test(cleaned))
        setPlateError("Invalid plate — expected: MP09AB1234");
      else setPlateError("");
    } else {
      setPlateError("");
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!result.canceled) uploadPhoto(result.assets[0].uri);
    } catch {}
  };

  const uploadPhoto = async (uri: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const form = new FormData();
      form.append("file", {
        uri,
        name: "photo.jpg",
        type: "image/jpeg",
      } as any);
      const res = await fetch(`${API_URL}/profile/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (data.success) {
        setProfilePic(data.url);
        updateLocal("profile_pic", data.url);
        Alert.alert("Success", "Photo updated!");
      } else {
        Alert.alert("Error", data.message);
      }
    } catch {}
  };

  const updateLocal = async (key: string, value: string) => {
    const raw = await AsyncStorage.getItem("user");
    if (!raw) return;
    const u = JSON.parse(raw);
    u[key] = value;
    await AsyncStorage.setItem("user", JSON.stringify(u));
  };

  const reloadApp = async () => {
    const isProd = (Constants.manifest as any)?.extra?.eas?.projectId;
    if (isProd) {
      try {
        await Updates.reloadAsync();
        return;
      } catch {}
    }
    router.replace("/home/profileTab");
  };

  const isValidPhone = (p: string) => /^[6-9]\d{9}$/.test(p);

  const isProfileFormValid = () => {
    if (!firstName.trim()) return "First name is required";
    if (!lastName.trim()) return "Last name is required";
    if (!email.trim()) return "Email is required";
    if (!phone.trim()) return "Phone number is required";
    if (!gender.trim()) return "Gender is required";
    return null;
  };

  const hasInlineErrors = () =>
    !!(
      firstNameError ||
      lastNameError ||
      emailError ||
      phoneError ||
      seatsError ||
      plateError ||
      dobError
    );

  const startCooldown = (seconds = 60) => {
    setResendCooldown(seconds);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const sendPhoneOtp = async (targetPhone: string) => {
    setOtpStep("sending");
    setOtpError("");
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_URL}/send-otp`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contact: targetPhone }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.verified) {
          return true;
        }
        setPendingPhone(targetPhone);
        setOtpCode("");
        setOtpStep("pending");
        setOtpModalVisible(true);
        startCooldown(60);
        return false;
      } else {
        setOtpStep("idle");
        Alert.alert("Error", data.message || "Failed to send OTP");
        return false;
      }
    } catch {
      setOtpStep("idle");
      Alert.alert("Error", "Network error sending OTP");
      return false;
    }
  };

  const verifyPhoneOtp = async () => {
    if (otpCode.length < 6) {
      setOtpError("Enter the 6-digit code");
      return;
    }
    setOtpStep("verifying");
    setOtpError("");
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_URL}/verify-otp`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contact: pendingPhone, code: otpCode }),
      });
      const data = await res.json();

      if (data.success) {
        setOtpModalVisible(false);
        setOtpStep("idle");
        await doSaveProfile(pendingPhone);
      } else {
        setOtpStep("pending");
        setOtpError(data.message || "Incorrect code");
      }
    } catch {
      setOtpStep("pending");
      setOtpError("Network error. Try again.");
    }
  };

  const saveProfile = async () => {
    if (saving) return;

    if (hasInlineErrors()) {
      Alert.alert(
        "Fix Errors",
        "Please fix the highlighted fields before saving",
      );
      return;
    }

    const error = isProfileFormValid();
    if (error) {
      Alert.alert("Missing Fields", error);
      return;
    }

    if (!isValidPhone(phone)) {
      Alert.alert(
        "Invalid Phone",
        "Enter a valid 10-digit Indian phone number",
      );
      return;
    }

    const storedPhone = user?.phone || user?.Phone || "";
    const phoneChanged = phone.trim() !== storedPhone.trim();

    if (phoneChanged) {
      const bypassed = await sendPhoneOtp(phone.trim());
      if (bypassed) {
        await doSaveProfile(phone.trim());
      }
      return;
    }

    await doSaveProfile(phone.trim());
  };

  const doSaveProfile = async (verifiedPhone: string) => {
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const body = {
        firstName,
        lastName,
        email,
        gender: gender || null,
        dob: dob || null,
        phone: verifiedPhone,
        vehicleNumber: vehicleNumber || null,
        availableSeats: availableSeats ? Number(availableSeats) : null,
      };

      const res = await fetch(`${API_URL}/profile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        Alert.alert("Error", json?.message || "Profile update failed.");
        setSaving(false);
        return;
      }

      updateLocal("phone", verifiedPhone);
      if (vehicleNumber) updateLocal("vehicleNumber", vehicleNumber);
      if (availableSeats) updateLocal("availableSeats", availableSeats);

      const newProfile = await fetch(`${API_URL}/profile`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const profileData = await newProfile.json();
      if (profileData?.success) {
        await AsyncStorage.setItem("user", JSON.stringify(profileData.user));
      }

      Alert.alert("Success", "Profile updated!", [
        { text: "OK", onPress: reloadApp },
      ]);
    } catch {
      Alert.alert("Error", "Something went wrong");
    }
    setSaving(false);
  };

  if (!user) {
    return (
      <ScreenWrapper>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: colors.text }}>Loading...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const inputStyle = (hasError = false) => ({
    marginTop: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: hasError ? "#ef4444" : colors.border,
    flexDirection: "row" as const,
    alignItems: "center" as const,
  });

  return (
    <ScreenWrapper>
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingTop: 60,
          paddingBottom: 140,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            color: colors.text,
            fontSize: 26,
            fontWeight: "700",
            marginBottom: 24,
          }}
        >
          Edit Profile
        </Text>

        <TouchableOpacity
          onPress={pickImage}
          style={{
            alignSelf: "center",
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: colors.surface,
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            marginBottom: 12,
          }}
        >
          {profilePic ? (
            <Image
              source={{ uri: profilePic }}
              style={{ width: 120, height: 120, borderRadius: 60 }}
            />
          ) : (
            <User size={60} color={colors.textMuted} />
          )}
        </TouchableOpacity>

        <Text
          style={{
            textAlign: "center",
            color: colors.primary,
            marginBottom: 30,
          }}
        >
          Tap to change photo
        </Text>

        <Card style={{ borderRadius: 26, padding: 20 }}>
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 11,
              fontWeight: "600",
              letterSpacing: 0.8,
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            Required
          </Text>

          <Text style={{ color: colors.textMuted, fontSize: 13 }}>
            First Name
          </Text>
          <View style={inputStyle(!!firstNameError)}>
            <TextInput
              style={{ flex: 1, color: colors.text }}
              value={firstName}
              onChangeText={handleFirstNameChange}
              placeholder="Enter first name"
              placeholderTextColor={colors.textMuted}
            />
            <User
              size={18}
              color={firstNameError ? "#ef4444" : colors.primary}
            />
          </View>
          <FieldError message={firstNameError} />

          <Text
            style={{ color: colors.textMuted, fontSize: 13, marginTop: 18 }}
          >
            Last Name
          </Text>
          <View style={inputStyle(!!lastNameError)}>
            <TextInput
              style={{ flex: 1, color: colors.text }}
              value={lastName}
              onChangeText={handleLastNameChange}
              placeholder="Enter last name"
              placeholderTextColor={colors.textMuted}
            />
            <User
              size={18}
              color={lastNameError ? "#ef4444" : colors.primary}
            />
          </View>
          <FieldError message={lastNameError} />

          <Text
            style={{ color: colors.textMuted, fontSize: 13, marginTop: 18 }}
          >
            Email
          </Text>
          <View style={inputStyle(!!emailError)}>
            <TextInput
              style={{ flex: 1, color: colors.text }}
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Enter email"
              placeholderTextColor={colors.textMuted}
            />
            <Mail size={18} color={emailError ? "#ef4444" : colors.primary} />
          </View>
          <FieldError message={emailError} />

          <Text
            style={{ color: colors.textMuted, fontSize: 13, marginTop: 18 }}
          >
            Phone
          </Text>
          <View style={inputStyle(!!phoneError)}>
            <Text style={{ color: colors.text, marginRight: 6 }}>+91</Text>
            <TextInput
              style={{ flex: 1, color: colors.text }}
              value={phone}
              onChangeText={handlePhoneChange}
              placeholder="Enter phone number"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              maxLength={10}
            />
            <Phone size={18} color={phoneError ? "#ef4444" : colors.primary} />
          </View>
          <FieldError message={phoneError} />

          <Text
            style={{ color: colors.textMuted, fontSize: 13, marginTop: 18 }}
          >
            Gender
          </Text>
          <TouchableOpacity
            onPress={() => setGenderModal(true)}
            style={inputStyle(!gender && false)}
          >
            <Text
              style={{
                flex: 1,
                color: gender ? colors.text : colors.textMuted,
              }}
            >
              {gender || "Select gender"}
            </Text>
            <ChevronDown size={18} color={colors.primary} />
          </TouchableOpacity>

          <View
            style={{
              height: 1,
              backgroundColor: colors.border,
              marginVertical: 24,
            }}
          />

          <Text
            style={{
              color: colors.textMuted,
              fontSize: 11,
              fontWeight: "600",
              letterSpacing: 0.8,
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            Optional
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 18,
            }}
          >
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>
              Date of Birth
            </Text>
            <OptionalBadge />
          </View>
          <TouchableOpacity
            onPress={() => setShowDobPicker(true)}
            style={inputStyle(!!dobError)}
          >
            <Text
              style={{ flex: 1, color: dob ? colors.text : colors.textMuted }}
            >
              {dob || "Select date"}
            </Text>
            <Calendar size={18} color={dobError ? "#ef4444" : colors.primary} />
          </TouchableOpacity>
          <FieldError message={dobError} />

          {showDobPicker && (
            <DateTimePicker
              value={dobDate}
              mode="date"
              display="calendar"
              maximumDate={new Date()}
              onChange={(e, selected) => {
                setShowDobPicker(false);
                if (selected) {
                  setDobDate(selected);
                  setDob(selected.toISOString().slice(0, 10));
                  const today = new Date();
                  let age = today.getFullYear() - selected.getFullYear();
                  const monthDiff = today.getMonth() - selected.getMonth();
                  if (
                    monthDiff < 0 ||
                    (monthDiff === 0 && today.getDate() < selected.getDate())
                  ) {
                    age--;
                  }
                  if (age < 17) {
                    setDobError("You must be at least 17 years old");
                  } else {
                    setDobError("");
                  }
                }
              }}
            />
          )}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 18,
            }}
          >
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>
              Vehicle Number
            </Text>
            <OptionalBadge />
          </View>
          <View style={inputStyle(!!plateError)}>
            <TextInput
              style={{ flex: 1, color: colors.text }}
              value={vehicleNumber}
              onChangeText={handlePlateChange}
              placeholder="e.g. MP09AB1234"
              autoCapitalize="characters"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <FieldError message={plateError} />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 18,
            }}
          >
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>
              Available Seats
            </Text>
            <OptionalBadge />
          </View>
          <View style={inputStyle(!!seatsError)}>
            <TextInput
              style={{ flex: 1, color: colors.text }}
              value={availableSeats}
              onChangeText={handleSeatsChange}
              placeholder="e.g. 3"
              keyboardType="numeric"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <FieldError message={seatsError} />

          <View style={{ marginTop: 28 }}>
            <Button onPress={saveProfile}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </View>
        </Card>
      </ScrollView>

      <Modal visible={genderModal} transparent animationType="fade">
        <TouchableOpacity
          style={{
            flex: 1,
            justifyContent: "center",
            backgroundColor: "#0006",
            padding: 30,
          }}
          onPress={() => setGenderModal(false)}
        >
          <Card style={{ borderRadius: 24, padding: 20 }}>
            {["Male", "Female", "Other"].map((g) => (
              <TouchableOpacity
                key={g}
                style={{ paddingVertical: 14 }}
                onPress={() => {
                  setGender(g);
                  setGenderModal(false);
                }}
              >
                <Text style={{ color: colors.text, fontSize: 16 }}>{g}</Text>
              </TouchableOpacity>
            ))}
          </Card>
        </TouchableOpacity>
      </Modal>

      <Modal visible={otpModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, justifyContent: "flex-end" }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 28,
              paddingBottom: 48,
            }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.border,
                alignSelf: "center",
                marginBottom: 24,
              }}
            />

            <Text
              style={{
                color: colors.text,
                fontSize: 20,
                fontWeight: "700",
                marginBottom: 6,
              }}
            >
              Verify New Number
            </Text>
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 14,
                marginBottom: 28,
              }}
            >
              We sent a 6-digit code to +91 {pendingPhone}
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: otpError ? "#ef4444" : colors.border,
                borderRadius: 18,
                paddingHorizontal: 16,
                paddingVertical: 14,
                marginBottom: 8,
              }}
            >
              <TextInput
                style={{
                  flex: 1,
                  color: colors.text,
                  fontSize: 22,
                  letterSpacing: 8,
                }}
                value={otpCode}
                onChangeText={(t) => {
                  if (/^\d*$/.test(t)) setOtpCode(t);
                  setOtpError("");
                }}
                placeholder="------"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
            </View>

            {otpError ? (
              <Text
                style={{ color: "#ef4444", fontSize: 13, marginBottom: 16 }}
              >
                {otpError}
              </Text>
            ) : (
              <View style={{ height: 24 }} />
            )}

            <Button
              onPress={verifyPhoneOtp}
              disabled={otpStep === "verifying" || otpCode.length < 6}
            >
              {otpStep === "verifying" ? "Verifying..." : "Verify & Save"}
            </Button>

            <TouchableOpacity
              onPress={() => {
                if (resendCooldown > 0) return;
                sendPhoneOtp(pendingPhone);
              }}
              style={{ marginTop: 18, alignItems: "center" }}
              disabled={resendCooldown > 0}
            >
              <Text
                style={{
                  color: resendCooldown > 0 ? colors.textMuted : colors.primary,
                  fontSize: 14,
                }}
              >
                {resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : "Resend code"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setOtpModalVisible(false);
                setOtpStep("idle");
                setOtpCode("");
                setOtpError("");
              }}
              style={{ marginTop: 12, alignItems: "center" }}
            >
              <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenWrapper>
  );
}
