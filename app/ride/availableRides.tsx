import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Star } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { apiFetch } from "../../lib/apiFetch";
import { API_URL } from "../../lib/config";
import { globalStyles } from "../../styles/global";
import { useTheme } from "../../theme/ThemeContext";
import DUMMY_RIDES from "../../dummyRides.json";

function getMatchingDummyRides(
  pickup: string,
  destination: string,
  count = 3,
): any[] {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim();
  const pickupNorm = normalize(decodeURIComponent(pickup || ""));
  const destNorm = normalize(decodeURIComponent(destination || ""));
  const pickupKw = pickupNorm.split(" ").filter((w) => w.length >= 3);
  const destKw = destNorm.split(" ").filter((w) => w.length >= 3);

  const matched = (DUMMY_RIDES as any[]).filter((ride) => {
    const rp = normalize(ride.pickup_desc);
    const rd = normalize(ride.destination_desc);
    const pkMatch = pickupKw.some(
      (kw) => rp.includes(kw) || kw.includes("itm") || rp.includes("itm"),
    );
    const dkMatch = destKw.some(
      (kw) => rd.includes(kw) || kw.includes("itm") || rd.includes("itm"),
    );
    const goingToITM =
      destNorm.includes("itm") ||
      destNorm.includes("sithouli") ||
      destNorm.includes("turari");
    const comingFromITM =
      pickupNorm.includes("itm") ||
      pickupNorm.includes("sithouli") ||
      pickupNorm.includes("turari");
    if (goingToITM)
      return (
        rd.includes("itm") || rd.includes("sithouli") || rd.includes("turari")
      );
    if (comingFromITM)
      return (
        rp.includes("itm") || rp.includes("sithouli") || rp.includes("turari")
      );
    return pkMatch || dkMatch;
  });
  return matched.sort(() => Math.random() - 0.5).slice(0, count);
}

const CREDITS_PER_INR = 10;

function priceToCredits(price: any): number | null {
  if (price === null || price === undefined || price === "") return null;
  const n = parseFloat(price);
  return isNaN(n) ? null : Math.round(n * CREDITS_PER_INR);
}

function formatDateTime(dt: string) {
  try {
    return new Date(dt).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dt;
  }
}

function SeatIcons({ ride }: { ride: any }) {
  const isBike = (ride.vehicleType ?? ride.vehicle_type ?? "car") === "bike";
  const total = isBike ? 1 : 3;
  const left = Number(ride.seats ?? total);
  const taken = total - left;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
      {Array.from({ length: total }).map((_, i) => (
        <Text key={i} style={{ fontSize: 14, opacity: i < taken ? 0.2 : 1 }}>
          {isBike ? "🧑" : "🪑"}
        </Text>
      ))}
      <Text style={{ fontSize: 11, color: "#888", marginLeft: 2 }}>
        {isBike ? "🏍️" : "🚗"} {left} left
      </Text>
    </View>
  );
}

function ScheduleBadge({ ride, colors }: { ride: any; colors: any }) {
  if (!ride.is_scheduled && !ride.isScheduled) return null;
  const days = ride.schedule_days ?? ride.scheduleDays ?? "";
  const time = ride.schedule_time ?? ride.scheduleTime ?? "";
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 4,
        backgroundColor: colors.primary + "15",
        alignSelf: "flex-start",
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
      }}
    >
      <Text style={{ fontSize: 11 }}>📅</Text>
      <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "600" }}>
        {[days, time].filter(Boolean).join(" · ")}
      </Text>
    </View>
  );
}

function StarDisplay({
  rating,
  total,
  size = 12,
  showCount = true,
}: {
  rating: number | null;
  total?: number;
  size?: number;
  showCount?: boolean;
}) {
  const { colors } = useTheme();
  if (!rating) return null;
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          color="#f59e0b"
          strokeWidth={1.5}
          fill={
            s <= fullStars
              ? "#f59e0b"
              : s === fullStars + 1 && hasHalf
                ? "#f59e0b"
                : "transparent"
          }
        />
      ))}
      <Text style={{ fontSize: size, color: colors.textMuted, marginLeft: 3 }}>
        {rating.toFixed(1)}
        {showCount && total ? ` (${total})` : ""}
      </Text>
    </View>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text style={{ fontSize: 12, color: colors.textMuted }}>{children}</Text>
    </View>
  );
}

