import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as Updates from "expo-updates";
import {
  Calendar,
  Clock,
  FileText,
  Hash,
  MapPin,
  Navigation,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { LatLng, Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { SafeAreaView } from "react-native-safe-area-context";
import io from "socket.io-client";
import { apiFetch } from "../../lib/apiFetch";
import { API_URL, GOOGLE_MAPS_API_KEY } from "../../lib/config";
import { globalStyles } from "../../styles/global";
import { useTheme } from "../../theme/ThemeContext";
import Button from "../components/Button";
import Card from "../components/Card";
import LiftBuddyLoader from "../components/LiftBuddyLoader";
import ScreenWrapper from "../components/ScreenWrapper";

const LATITUDE_DELTA = 0.05;
const LONGITUDE_DELTA = 0.05;

const PRICE_PER_KM: Record<string, number> = { bike: 6, car: 10 };
const CREDITS_PER_INR = 10;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const ITM_GWALIOR = {
  description:
    "ITM Gwalior, Nh-75, opp. Sithouli Railway Station, Sithouli, Gwalior, Madhya Pradesh 474001",
  location: { latitude: 26.1473717, longitude: 78.1880359 },
};

type RecentPickupOrDest = { description: string; location: LatLng };

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcPrice(vehicleType: string, pickup: any, destination: any) {
  if (!pickup?.location || !destination?.location) return null;
  const km = haversineKm(
    pickup.location.latitude,
    pickup.location.longitude,
    destination.location.latitude,
    destination.location.longitude,
  );
  const inrPerKm = PRICE_PER_KM[vehicleType] ?? PRICE_PER_KM.car;
  const inr = Math.round(km * inrPerKm);
  return { inr, credits: inr * CREDITS_PER_INR, km: Math.round(km * 10) / 10 };
}

function isValidIndianPlate(plate: string) {
  return /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/.test(
    plate.replace(/\s+/g, ""),
  );
}

function isValidCoord(loc: any) {
  return (
    loc &&
    typeof loc.latitude === "number" &&
    Number.isFinite(loc.latitude) &&
    typeof loc.longitude === "number" &&
    Number.isFinite(loc.longitude)
  );
}

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

function VehicleSelector({
  value,
  onChange,
  colors,
}: {
  value: "bike" | "car";
  onChange: (v: "bike" | "car") => void;
  colors: any;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
      {(["bike", "car"] as const).map((v) => {
        const active = value === v;
        const seats = v === "bike" ? 1 : 3;
        return (
          <TouchableOpacity
            key={v}
            onPress={() => onChange(v)}
            style={{
              flex: 1,
              padding: 14,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: active ? colors.primary : colors.border,
              backgroundColor: active ? colors.primary + "15" : colors.card,
              alignItems: "center",
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 28 }}>{v === "bike" ? "🏍️" : "🚗"}</Text>
            <Text
              style={{
                fontWeight: "700",
                color: active ? colors.primary : colors.text,
                textTransform: "capitalize",
                fontSize: 14,
              }}
            >
              {v}
            </Text>
            <View style={{ flexDirection: "row", gap: 3, marginTop: 2 }}>
              {Array.from({ length: seats }).map((_, i) => (
                <Text key={i} style={{ fontSize: 13 }}>
                  {v === "bike" ? "🧑" : "🪑"}
                </Text>
              ))}
            </View>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>
              {seats} {seats === 1 ? "seat" : "seats"} · {PRICE_PER_KM[v]}{" "}
              INR/km
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function DayPicker({
  selected,
  onToggle,
  colors,
}: {
  selected: string[];
  onToggle: (d: string) => void;
  colors: any;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 12,
      }}
    >
      {DAYS.map((d) => {
        const active = selected.includes(d);
        return (
          <TouchableOpacity
            key={d}
            onPress={() => onToggle(d)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 20,
              backgroundColor: active ? colors.primary : colors.card,
              borderWidth: 1,
              borderColor: active ? colors.primary : colors.border,
            }}
          >
            <Text
              style={{
                color: active ? "#fff" : colors.text,
                fontWeight: "600",
                fontSize: 12,
              }}
            >
              {d}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ITMFillModal({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (field: "pickup" | "destination") => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.45)",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 32,
        }}
      >
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 24,
              padding: 24,
              width: "100%",
              minWidth: 280,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 18 }}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: "#eff6ff",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 10,
                }}
              >
                <Text style={{ fontSize: 26 }}>🏛️</Text>
              </View>
              <Text
                style={{ fontSize: 16, fontWeight: "800", color: "#0f172a" }}
              >
                Autofill ITM Gwalior
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  textAlign: "center",
                  marginTop: 4,
                }}
              >
                Where would you like to set{"\n"}ITM Gwalior?
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => onSelect("pickup")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                backgroundColor: "#f0fdf4",
                borderRadius: 14,
                padding: 14,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: "#bbf7d0",
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#22c55e",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 16 }}>📍</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 14, fontWeight: "700", color: "#15803d" }}
                >
                  Set as Pickup
                </Text>
                <Text style={{ fontSize: 11, color: "#166534" }}>
                  Start ride from ITM Gwalior
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onSelect("destination")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                backgroundColor: "#fff1f2",
                borderRadius: 14,
                padding: 14,
                marginBottom: 18,
                borderWidth: 1,
                borderColor: "#fecdd3",
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#ef4444",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 16 }}>🏁</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 14, fontWeight: "700", color: "#dc2626" }}
                >
                  Set as Destination
                </Text>
                <Text style={{ fontSize: 11, color: "#b91c1c" }}>
                  Ride to ITM Gwalior
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={{ paddingVertical: 10, alignItems: "center" }}
            >
              <Text style={{ color: "#94a3b8", fontSize: 14 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

type DriverOnboardStep = "phone" | "gender" | "id";

function DriverOnboardSheet({
  visible,
  onClose,
  onComplete,
  initialPhone,
  initialGender,
  isEmailVerified,
  isLicenceVerified,
}: {
  visible: boolean;
  onClose: () => void;
  onComplete: (phone: string, gender: string) => void;
  initialPhone: string;
  initialGender: string;
  isEmailVerified: boolean;
  isLicenceVerified: boolean;
}) {
  const { colors } = useTheme();
  const router = useRouter();

  const computeSteps = (): DriverOnboardStep[] => {
    const s: DriverOnboardStep[] = [];
    if (!isLicenceVerified) s.push("id");
    if (!initialPhone) s.push("phone");
    if (!initialGender) s.push("gender");
    return s;
  };

  const [steps, setSteps] = useState<DriverOnboardStep[]>(computeSteps);
  const [currentStep, setCurrentStep] = useState<DriverOnboardStep>(
    computeSteps()[0] || "phone",
  );
  const [phone, setPhone] = useState(initialPhone || "");
  const [phoneError, setPhoneError] = useState("");
  const [gender, setGender] = useState(initialGender || "");

  useEffect(() => {
    if (visible) {
      const freshSteps = computeSteps();
      setSteps(freshSteps);
      setCurrentStep(freshSteps[0] || "phone");
      setPhone(initialPhone || "");
      setGender(initialGender || "");
      setPhoneError("");
    }
  }, [visible, initialPhone, initialGender, isLicenceVerified]);

  const stepIndex = steps.indexOf(currentStep);
  const totalSteps = steps.length;

  const goPrev = () => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) setCurrentStep(steps[prevIndex]);
  };

  const handlePhoneChange = (text: string) => {
    if (!/^\d*$/.test(text)) return;
    setPhone(text);
    if (!text) {
      setPhoneError("Phone number is required");
    } else if (text.length < 10) {
      setPhoneError(
        `${10 - text.length} more digit${10 - text.length > 1 ? "s" : ""} needed`,
      );
    } else if (!/^[6-9]\d{9}$/.test(text)) {
      setPhoneError("Must start with 6, 7, 8 or 9");
    } else {
      setPhoneError("");
    }
  };

  const handleNext = () => {
    if (currentStep === "phone") {
      if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
        setPhoneError(
          phone
            ? "Must start with 6, 7, 8 or 9 and be 10 digits"
            : "Phone number is required",
        );
        return;
      }
    }
    if (currentStep === "gender") {
      if (!gender) {
        Alert.alert("Required", "Please select your gender");
        return;
      }
    }
    const nextIndex = stepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    } else {
      onComplete(phone, gender);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, justifyContent: "flex-end" }}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
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

          {totalSteps > 1 && (
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                alignSelf: "center",
                marginBottom: 24,
              }}
            >
              {steps.map((s, i) => (
                <View
                  key={s}
                  style={{
                    width: i === stepIndex ? 24 : 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor:
                      i === stepIndex ? colors.primary : colors.border,
                  }}
                />
              ))}
            </View>
          )}

          {currentStep === "phone" && (
            <>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 20,
                  fontWeight: "700",
                  marginBottom: 6,
                }}
              >
                📱 Contact number
              </Text>
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 14,
                  marginBottom: 24,
                }}
              >
                Passengers need a way to reach you. Add your phone number to
                continue.
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: phoneError ? "#ef4444" : colors.border,
                  borderRadius: 18,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: colors.text, marginRight: 6 }}>+91</Text>
                <TextInput
                  style={{ flex: 1, color: colors.text, fontSize: 16 }}
                  value={phone}
                  onChangeText={handlePhoneChange}
                  placeholder="10-digit phone number"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={10}
                  autoFocus
                />
              </View>
              {phoneError ? (
                <Text
                  style={{ color: "#ef4444", fontSize: 12, marginBottom: 16 }}
                >
                  {phoneError}
                </Text>
              ) : (
                <View style={{ height: 24 }} />
              )}
              <TouchableOpacity
                onPress={handleNext}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: colors.background,
                    fontSize: 15,
                    fontWeight: "600",
                  }}
                >
                  {stepIndex < steps.length - 1 ? "Next →" : "Create Ride ✓"}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {currentStep === "gender" && (
            <>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 20,
                  fontWeight: "700",
                  marginBottom: 6,
                }}
              >
                👤 Your gender
              </Text>
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 14,
                  marginBottom: 24,
                }}
              >
                This lets you offer female-only rides for added safety.
              </Text>
              <View style={{ gap: 10, marginBottom: 24 }}>
                {["Male", "Female", "Other"].map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGender(g)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      padding: 16,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor:
                        gender === g ? colors.primary : colors.border,
                      backgroundColor:
                        gender === g ? colors.primary + "15" : colors.surface,
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>
                      {g === "Male" ? "👨" : g === "Female" ? "👩" : "🧑"}
                    </Text>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "600",
                        color: gender === g ? colors.primary : colors.text,
                        flex: 1,
                      }}
                    >
                      {g}
                    </Text>
                    {gender === g && (
                      <Text style={{ color: colors.primary, fontSize: 18 }}>
                        ✓
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                onPress={handleNext}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    color: colors.background,
                    fontSize: 15,
                    fontWeight: "600",
                  }}
                >
                  {stepIndex < steps.length - 1 ? "Next →" : "Create Ride ✓"}
                </Text>
              </TouchableOpacity>
              {stepIndex > 0 && (
                <TouchableOpacity
                  onPress={goPrev}
                  style={{ alignItems: "center", paddingVertical: 8 }}
                >
                  <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                    ← Back
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {currentStep === "id" && (
            <>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 20,
                  fontWeight: "700",
                  marginBottom: 6,
                }}
              >
                🪪 ID Verification
              </Text>
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 14,
                  marginBottom: 24,
                }}
              >
                Drivers must verify their identity before offering rides. This
                keeps passengers safe.
              </Text>
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 24,
                  borderWidth: 1,
                  borderColor: colors.border,
                  gap: 12,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 24 }}>📋</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.text,
                        fontWeight: "600",
                        fontSize: 14,
                      }}
                    >
                      What you'll need
                    </Text>
                    <Text
                      style={{
                        color: colors.textMuted,
                        fontSize: 13,
                        marginTop: 2,
                      }}
                    >
                      A valid government-issued ID (Aadhaar, Driving Licence, or
                      Student ID)
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 24 }}>⏱️</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.text,
                        fontWeight: "600",
                        fontSize: 14,
                      }}
                    >
                      Quick process
                    </Text>
                    <Text
                      style={{
                        color: colors.textMuted,
                        fontSize: 13,
                        marginTop: 2,
                      }}
                    >
                      Usually verified within a few minutes
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  router.push("../verify/verifyLicence");
                }}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    color: colors.background,
                    fontSize: 15,
                    fontWeight: "600",
                  }}
                >
                  Verify ID →
                </Text>
              </TouchableOpacity>
              {stepIndex > 0 && (
                <TouchableOpacity
                  onPress={goPrev}
                  style={{ alignItems: "center", paddingVertical: 8 }}
                >
                  <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                    ← Back
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}

          <TouchableOpacity
            onPress={onClose}
            style={{ alignItems: "center", paddingVertical: 10 }}
          >
            <Text style={{ color: colors.textMuted, fontSize: 14 }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function Driver() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView | null>(null);
  const socketRef = useRef<any>(null);

  const [user, setUser] = useState<any | null>(null);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [permissionsGranted, setPermissionsGranted] = useState<boolean | null>(
    null,
  );
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [ready, setReady] = useState(true);

  const [pickup, setPickup] = useState<RecentPickupOrDest | null>(null);
  const [destination, setDestination] = useState<RecentPickupOrDest | null>(
    null,
  );
  const [pickupIsCurrent, setPickupIsCurrent] = useState(false);
  const [destinationIsCurrent, setDestinationIsCurrent] = useState(false);

  const [vehicleType, setVehicleType] = useState<"bike" | "car">("car");

  const seats = vehicleType === "bike" ? 1 : 3;

  const [rideNumber, setRideNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [plateError, setPlateError] = useState("");

  const [rideDateTime, setRideDateTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showITMModal, setShowITMModal] = useState(false);
  const [showOnboard, setShowOnboard] = useState(false);
  const [pendingRideData, setPendingRideData] = useState<any | null>(null);

  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDays, setScheduleDays] = useState<string[]>([]);
  const [scheduleTime, setScheduleTime] = useState("08:00");
  const [showScheduleTimePicker, setShowScheduleTimePicker] = useState(false);

  const priceCalc = calcPrice(vehicleType, pickup, destination);

  const handleVehicleChange = (v: "bike" | "car") => {
    setVehicleType(v);
  };

  const toggleDay = (d: string) => {
    setScheduleDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  };

  const handlePlateChange = (text: string) => {
    setRideNumber(text);
    if (!text) {
      setPlateError("");
      return;
    }
    const cleaned = text.replace(/\s+/g, "").toUpperCase();
    if (cleaned.length >= 8) {
      setPlateError(
        isValidIndianPlate(cleaned)
          ? ""
          : "Invalid plate — expected format: MP09AB1234",
      );
    } else {
      setPlateError("");
    }
  };

  useFocusEffect(
    useCallback(() => {
      const refreshUser = async () => {
        try {
          const j = await AsyncStorage.getItem("user");
          if (j) {
            const parsed = JSON.parse(j);
            setUser({
              ...parsed,
              emailVerified:
                parsed.emailVerified ?? parsed.EmailVerified ?? false,
              LicenceVerified:
                parsed.LicenceVerified ?? parsed.licenceVerified ?? false,
            });
          }
        } catch {}
      };
      refreshUser();
    }, []),
  );

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const j = await AsyncStorage.getItem("user");
        if (j) {
          const parsed = JSON.parse(j);
          const normalized = {
            ...parsed,
            emailVerified:
              parsed.emailVerified ?? parsed.EmailVerified ?? false,
            LicenceVerified:
              parsed.LicenceVerified ?? parsed.licenceVerified ?? false,
          };
          if (mounted) setUser(normalized);
          if (!rideNumber && normalized?.vehicleNumber)
            setRideNumber(normalized.vehicleNumber);
        }

        const a = await AsyncStorage.getItem("active_session");
        if (a && mounted) setActiveSession(JSON.parse(a));

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (mounted) {
            setPermissionsGranted(false);
            setReady(true);
          }
          return;
        }
        if (mounted) setPermissionsGranted(true);

        try {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          if (mounted)
            setCurrentLocation({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
        } catch {
          if (mounted)
            setCurrentLocation({ latitude: 26.2183, longitude: 78.1828 });
        }

        if (mounted) setReady(true);
      } catch (e) {
        console.warn("Driver init error", e);
        if (mounted) {
          setPermissionsGranted(false);
          setReady(true);
        }
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ready || !user) return;
    try {
      const socket = io(API_URL, { transports: ["websocket"], forceNew: true });
      socketRef.current = socket;

      socket.on("connect", () => {
        try {
          if (user?.Id)
            socket.emit("register_driver", { driverId: String(user.Id) });
        } catch {}
      });

      socket.on("ride_request_accepted", async (data: any) => {
        if (!data?.sessionId) return;
        const sessionData = { sessionId: data.sessionId, mode: "driver" };
        await AsyncStorage.setItem(
          "active_session",
          JSON.stringify(sessionData),
        );
        setActiveSession(sessionData);
        router.push({ pathname: "/ride/tracking", params: sessionData });
      });

      socket.on("connect_error", (err: any) => {
        console.warn("socket connect_error", err);
      });
    } catch (e) {
      console.warn("Socket init failed", e);
    }
    return () => {
      try {
        socketRef.current?.disconnect?.();
      } catch {}
    };
  }, [ready, user]);

  useEffect(() => {
    try {
      if (params?.pickupDesc && params?.pickupLat && params?.pickupLng) {
        const desc = decodeURIComponent(params.pickupDesc as string);
        const lat = Number(params.pickupLat),
          lng = Number(params.pickupLng);
        if (!pickup || pickup.description !== desc) {
          setPickup({
            description: desc,
            location: { latitude: lat, longitude: lng },
          });
          setPickupIsCurrent(params.pickupIsCurrent === "1");
        }
      }
    } catch {}
  }, [params?.pickupDesc, params?.pickupLat, params?.pickupLng]);

  useEffect(() => {
    try {
      if (
        params?.destinationDesc &&
        params?.destinationLat &&
        params?.destinationLng
      ) {
        const desc = decodeURIComponent(params.destinationDesc as string);
        const lat = Number(params.destinationLat),
          lng = Number(params.destinationLng);
        if (!destination || destination.description !== desc) {
          setDestination({
            description: desc,
            location: { latitude: lat, longitude: lng },
          });
          setDestinationIsCurrent(params.destinationIsCurrent === "1");
        }
      }
    } catch {}
  }, [params?.destinationDesc, params?.destinationLat, params?.destinationLng]);

  const fitToMarkers = () => {
    try {
      if (!mapRef.current) return;
      const ids: string[] = [];
      if (pickup && isValidCoord(pickup.location)) ids.push("pickup");
      if (destination && isValidCoord(destination.location))
        ids.push("destination");
      if (ids.length) {
        mapRef.current.fitToSuppliedMarkers(ids, {
          edgePadding: { top: 90, right: 30, bottom: 300, left: 30 },
          animated: true,
        });
      }
    } catch (e) {
      console.warn("fitToMarkers error", e);
    }
  };

  const updateCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Location permission is required to use the map.",
        );
        setPermissionsGranted(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      try {
        mapRef.current?.animateToRegion(
          {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          },
          500,
        );
      } catch {}
    } catch (e) {
      console.warn("updateCurrentLocation error", e);
      Alert.alert("Error", "Unable to get current location.");
    }
  };

  const validateDateTime = () => {
    if (isScheduled) return true;
    if (!rideDateTime) {
      Alert.alert("Missing Time", "Select date & time");
      return false;
    }
    if (rideDateTime.getTime() <= Date.now()) {
      Alert.alert("Invalid Time", "Ride cannot be in the past");
      return false;
    }
    return true;
  };

  const validateForm = (): boolean => {
    if (!pickup || !destination || !rideNumber) {
      Alert.alert("Missing Fields", "Fill all required fields");
      return false;
    }
    if (!validateDateTime()) return false;
    if (!isValidIndianPlate(rideNumber)) {
      Alert.alert(
        "Invalid Number Plate",
        "Enter a valid Indian number plate (e.g. MP09AB1234)",
      );
      return false;
    }
    if (plateError) {
      Alert.alert("Fix Errors", "Please fix the highlighted fields first");
      return false;
    }
    if (isScheduled && scheduleDays.length === 0) {
      Alert.alert(
        "No Days Selected",
        "Select at least one day for the schedule.",
      );
      return false;
    }
    return true;
  };

  const handleSubmitRide = async () => {
    if (!validateForm()) return;

    const normalizedUser = user
      ? {
          ...user,
          emailVerified: user.emailVerified ?? user.EmailVerified ?? false,
          LicenceVerified:
            user.LicenceVerified ?? user.licenceVerified ?? false,
        }
      : null;

    const needsPhone = !normalizedUser?.phone && !normalizedUser?.Phone;
    const needsGender = !normalizedUser?.gender;
    const needsLicence = !normalizedUser?.LicenceVerified;

    let rideDateTimeStr: string;
    if (isScheduled) {
      const today = new Date();
      const [h, m] = scheduleTime.split(":");
      today.setHours(Number(h), Number(m), 0, 0);
      rideDateTimeStr = today.toISOString().slice(0, 19).replace("T", " ");
    } else {
      rideDateTimeStr =
        rideDateTime?.toISOString().slice(0, 19).replace("T", " ") ?? "";
    }

    if (needsPhone || needsGender || needsLicence) {
      setPendingRideData({
        pickup,
        destination,
        seats,
        vehicleType,
        rideNumber: rideNumber.toUpperCase().replace(/\s+/g, ""),
        price: priceCalc?.inr ?? 0,
        notes: notes?.trim() ? notes : "Nothing Specified",
        rideDateTime: rideDateTimeStr,
        gender: normalizedUser?.gender ?? null,
        isScheduled,
        scheduleDays: isScheduled ? scheduleDays : [],
        scheduleTime: isScheduled ? scheduleTime : "",
        rideType: normalizedUser?.isFaculty ? "faculty" : "general",
      });
      setShowOnboard(true);
      return;
    }

    await doSubmitRide(null, null);
  };

  const handleOnboardComplete = async (phone: string, gender: string) => {
    setShowOnboard(false);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const raw = await AsyncStorage.getItem("user");
      const currentUser = raw ? JSON.parse(raw) : {};
      const existingPhone = currentUser?.phone || currentUser?.Phone || "";
      const existingGender = currentUser?.gender || "";

      if ((!existingPhone && phone) || (!existingGender && gender)) {
        await fetch(`${API_URL}/profile`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            email: currentUser.email,
            gender: gender || existingGender,
            dob: currentUser.dob || null,
            phone: phone || existingPhone,
            vehicleNumber: currentUser.vehicleNumber || "",
            availableSeats: currentUser.availableSeats || null,
          }),
        });
        const updated = {
          ...currentUser,
          phone: phone || existingPhone,
          gender: gender || existingGender,
        };
        await AsyncStorage.setItem("user", JSON.stringify(updated));
        setUser(updated);
      }
    } catch {}
    await doSubmitRide(phone, gender);
  };

  const doSubmitRide = async (
    overridePhone: string | null,
    overrideGender: string | null,
  ) => {
    const normalizedUser = user
      ? { ...user, isFaculty: user.isFaculty ?? false }
      : null;

    let rideDateTimeStr: string;
    if (isScheduled) {
      const today = new Date();
      const [h, m] = scheduleTime.split(":");
      today.setHours(Number(h), Number(m), 0, 0);
      rideDateTimeStr = today.toISOString().slice(0, 19).replace("T", " ");
    } else {
      rideDateTimeStr =
        rideDateTime?.toISOString().slice(0, 19).replace("T", " ") ?? "";
    }

    const data = pendingRideData || {
      pickup,
      destination,
      seats,
      vehicleType,
      rideNumber: rideNumber.toUpperCase().replace(/\s+/g, ""),
      price: priceCalc?.inr ?? 0,
      notes: notes?.trim() ? notes : "Nothing Specified",
      rideDateTime: rideDateTimeStr,
      gender: overrideGender ?? user?.gender ?? null,
      isScheduled,
      scheduleDays: isScheduled ? scheduleDays : [],
      scheduleTime: isScheduled ? scheduleTime : "",
      rideType: normalizedUser?.isFaculty ? "faculty" : "general",
    };

    try {
      const token = await AsyncStorage.getItem("token");
      const res: any = await apiFetch(`${API_URL}/rides`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.success) {
        Alert.alert("Error", res.message || "Failed to save ride");
        setPendingRideData(null);
        return;
      }

      setPickup(null);
      setDestination(null);
      setRideNumber("");
      setNotes("");
      setRideDateTime(null);
      setPlateError("");
      setPendingRideData(null);
      setIsScheduled(false);
      setScheduleDays([]);

      const creditsEarned = priceCalc ? priceCalc.credits : 0;
      Alert.alert(
        "Ride Posted! 🎉",
        isScheduled
          ? `Your ride repeats every ${scheduleDays.join(", ")} at ${scheduleTime}.\nYou'll earn 🪙 ${creditsEarned} credits per trip upon completion.`
          : `Ride registered successfully.\nYou'll earn 🪙 ${creditsEarned} credits upon completion.`,
        [
          {
            text: "OK",
            onPress: async () => {
              try {
                await Updates.reloadAsync();
              } catch {
                router.replace("/home/passenger");
              }
            },
          },
        ],
      );
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save ride");
      setPendingRideData(null);
    }
  };

  const resumeSession = async () => {
    try {
      const raw = await AsyncStorage.getItem("active_session");
      if (!raw)
        return Alert.alert(
          "No active session",
          "You don't have an active session",
        );
      const active = JSON.parse(raw);
      router.push({
        pathname: "/ride/tracking",
        params: { sessionId: active.sessionId, mode: "driver" },
      });
    } catch (e) {
      console.warn("resume error", e);
    }
  };

  const handleITMFill = (field: "pickup" | "destination") => {
    setShowITMModal(false);
    if (field === "pickup") {
      setPickup(ITM_GWALIOR);
      setPickupIsCurrent(false);
    } else {
      setDestination(ITM_GWALIOR);
      setDestinationIsCurrent(false);
    }
    setTimeout(fitToMarkers, 200);
  };

  const normalizedUser = user
    ? {
        ...user,
        emailVerified: user.emailVerified ?? user.EmailVerified ?? false,
        LicenceVerified: user.LicenceVerified ?? user.licenceVerified ?? false,
      }
    : null;

  if (permissionsGranted === false) {
    return (
      <ScreenWrapper>
        <SafeAreaView style={{ flex: 1 }}>
          <View
            style={{
              flex: 1,
              padding: 20,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: 18,
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              Location permission is required to use Driver mode.
            </Text>
            <Button onPress={updateCurrentLocation}>Grant Permission</Button>
            <TouchableOpacity
              onPress={() => Linking.openSettings()}
              style={{ marginTop: 12 }}
            >
              <Text style={{ color: colors.primary }}>Open App Settings</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ScreenWrapper>
    );
  }

  if (!currentLocation) {
    return (
      <ScreenWrapper>
        <SafeAreaView style={{ flex: 1 }}>
          <LiftBuddyLoader text="Getting your location..." />
        </SafeAreaView>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ITMFillModal
        visible={showITMModal}
        onClose={() => setShowITMModal(false)}
        onSelect={handleITMFill}
      />

      <DriverOnboardSheet
        visible={showOnboard}
        onClose={() => {
          setShowOnboard(false);
          setPendingRideData(null);
        }}
        onComplete={handleOnboardComplete}
        initialPhone={normalizedUser?.phone || normalizedUser?.Phone || ""}
        initialGender={normalizedUser?.gender || ""}
        isEmailVerified={normalizedUser?.emailVerified ?? false}
        isLicenceVerified={normalizedUser?.LicenceVerified ?? false}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            padding: 16,
            paddingTop: 0,
            paddingBottom: 120,
            backgroundColor: colors.background,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Text
            style={[globalStyles.title, { color: colors.text, marginTop: 10 }]}
          >
            Register a Ride
          </Text>

          {normalizedUser?.isFaculty && (
            <View
              style={{
                backgroundColor: "#1a3a6b",
                borderRadius: 10,
                padding: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 15 }}>🏛️</Text>
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>
                Faculty Ride — will be posted to faculty pool
              </Text>
            </View>
          )}

          {normalizedUser && !normalizedUser.emailVerified && (
            <View
              style={{
                marginBottom: 12,
                padding: 12,
                backgroundColor: "#fef3c7",
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Text style={{ fontSize: 16 }}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 13, color: "#92400e", fontWeight: "600" }}
                >
                  Email not verified
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("../verify/verifyEmail")}
                >
                  <Text
                    style={{ fontSize: 12, color: "#b45309", marginTop: 2 }}
                  >
                    Tap to verify →
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {activeSession && (
            <TouchableOpacity
              onPress={resumeSession}
              style={[
                globalStyles.button,
                {
                  backgroundColor: colors.primary,
                  marginBottom: 12,
                  paddingVertical: 12,
                  borderRadius: 8,
                },
              ]}
            >
              <Text
                style={[globalStyles.buttonText, { color: colors.background }]}
              >
                Resume Active Session
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.mapWrap}>
            <MapView
              ref={mapRef}
              style={{ flex: 1 }}
              initialRegion={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA,
              }}
              showsUserLocation
            >
              {pickup && isValidCoord(pickup.location) && !pickupIsCurrent && (
                <Marker
                  coordinate={pickup.location}
                  identifier="pickup"
                  pinColor="blue"
                />
              )}
              {destination && isValidCoord(destination.location) && (
                <Marker
                  coordinate={destination.location}
                  identifier="destination"
                  pinColor="red"
                />
              )}
              {pickup &&
                destination &&
                isValidCoord(pickup.location) &&
                isValidCoord(destination.location) && (
                  <MapViewDirections
                    origin={pickup.location}
                    destination={destination.location}
                    apikey={GOOGLE_MAPS_API_KEY}
                    strokeWidth={4}
                    strokeColor="#4285F4"
                    onReady={() => {
                      try {
                        fitToMarkers();
                      } catch {}
                    }}
                  />
                )}
            </MapView>
          </View>

          <Card style={{ marginBottom: 20 }}>
            <TouchableOpacity
              onPress={() => setShowITMModal(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 7,
                alignSelf: "flex-end",
                backgroundColor: "#1a1a2e",
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 8,
                marginBottom: 16,
              }}
            >
              <Navigation size={13} color="#f59e0b" />
              <Text
                style={{ fontSize: 12, fontWeight: "700", color: "#f59e0b" }}
              >
                Autofill ITM Gwalior
              </Text>
            </TouchableOpacity>

            <Text style={[styles.label, { color: colors.text }]}>
              Vehicle Type
            </Text>
            <VehicleSelector
              value={vehicleType}
              onChange={handleVehicleChange}
              colors={colors}
            />

            {priceCalc && (
              <View
                style={{
                  marginBottom: 16,
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: colors.primary + "10",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.primary + "30",
                }}
              >
                <View>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    ~{priceCalc.km} km · {PRICE_PER_KM[vehicleType]} INR/km
                  </Text>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "700",
                      color: colors.primary,
                    }}
                  >
                    ₹{priceCalc.inr}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    Auto-calculated fare
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    You earn
                  </Text>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "700",
                      color: "#f59e0b",
                    }}
                  >
                    🪙 {priceCalc.credits}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    credits
                  </Text>
                </View>
              </View>
            )}

            <Text style={[styles.label, { color: colors.text }]}>Pickup</Text>
            <TouchableOpacity
              style={[
                styles.inputButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() =>
                router.push({
                  pathname: "../pickupSearch",
                  params: {
                    destinationDesc: destination
                      ? encodeURIComponent(destination.description)
                      : undefined,
                    destinationLat: destination?.location.latitude,
                    destinationLng: destination?.location.longitude,
                    mode: "driver",
                  },
                })
              }
            >
              <Text
                style={[styles.inputText, { color: colors.text }]}
                numberOfLines={1}
              >
                {pickup ? pickup.description : "Select pickup location"}
              </Text>
              <MapPin width={20} height={20} color={colors.primary} />
            </TouchableOpacity>

            <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>
              Destination
            </Text>
            <TouchableOpacity
              style={[
                styles.inputButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() =>
                router.push({
                  pathname: "../destinationSearch",
                  params: {
                    pickupDesc: pickup
                      ? encodeURIComponent(pickup.description)
                      : undefined,
                    pickupLat: pickup?.location.latitude,
                    pickupLng: pickup?.location.longitude,
                    mode: "driver",
                  },
                })
              }
            >
              <Text
                style={[styles.inputText, { color: colors.text }]}
                numberOfLines={1}
              >
                {destination ? destination.description : "Select destination"}
              </Text>
              <MapPin width={20} height={20} color={colors.primary} />
            </TouchableOpacity>

            <View
              style={{
                marginTop: 16,
                padding: 14,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: isScheduled ? 14 : 0,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.text,
                      fontWeight: "600",
                      fontSize: 14,
                    }}
                  >
                    📅 Recurring Schedule
                  </Text>
                  <Text
                    style={{
                      color: colors.textMuted,
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    Repeat this ride on selected days
                  </Text>
                </View>
                <Switch
                  value={isScheduled}
                  onValueChange={setIsScheduled}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>

              {isScheduled && (
                <>
                  <Text
                    style={{
                      color: colors.textMuted,
                      fontSize: 12,
                      marginBottom: 8,
                    }}
                  >
                    Select days:
                  </Text>
                  <DayPicker
                    selected={scheduleDays}
                    onToggle={toggleDay}
                    colors={colors}
                  />

                  <Text
                    style={{
                      color: colors.textMuted,
                      fontSize: 12,
                      marginBottom: 6,
                    }}
                  >
                    Departure time:
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowScheduleTimePicker(true)}
                    style={[
                      styles.inlineInput,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text style={{ color: colors.text }}>
                      🕐 {scheduleTime}
                    </Text>
                    <Clock width={18} height={18} color={colors.primary} />
                  </TouchableOpacity>
                  {showScheduleTimePicker && (
                    <DateTimePicker
                      value={(() => {
                        const [h, m] = scheduleTime.split(":");
                        const d = new Date();
                        d.setHours(Number(h), Number(m));
                        return d;
                      })()}
                      mode="time"
                      onChange={(_e, d) => {
                        setShowScheduleTimePicker(false);
                        if (d) setScheduleTime(d.toTimeString().slice(0, 5));
                      }}
                    />
                  )}
                </>
              )}
            </View>

            {!isScheduled && (
              <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                <View style={[styles.fieldWrap, { flex: 1 }]}>
                  <Text style={[styles.labelSmall, { color: colors.text }]}>
                    Date
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    style={[
                      styles.inlineInput,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text style={{ color: colors.text }}>
                      {rideDateTime
                        ? rideDateTime.toLocaleDateString()
                        : "Select date"}
                    </Text>
                    <Calendar width={18} height={18} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                <View style={[styles.fieldWrap, { width: 120 }]}>
                  <Text style={[styles.labelSmall, { color: colors.text }]}>
                    Time
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowTimePicker(true)}
                    style={[
                      styles.inlineInput,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text style={{ color: colors.text }}>
                      {rideDateTime
                        ? rideDateTime.toLocaleTimeString().slice(0, 5)
                        : "Time"}
                    </Text>
                    <Clock width={18} height={18} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {showDatePicker && (
              <DateTimePicker
                value={rideDateTime ?? new Date()}
                mode="date"
                onChange={(_e, d) => {
                  setShowDatePicker(false);
                  if (d) setRideDateTime(d);
                }}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                value={rideDateTime ?? new Date()}
                mode="time"
                onChange={(_e, d) => {
                  setShowTimePicker(false);
                  if (d) setRideDateTime(d);
                }}
              />
            )}

            <View style={{ marginTop: 12 }}>
              <Text style={[styles.labelSmall, { color: colors.text }]}>
                Ride Number
              </Text>
              <View
                style={[
                  styles.textInputRow,
                  {
                    backgroundColor: colors.card,
                    borderColor: plateError ? "#ef4444" : colors.border,
                  },
                ]}
              >
                <TextInput
                  placeholder="Number Plate (e.g. MP09AB1234)"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.textInput, { color: colors.text }]}
                  value={rideNumber}
                  onChangeText={handlePlateChange}
                  blurOnSubmit={false}
                  autoCorrect={false}
                  autoCapitalize="characters"
                />
                <Hash
                  width={18}
                  height={18}
                  color={plateError ? "#ef4444" : colors.primary}
                />
              </View>
              <FieldError message={plateError} />
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={[styles.labelSmall, { color: colors.text }]}>
                Notes (Optional)
              </Text>
              <View
                style={[
                  styles.textAreaRow,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <TextInput
                  placeholder="Notes (Optional)"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.textArea, { color: colors.text }]}
                  multiline
                  value={notes}
                  onChangeText={setNotes}
                  blurOnSubmit={false}
                  autoCorrect={false}
                />
                <FileText
                  width={18}
                  height={18}
                  color={colors.primary}
                  style={{ marginLeft: 8 }}
                />
              </View>
            </View>

            <View
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 10,
                backgroundColor: "#fffbeb",
                borderWidth: 1,
                borderColor: "#fde68a",
              }}
            >
              <Text
                style={{
                  color: "#92400e",
                  fontWeight: "600",
                  fontSize: 13,
                  marginBottom: 3,
                }}
              >
                🪙 Credits Info
              </Text>
              <Text style={{ color: "#78350f", fontSize: 12, lineHeight: 18 }}>
                {vehicleType === "bike" ? "Bike" : "Car"}:{" "}
                {PRICE_PER_KM[vehicleType]} INR/km ={" "}
                {PRICE_PER_KM[vehicleType] * CREDITS_PER_INR} credits/km.
                {"\n"}Credits are awarded after each completed ride (1 INR ={" "}
                {CREDITS_PER_INR} credits).
                {"\n"}Track your ranking on the Dashboard leaderboard.
              </Text>
            </View>

            <View style={{ marginTop: 20 }}>
              <Button onPress={handleSubmitRide}>
                {isScheduled ? "Create Recurring Ride 📅" : "Submit Ride"}
              </Button>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  mapWrap: {
    height: 260,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  labelSmall: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  inputButton: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
  },
  inputText: { flex: 1, marginRight: 12 },
  inlineInput: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
  },
  fieldWrap: {},
  textInputRow: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
  },
  textInput: { flex: 1, padding: 0 },
  textAreaRow: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  textArea: { flex: 1, minHeight: 84, textAlignVertical: "top", padding: 0 },
});