function DriverAvatar({
  profilePic,
  firstName,
  lastName,
  size = 52,
}: {
  profilePic?: string | null;
  firstName?: string;
  lastName?: string;
  size?: number;
}) {
  const { colors } = useTheme();
  const initials =
    `${(firstName || "").charAt(0)}${(lastName || "").charAt(0)}`.toUpperCase();
  if (profilePic) {
    return (
      <Image
        source={{ uri: profilePic }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.surface ?? colors.card,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{ fontSize: size * 0.34, fontWeight: "600", color: colors.text }}
      >
        {initials || "?"}
      </Text>
    </View>
  );
}

type QuickProfileStep = "phone" | "gender";

function QuickProfileSheet({
  visible,
  onClose,
  onComplete,
  initialPhone,
  initialGender,
}: {
  visible: boolean;
  onClose: () => void;
  onComplete: (phone: string, gender: string) => void;
  initialPhone: string;
  initialGender: string;
}) {
  const { colors } = useTheme();

  const computeSteps = (): QuickProfileStep[] => {
    const s: QuickProfileStep[] = [];
    if (!initialPhone) s.push("phone");
    if (!initialGender) s.push("gender");
    return s;
  };

  const [steps, setSteps] = useState<QuickProfileStep[]>(computeSteps);
  const [step, setStep] = useState<QuickProfileStep>(
    computeSteps()[0] || "gender",
  );
  const [phone, setPhone] = useState(initialPhone || "");
  const [phoneError, setPhoneError] = useState("");
  const [gender, setGender] = useState(initialGender || "");

  useEffect(() => {
    if (visible) {
      const fs = computeSteps();
      setSteps(fs);
      setStep(fs[0] || "gender");
      setPhone(initialPhone || "");
      setGender(initialGender || "");
      setPhoneError("");
    }
  }, [visible, initialPhone, initialGender]);

  const stepIndex = steps.indexOf(step);

  const handlePhoneChange = (text: string) => {
    if (!/^\d*$/.test(text)) return;
    setPhone(text);
    if (!text) setPhoneError("Phone number is required");
    else if (text.length < 10)
      setPhoneError(
        `${10 - text.length} more digit${10 - text.length > 1 ? "s" : ""} needed`,
      );
    else if (!/^[6-9]\d{9}$/.test(text))
      setPhoneError("Must start with 6, 7, 8 or 9");
    else setPhoneError("");
  };

  const handleNext = () => {
    if (step === "phone") {
      if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
        setPhoneError(
          phone
            ? "Must start with 6, 7, 8 or 9 and be 10 digits"
            : "Phone number is required",
        );
        return;
      }
    }
    if (step === "gender" && !gender) {
      Alert.alert("Required", "Please select your gender to continue");
      return;
    }
    const next = stepIndex + 1;
    if (next < steps.length) setStep(steps[next]);
    else onComplete(phone, gender);
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
          {steps.length > 1 && (
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

          {step === "phone" && (
            <>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 20,
                  fontWeight: "700",
                  marginBottom: 6,
                }}
              >
                📱 Add your number
              </Text>
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 14,
                  marginBottom: 24,
                }}
              >
                So the driver can reach you when they're nearby.
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
                  {stepIndex < steps.length - 1 ? "Next →" : "Book Ride ✓"}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {step === "gender" && (
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
                This helps match you with compatible rides (e.g. female-only
                rides).
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
                  Book Ride ✓
                </Text>
              </TouchableOpacity>
              {stepIndex > 0 && (
                <TouchableOpacity
                  onPress={() => setStep(steps[stepIndex - 1])}
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

export default function AvailableRides() {
  const router = useRouter();
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const {
    pickup,
    destination,
    pickupLat,
    pickupLng,
    destLat,
    destLng,
    userPhone,
    userGender,
    rideType: rideTypeParam,
  } = useLocalSearchParams();

  const rideType = (rideTypeParam as string) || "general";

  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState<any | null>(null);
  const [user, setUser] = useState<any>(null);

  const [showQuickProfile, setShowQuickProfile] = useState(false);
  const [pendingRide, setPendingRide] = useState<any | null>(null);

  const [requestingRide, setRequestingRide] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("user").then((u) => {
      if (u) setUser(JSON.parse(u));
    });
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({
          pickupLat: pickupLat as string,
          pickupLng: pickupLng as string,
          destLat: destLat as string,
          destLng: destLng as string,
          rideType,
        });
        const res: any = await apiFetch(
          `${API_URL}/search-rides?${qs.toString()}`,
        );
        const dbRides: any[] = res.success ? res.rides || [] : [];

        const dummyMatches =
          rideType === "general"
            ? getMatchingDummyRides(pickup as string, destination as string, 3)
            : [];

        setRides([...dbRides, ...dummyMatches]);
      } catch (err: any) {
        Alert.alert("Error", err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [pickupLat, pickupLng, destLat, destLng, rideType]);

  const isFemalePassenger = user?.gender?.toLowerCase() === "female";
  const femaleOnlyRides = rides.filter(
    (r) => isFemalePassenger && r.gender?.toLowerCase() === "female",
  );
  const otherRides = rides.filter(
    (r) => !(isFemalePassenger && r.gender?.toLowerCase() === "female"),
  );

  const saveProfileAndBook = async (
    ride: any,
    phone: string,
    gender: string,
  ) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const raw = await AsyncStorage.getItem("user");
      const currentUser = raw ? JSON.parse(raw) : {};
      const existingPhone = currentUser?.phone || currentUser?.Phone || "";
      const existingGender = currentUser?.gender || "";

      if (!existingPhone || !existingGender) {
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
      await executeBookRide(ride);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Something went wrong");
    }
  };

  const executeBookRide = async (ride: any) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res: any = await apiFetch(`${API_URL}/ride-request`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rideId: ride.id,
          pickup: {
            description: pickup,
            location: { latitude: pickupLat, longitude: pickupLng },
          },
          destination: {
            description: destination,
            location: { latitude: destLat, longitude: destLng },
          },
        }),
      });
      if (!res.success) return Alert.alert("Error", res.message);
      Alert.alert("Request Sent", "Waiting for driver approval", [
        { text: "OK", onPress: () => router.replace("/home/Myrides") },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleDummyBook = () => {
    Alert.alert(
      "Ride Already Booked 😔",
      "This ride is no longer available — all seats have been filled. Try another ride!",
      [{ text: "Find Another Ride" }],
    );
  };

  const bookRide = async (ride: any) => {
    if (ride.isDummy) {
      handleDummyBook();
      return;
    }
    const currentPhone = user?.phone || user?.Phone || "";
    const currentGender = user?.gender || "";
    if (!currentPhone || !currentGender) {
      setPendingRide(ride);
      setSelectedRide(null);
      setShowQuickProfile(true);
      return;
    }
    await executeBookRide(ride);
  };

  const handleQuickProfileComplete = async (phone: string, gender: string) => {
    setShowQuickProfile(false);
    if (!pendingRide) return;
    const ride = pendingRide;
    setPendingRide(null);
    await saveProfileAndBook(ride, phone, gender);
  };

  const handleRequestRide = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return router.push("/auth/login");

    setRequestingRide(true);
    try {
      const data: any = await apiFetch(`${API_URL}/standalone-ride-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pickup: {
            description: decodeURIComponent(pickup as string),
            location: {
              latitude: Number(pickupLat),
              longitude: Number(pickupLng),
            },
          },
          destination: {
            description: decodeURIComponent(destination as string),
            location: { latitude: Number(destLat), longitude: Number(destLng) },
          },
          rideType,
        }),
      });

      if (data.success) {
        Alert.alert(
          "Request Posted! 🙋",
          rideType === "faculty"
            ? "Your faculty ride request is live. A driver with a matching route will be notified."
            : "Your ride request is posted. You'll be notified when a driver is available.",
          [{ text: "OK", onPress: () => router.replace("/home/Myrides") }],
        );
      } else {
        Alert.alert("Error", data.message || "Could not post request.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not connect to server.");
    } finally {
      setRequestingRide(false);
    }
  };

  const renderItem = ({ item }: any) => {
    const credits = priceToCredits(item.price);
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setSelectedRide(item)}
        style={{
          backgroundColor: colors.card,
          borderRadius: 12,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
          shadowOpacity: 0.1,
          marginBottom: 12,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <DriverAvatar
            profilePic={item.profile_pic}
            firstName={item.firstName}
            lastName={item.lastName}
            size={40}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text
              style={{ color: colors.text, fontWeight: "600", fontSize: 15 }}
            >
              {item.firstName} {item.lastName}
            </Text>
            {isFemalePassenger && item.gender?.toLowerCase() === "female" && (
              <Text
                style={{
                  backgroundColor: "#FF69B4",
                  color: "white",
                  fontSize: 10,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 6,
                  marginTop: 2,
                  alignSelf: "flex-start",
                }}
              >
                Female Only Ride
              </Text>
            )}
            <View style={{ marginTop: 3 }}>
              <StarDisplay
                rating={item.avg_rating}
                total={item.total_ratings}
                size={11}
              />
            </View>
            <Text
              style={{ color: colors.textMuted, fontSize: 12, marginTop: 1 }}
            >
              {item.ride_number}
            </Text>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            {credits !== null ? (
              <>
                <Text
                  style={{ color: "#f59e0b", fontWeight: "700", fontSize: 15 }}
                >
                  🪙 {credits}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 10 }}>
                  credits
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 10 }}>
                  ₹{parseFloat(item.price).toFixed(0)}
                </Text>
              </>
            ) : (
              <Text
                style={{
                  color: colors.primary,
                  fontWeight: "700",
                  fontSize: 14,
                }}
              >
                Free
              </Text>
            )}
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <SeatIcons ride={item} />
          {item.ride_datetime && (
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>
              {formatDateTime(item.ride_datetime)}
            </Text>
          )}
        </View>

        <ScheduleBadge ride={item} colors={colors} />

        <Text style={{ color: colors.text, marginTop: 8, fontSize: 13 }}>
          From: {item.pickup_desc}
        </Text>
        <Text style={{ color: colors.text, marginTop: 2, fontSize: 13 }}>
          To: {item.destination_desc}
        </Text>

        <TouchableOpacity
          style={[
            globalStyles.button,
            {
              backgroundColor: colors.primary,
              marginTop: 12,
              borderRadius: 8,
              paddingVertical: 10,
            },
          ]}
          onPress={(e) => {
            e.stopPropagation();
            bookRide(item);
          }}
        >
          <Text style={[globalStyles.buttonText, { color: colors.background }]}>
            Book Ride {credits !== null ? `· 🪙 ${credits} credits` : ""}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        globalStyles.container,
        { backgroundColor: colors.background, padding: 0 },
      ]}
    >
      <QuickProfileSheet
        visible={showQuickProfile}
        onClose={() => {
          setShowQuickProfile(false);
          setPendingRide(null);
        }}
        onComplete={handleQuickProfileComplete}
        initialPhone={user?.phone || user?.Phone || ""}
        initialGender={user?.gender || ""}
      />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 12,
          borderBottomWidth: 1,
          borderColor: colors.border,
          marginTop: 30,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginLeft: 6 }}
        >
          <Text style={{ fontSize: 30, color: colors.text }}>←</Text>
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "400",
            color: colors.text,
            marginTop: 8,
            marginLeft: -20,
          }}
        >
          Available Rides
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {rideType === "faculty" && (
        <View
          style={{
            margin: 16,
            marginBottom: 0,
            padding: 10,
            backgroundColor: "#1a3a6b",
            borderRadius: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 15 }}>🏛️</Text>
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>
            Faculty rides only
          </Text>
        </View>
      )}

      <View
        style={{
          backgroundColor: colors.card,
          margin: 16,
          borderRadius: 12,
          padding: 14,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: "500" }}>
          Trip Summary
        </Text>
        <Text style={{ color: colors.text, fontSize: 14, marginTop: 6 }}>
          Pickup: {pickup ? decodeURIComponent(pickup as string) : "Any"}
          {"\n"}
          Destination:{" "}
          {destination ? decodeURIComponent(destination as string) : "Any"}
        </Text>
      </View>

      <Animated.View
        style={{ flex: 1, opacity: fadeAnim, paddingHorizontal: 16 }}
      >
        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 30 }}
          />
        ) : rides.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 40 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🚫</Text>
            <Text
              style={{
                fontSize: 17,
                fontWeight: "700",
                color: colors.text,
                marginBottom: 6,
              }}
            >
              No rides found
            </Text>
            <Text
              style={{
                color: colors.textMuted,
                textAlign: "center",
                lineHeight: 22,
                marginBottom: 28,
                paddingHorizontal: 16,
              }}
            >
              No {rideType === "faculty" ? "faculty " : ""}rides match your
              route right now.
              {"\n"}Post a request and drivers will be notified.
            </Text>
            <TouchableOpacity
              onPress={handleRequestRide}
              disabled={requestingRide}
              style={{
                backgroundColor: "#1a3a6b",
                borderRadius: 14,
                paddingVertical: 15,
                paddingHorizontal: 32,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              {requestingRide ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={{ fontSize: 18 }}>🙋</Text>
                  <Text
                    style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}
                  >
                    Request a Ride
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginTop: 18 }}
            >
              <Text style={{ color: colors.primary, fontSize: 14 }}>
                ← Change route
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {femaleOnlyRides.length > 0 && (
              <>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 16,
                    fontWeight: "600",
                    marginBottom: 10,
                  }}
                >
                  👩 Female-only rides
                </Text>
                <FlatList
                  data={femaleOnlyRides}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderItem}
                  scrollEnabled={false}
                />
              </>
            )}
            <FlatList
              data={otherRides}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
            />
          </>
        )}
      </Animated.View>

      <Modal
        visible={!!selectedRide}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedRide(null)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }}
          activeOpacity={1}
          onPress={() => setSelectedRide(null)}
        >
          <View style={{ flex: 1, justifyContent: "flex-end" }}>
            <TouchableOpacity activeOpacity={1}>
              <View
                style={{
                  backgroundColor: colors.card,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  padding: 16,
                  paddingBottom: 36,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: colors.border,
                    alignSelf: "center",
                    marginBottom: 16,
                  }}
                />

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 16,
                    paddingBottom: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <DriverAvatar
                    profilePic={selectedRide?.profile_pic}
                    firstName={selectedRide?.firstName}
                    lastName={selectedRide?.lastName}
                    size={56}
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: colors.text,
                      }}
                    >
                      {selectedRide?.firstName} {selectedRide?.lastName}
                    </Text>
                    <View style={{ marginTop: 4, marginBottom: 2 }}>
                      {selectedRide?.avg_rating ? (
                        <StarDisplay
                          rating={selectedRide.avg_rating}
                          total={selectedRide.total_ratings}
                          size={14}
                        />
                      ) : (
                        <Text style={{ fontSize: 12, color: colors.textMuted }}>
                          No ratings yet
                        </Text>
                      )}
                    </View>
                    {selectedRide?.phone && (
                      <Text
                        style={{
                          fontSize: 13,
                          color: colors.textMuted,
                          marginTop: 2,
                        }}
                      >
                        +91 {selectedRide.phone}
                      </Text>
                    )}
                    <Text
                      style={{
                        fontSize: 13,
                        color: colors.textMuted,
                        marginTop: 2,
                      }}
                    >
                      {selectedRide?.ride_number}
                    </Text>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    {priceToCredits(selectedRide?.price) !== null ? (
                      <>
                        <Text
                          style={{
                            fontSize: 20,
                            fontWeight: "700",
                            color: "#f59e0b",
                          }}
                        >
                          🪙 {priceToCredits(selectedRide?.price)}
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.textMuted }}>
                          credits
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.textMuted }}>
                          ₹{parseFloat(selectedRide?.price).toFixed(0)}
                        </Text>
                      </>
                    ) : (
                      <Text
                        style={{
                          fontSize: 22,
                          fontWeight: "700",
                          color: colors.primary,
                        }}
                      >
                        Free
                      </Text>
                    )}
                  </View>
                </View>

                <View style={{ marginBottom: 14 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textMuted,
                      marginBottom: 2,
                    }}
                  >
                    Pickup
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.text,
                      marginBottom: 10,
                    }}
                  >
                    {selectedRide?.pickup_desc}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textMuted,
                      marginBottom: 2,
                    }}
                  >
                    Destination
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.text }}>
                    {selectedRide?.destination_desc}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  {selectedRide && <SeatIcons ride={selectedRide} />}
                  {selectedRide?.ride_datetime && (
                    <Chip>{formatDateTime(selectedRide.ride_datetime)}</Chip>
                  )}
                </View>

                {selectedRide && (
                  <ScheduleBadge ride={selectedRide} colors={colors} />
                )}

                {selectedRide?.notes &&
                  selectedRide.notes !== "Nothing Specified" && (
                    <View
                      style={{
                        backgroundColor: colors.background,
                        borderRadius: 10,
                        padding: 12,
                        marginBottom: 16,
                        marginTop: 10,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          color: colors.textMuted,
                          marginBottom: 4,
                        }}
                      >
                        Driver notes
                      </Text>
                      <Text style={{ fontSize: 13, color: colors.text }}>
                        {selectedRide.notes}
                      </Text>
                    </View>
                  )}

                <TouchableOpacity
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: "center",
                    marginTop: 8,
                  }}
                  onPress={() => bookRide(selectedRide)}
                >
                  <Text
                    style={{
                      color: colors.background,
                      fontSize: 15,
                      fontWeight: "600",
                    }}
                  >
                    Book this ride{" "}
                    {priceToCredits(selectedRide?.price) !== null
                      ? `· 🪙 ${priceToCredits(selectedRide?.price)} credits`
                      : ""}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
