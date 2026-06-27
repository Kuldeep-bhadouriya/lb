import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import {
  AlertCircle,
  Bell,
  ChevronDown,
  ChevronUp,
  Hash,
  MapPin,
  MessageCircle,
  Navigation2,
  Phone,
  Send,
  Shield,
  Users,
  X,
  Zap,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  AppState,
  AppStateStatus,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardEvent,
  Linking,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { LatLng, Marker, Polyline } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import io from "socket.io-client";
import { apiFetch } from "../../lib/apiFetch";
import { API_URL } from "../../lib/config";
import { useTheme } from "../../theme/ThemeContext";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");
const SHEET_PEEK = 140;
const SHEET_MID = 380;
const SHEET_TALL = Math.round(SCREEN_H * 0.82);
const ROUTE_REFRESH_MS = 5000;

type Msg = {
  senderId: string | number;
  message: string;
  ts: string;
  clientId?: string;
};
type SheetSnap = "peek" | "mid" | "tall";
type RideInfo = {
  pickup?: string;
  destination?: string;
  rideDate?: string;
  seats?: number;
  price?: string;
  otherName?: string;
  otherPhone?: string;
  otherProfilePic?: string | null;
  vehicleNumber?: string;
  pickupCoords?: LatLng;
  destCoords?: LatLng;
};

const LOCATION_INTERVAL_MS = 3000;
const LOCATION_ACCURACY = Location.Accuracy.BestForNavigation;
const LOCATION_DISTANCE_FILTER = 5;
const getChatKey = (sid: string) => `chat_${sid}`;
const snapH = (s: SheetSnap) =>
  s === "peek" ? SHEET_PEEK : s === "mid" ? SHEET_MID : SHEET_TALL;

const ITM_COORDS = { latitude: 26.2183, longitude: 78.1828 };

function fmtRideTime(raw?: string | null): string {
  if (!raw) return "";
  try {
    const localStr = raw
      .trim()
      .replace(" ", "T")
      .replace(/Z$/i, "")
      .replace(/[+-]\d{2}:\d{2}$/, "");
    const d = new Date(localStr);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return raw;
  }
}

function fmtTime(isoTs: string): string {
  try {
    const d = new Date(isoTs);
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return isoTs?.slice(11, 16) ?? "";
  }
}

function DriverMarkerView({ name }: { name?: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text
        style={{
          fontSize: 34,
          lineHeight: 38,
          textShadowColor: "rgba(0,0,0,0.28)",
          textShadowOffset: { width: 0, height: 3 },
          textShadowRadius: 6,
        }}
      >
        🚗
      </Text>
      {!!name && (
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 6,
            paddingHorizontal: 7,
            paddingVertical: 2,
            marginTop: 2,
            shadowColor: "#000",
            shadowOpacity: 0.18,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 4,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "800",
              color: "#1a1a2e",
              letterSpacing: 0.3,
            }}
          >
            {name.split(" ")[0]}
          </Text>
        </View>
      )}
    </View>
  );
}

function PassengerMarkerView({ name }: { name?: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text
        style={{
          fontSize: 34,
          lineHeight: 38,
          textShadowColor: "rgba(124,58,237,0.38)",
          textShadowOffset: { width: 0, height: 3 },
          textShadowRadius: 6,
        }}
      >
        🧍
      </Text>
      {!!name && (
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 6,
            paddingHorizontal: 7,
            paddingVertical: 2,
            marginTop: 2,
            shadowColor: "#7c3aed",
            shadowOpacity: 0.22,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 4,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "800",
              color: "#7c3aed",
              letterSpacing: 0.3,
            }}
          >
            {name.split(" ")[0]}
          </Text>
        </View>
      )}
    </View>
  );
}

function PickupMarkerView() {
  return (
    <View style={{ alignItems: "center" }}>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: "#2563eb",
          borderWidth: 3,
          borderColor: "#fff",
          shadowColor: "#2563eb",
          shadowOpacity: 0.5,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 8,
        }}
      />
      <View
        style={{
          width: 3,
          height: 18,
          backgroundColor: "#2563eb",
          borderRadius: 2,
          marginTop: -1,
        }}
      />
      <View
        style={{
          width: 10,
          height: 5,
          borderRadius: 5,
          backgroundColor: "rgba(37,99,235,0.25)",
        }}
      />
    </View>
  );
}

function DestinationMarkerView() {
  return (
    <View style={{ alignItems: "center" }}>
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: "#dc2626",
          borderWidth: 3,
          borderColor: "#fff",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#dc2626",
          shadowOpacity: 0.5,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 8,
        }}
      >
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: "#fff",
          }}
        />
      </View>
      <View
        style={{
          width: 3,
          height: 16,
          backgroundColor: "#dc2626",
          borderRadius: 2,
          marginTop: -1,
        }}
      />
      <View
        style={{
          width: 10,
          height: 5,
          borderRadius: 5,
          backgroundColor: "rgba(220,38,38,0.25)",
        }}
      />
    </View>
  );
}

function StarRow({
  rating,
  onRate,
}: {
  rating: number;
  onRate: (r: number) => void;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 12, justifyContent: "center" }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <TouchableOpacity
          key={s}
          onPress={() => onRate(s)}
          hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
        >
          <Text style={{ fontSize: 38 }}>{s <= rating ? "★" : "☆"}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function RatingModal({
  visible,
  sessionId,
  driverName,
  onDone,
}: {
  visible: boolean;
  sessionId: string;
  driverName: string;
  onDone: () => void;
}) {
  const { colors } = useTheme();
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent!"];

  useEffect(() => {
    if (visible) {
      setRating(0);
      setSubmitting(false);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 70,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const submit = async () => {
    if (rating === 0) {
      onDone();
      return;
    }
    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem("token");
      await apiFetch(`${API_URL}/rate-driver`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId, rating }),
      });
    } catch {}
    onDone();
  };

  if (!visible) return null;
  return (
    <Modal visible transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.65)",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        <Animated.View
          style={{
            width: "100%",
            backgroundColor: colors.card,
            borderRadius: 32,
            padding: 32,
            alignItems: "center",
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
            elevation: 16,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "#dcfce7",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 42 }}>✅</Text>
          </View>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "800",
              color: colors.text,
              marginBottom: 6,
            }}
          >
            Ride Complete!
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.textMuted,
              textAlign: "center",
              marginBottom: 28,
              lineHeight: 22,
            }}
          >
            How was your ride with{"\n"}
            <Text style={{ color: colors.text, fontWeight: "700" }}>
              {driverName}
            </Text>
            ?
          </Text>
          <StarRow rating={rating} onRate={setRating} />
          {rating > 0 && (
            <Text
              style={{
                marginTop: 10,
                fontSize: 15,
                fontWeight: "700",
                color: "#f59e0b",
              }}
            >
              {LABELS[rating]}{" "}
              {rating === 5
                ? "🌟"
                : rating >= 4
                  ? "😊"
                  : rating >= 3
                    ? "👍"
                    : "🙂"}
            </Text>
          )}
          <TouchableOpacity
            onPress={submit}
            disabled={submitting}
            style={{
              marginTop: 28,
              width: "100%",
              backgroundColor: rating > 0 ? colors.primary : colors.surface,
              borderRadius: 18,
              paddingVertical: 16,
              alignItems: "center",
              borderWidth: rating > 0 ? 0 : 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: rating > 0 ? "#fff" : colors.textMuted,
              }}
            >
              {submitting ? "Saving…" : rating > 0 ? "Submit Rating" : "Skip"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

function OtpEntryModal({
  visible,
  sessionId,
  mode,
  myOtp,
  onVerified,
  onClose,
}: {
  visible: boolean;
  sessionId: string;
  mode: string;
  myOtp?: string;
  onVerified: () => void;
  onClose: () => void;
}) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (visible) {
      setOtp("");
      setError("");
      setLoading(false);
    }
  }, [visible]);

  const verify = async () => {
    if (otp.trim().length < 4) {
      setError("Please enter the OTP");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = await AsyncStorage.getItem("token");
      const res: any = await apiFetch(`${API_URL}/complete-ride/verify-otp`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId, otp: otp.trim(), role: mode }),
      });
      if (res?.success) onVerified();
      else setError(res?.message ?? "Invalid OTP. Try again.");
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  if (!visible) return null;
  const isDriver = mode === "driver";

  return (
    <Modal visible transparent animationType="slide">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.65)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: "#fff",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 28,
            paddingBottom: 40,
          }}
        >
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: "#e2e8f0",
              alignSelf: "center",
              marginBottom: 20,
            }}
          />
          <View
            style={{
              width: 68,
              height: 68,
              borderRadius: 34,
              backgroundColor: "#eff6ff",
              alignItems: "center",
              justifyContent: "center",
              alignSelf: "center",
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 34 }}>🔐</Text>
          </View>
          {isDriver ? (
            <>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "800",
                  color: "#1a1a2e",
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                Enter Passenger OTP
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: "#64748b",
                  textAlign: "center",
                  marginBottom: 24,
                  lineHeight: 20,
                }}
              >
                Ask your passenger for their OTP{"\n"}and enter it below to
                complete the ride.
              </Text>
              <View
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: error ? "#ef4444" : "#e2e8f0",
                  marginBottom: 8,
                  overflow: "hidden",
                }}
              >
                <TextInput
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="_ _ _ _"
                  placeholderTextColor="#cbd5e1"
                  keyboardType="number-pad"
                  maxLength={8}
                  style={{
                    fontSize: 28,
                    fontWeight: "700",
                    textAlign: "center",
                    letterSpacing: 10,
                    color: "#1a1a2e",
                    paddingVertical: 16,
                  }}
                />
              </View>
              {error !== "" && (
                <Text
                  style={{
                    color: "#ef4444",
                    fontSize: 13,
                    textAlign: "center",
                    marginBottom: 12,
                  }}
                >
                  {error}
                </Text>
              )}
              <TouchableOpacity
                onPress={verify}
                disabled={loading}
                style={{
                  backgroundColor: "#1a1a2e",
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: "center",
                  marginTop: 8,
                }}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}
                >
                  {loading ? "Verifying…" : "Verify & Complete Ride"}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "800",
                  color: "#1a1a2e",
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                Your OTP
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: "#64748b",
                  textAlign: "center",
                  marginBottom: 24,
                  lineHeight: 20,
                }}
              >
                Read this OTP to your driver{"\n"}so they can complete the ride.
              </Text>
              <View
                style={{
                  backgroundColor: "#1a1a2e",
                  borderRadius: 16,
                  paddingVertical: 22,
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <Text
                  style={{
                    fontSize: 38,
                    fontWeight: "900",
                    color: "#f59e0b",
                    letterSpacing: 14,
                  }}
                >
                  {myOtp ?? "----"}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 12,
                  color: "#94a3b8",
                  textAlign: "center",
                  marginBottom: 16,
                }}
              >
                The ride will complete automatically once your driver enters it.
              </Text>
            </>
          )}
          <TouchableOpacity
            onPress={onClose}
            style={{ paddingVertical: 12, alignItems: "center" }}
          >
            <Text style={{ color: "#94a3b8", fontSize: 14 }}>
              {isDriver ? "Cancel" : "Dismiss"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function PulseDot({ color = "#22c55e" }: { color?: string }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1.6,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);
  return (
    <View
      style={{
        width: 12,
        height: 12,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View
        style={{
          position: "absolute",
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: color,
          opacity: 0.4,
          transform: [{ scale: anim }],
        }}
      />
      <View
        style={{
          width: 7,
          height: 7,
          borderRadius: 3.5,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

function RideInfoCard({
  rideInfo,
  mode,
  otherSignalColor,
  otherSignalLabel,
  otherLocation,
  chatOpen,
  onToggleChat,
  unreadCount,
}: {
  rideInfo: RideInfo;
  mode: string | null;
  otherSignalColor: string;
  otherSignalLabel: string | null;
  otherLocation: LatLng | null;
  chatOpen: boolean;
  onToggleChat: () => void;
  unreadCount: number;
}) {
  const [imgErr, setImgErr] = useState(false);
  if (!rideInfo.otherName && !rideInfo.pickup) return null;
  const initials = (
    rideInfo.otherName?.[0] ?? (mode === "driver" ? "P" : "D")
  ).toUpperCase();
  const showImg = !!rideInfo.otherProfilePic && !imgErr;

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: "#f8fafc",
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: "#e2e8f0",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {showImg ? (
            <Image
              source={{ uri: rideInfo.otherProfilePic! }}
              style={{ width: 44, height: 44, borderRadius: 22 }}
              onError={() => setImgErr(true)}
            />
          ) : (
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "#1a1a2e",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 17 }}>
                {initials}
              </Text>
            </View>
          )}
          <View>
            <Text style={{ fontSize: 15, fontWeight: "800", color: "#1a1a2e" }}>
              {rideInfo.otherName ??
                (mode === "driver" ? "Passenger" : "Driver")}
            </Text>
            {rideInfo.otherPhone && (
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${rideInfo.otherPhone}`)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  marginTop: 2,
                }}
              >
                <Phone size={10} color="#3b82f6" />
                <Text
                  style={{ fontSize: 11, color: "#3b82f6", fontWeight: "600" }}
                >
                  {rideInfo.otherPhone}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              backgroundColor: "#fff",
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderWidth: 1,
              borderColor: "#e2e8f0",
            }}
          >
            <PulseDot color={otherSignalColor} />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: otherSignalColor,
              }}
            >
              {otherSignalLabel ?? (otherLocation ? "Located" : "Waiting…")}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onToggleChat}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              backgroundColor: chatOpen ? "#1a1a2e" : "#eff6ff",
              borderRadius: 20,
              paddingHorizontal: 11,
              paddingVertical: 7,
              borderWidth: 1,
              borderColor: chatOpen ? "#1a1a2e" : "#bfdbfe",
            }}
          >
            <MessageCircle size={12} color={chatOpen ? "#fff" : "#3b82f6"} />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: chatOpen ? "#fff" : "#3b82f6",
              }}
            >
              Chat
            </Text>
            {unreadCount > 0 && !chatOpen && (
              <View
                style={{
                  backgroundColor: "#ef4444",
                  borderRadius: 8,
                  paddingHorizontal: 5,
                  paddingVertical: 1,
                }}
              >
                <Text style={{ color: "#fff", fontSize: 9, fontWeight: "700" }}>
                  {unreadCount}
                </Text>
              </View>
            )}
            {chatOpen ? (
              <ChevronDown size={11} color="#fff" />
            ) : (
              <ChevronUp size={11} color="#3b82f6" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {(rideInfo.pickup || rideInfo.destination) && (
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: "#e2e8f0",
            marginBottom: 10,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "700",
              color: "#94a3b8",
              letterSpacing: 0.8,
              marginBottom: 10,
              textTransform: "uppercase",
            }}
          >
            {mode === "driver" ? "Passenger's Route" : "Driver's Route"}
          </Text>

          {rideInfo.pickup && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 8,
                marginBottom: rideInfo.destination ? 8 : 0,
              }}
            >
              <View style={{ width: 20, alignItems: "center", paddingTop: 3 }}>
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: "#2563eb",
                    borderWidth: 2,
                    borderColor: "#1d4ed8",
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 10,
                    color: "#94a3b8",
                    fontWeight: "600",
                    marginBottom: 1,
                  }}
                >
                  {mode === "driver" ? "Pickup" : "From"}
                </Text>
                <Text
                  style={{ fontSize: 13, color: "#374151", lineHeight: 18 }}
                  numberOfLines={2}
                >
                  {rideInfo.pickup}
                </Text>
              </View>
            </View>
          )}

          {rideInfo.pickup && rideInfo.destination && (
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 2 }}>
              <View style={{ width: 20, alignItems: "center" }}>
                <View
                  style={{
                    width: 1.5,
                    height: 14,
                    backgroundColor: "#cbd5e1",
                  }}
                />
              </View>
            </View>
          )}

          {rideInfo.destination && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <View style={{ width: 20, alignItems: "center", paddingTop: 3 }}>
                <MapPin size={10} color="#dc2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 10,
                    color: "#94a3b8",
                    fontWeight: "600",
                    marginBottom: 1,
                  }}
                >
                  {mode === "driver" ? "Drop-off" : "To"}
                </Text>
                <Text
                  style={{ fontSize: 13, color: "#374151", lineHeight: 18 }}
                  numberOfLines={2}
                >
                  {rideInfo.destination}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
        {rideInfo.seats != null && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: "#fff",
              borderRadius: 10,
              paddingHorizontal: 9,
              paddingVertical: 5,
              borderWidth: 1,
              borderColor: "#e2e8f0",
            }}
          >
            <Users size={10} color="#64748b" />
            <Text style={{ fontSize: 11, color: "#64748b" }}>
              {rideInfo.seats} seat{rideInfo.seats !== 1 ? "s" : ""}
            </Text>
          </View>
        )}
        {rideInfo.price && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: "#ecfdf5",
              borderRadius: 10,
              paddingHorizontal: 9,
              paddingVertical: 5,
              borderWidth: 1,
              borderColor: "#bbf7d0",
            }}
          >
            <Text style={{ fontSize: 11, color: "#16a34a", fontWeight: "700" }}>
              ₹{rideInfo.price}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function RideTracking() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const mapRef = useRef<MapView | null>(null);
  const socketRef = useRef<any>(null);
  const locSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const listRef = useRef<FlatList<Msg> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const modeRef = useRef<string | null>(null);
  const myLocationRef = useRef<LatLng | null>(null);
  const myLocationLatestRef = useRef<LatLng | null>(null);
  const rideEndedRef = useRef(false);
  const otherAgeTimerRef = useRef<any>(null);
  const otpInitiatorRef = useRef(false);
  const otpFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const greenRouteTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const blueRouteTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const driverLocationLatestRef = useRef<LatLng | null>(null);
  const passengerLocationLatestRef = useRef<LatLng | null>(null);
  const destCoordsRef = useRef<LatLng | undefined>(undefined);
  const pickupCoordsRef = useRef<LatLng | undefined>(undefined);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [mode, setMode] = useState<string | null>(null);
  const [myLocation, setMyLocation] = useState<LatLng | null>(null);
  const [otherLocation, setOtherLocation] = useState<LatLng | null>(null);
  const [passengerLiveLocation, setPassengerLiveLocation] =
    useState<LatLng | null>(null);
  const [driverLiveLocation, setDriverLiveLocation] = useState<LatLng | null>(
    null,
  );
  const [messages, setMessages] = useState<Msg[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [locationStatus, setLocationStatus] = useState<
    "acquiring" | "active" | "error"
  >("acquiring");
  const [otherLocationAge, setOtherLocationAge] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number | null>(null);
  const [greenRoute, setGreenRoute] = useState<LatLng[]>([]);
  const [blueRoute, setBlueRoute] = useState<LatLng[]>([]);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [myOtpCode, setMyOtpCode] = useState<string | undefined>(undefined);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState("");
  const [driverName, setDriverName] = useState("Driver");
  const [chatOpen, setChatOpen] = useState(false);
  const [etaMinutes] = useState<number | null>(null);
  const [rideInfo, setRideInfo] = useState<RideInfo>({});
  const [kbHeight, setKbHeight] = useState(0);
  const [askingConfirm, setAskingConfirm] = useState(false);

  const sheetHeightAnim = useRef(new Animated.Value(SHEET_MID)).current;
  const dragStartH = useRef(SHEET_MID);
  const snapRef = useRef<SheetSnap>("mid");

  const [track, setTrack] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setTrack(false), 500);
    return () => clearTimeout(t);
  }, []);

  const animSnap = useCallback((target: SheetSnap) => {
    Animated.spring(sheetHeightAnim, {
      toValue: snapH(target),
      tension: 65,
      friction: 14,
      useNativeDriver: false,
    }).start();
  }, []);

  const snapTo = useCallback(
    (target: SheetSnap) => {
      snapRef.current = target;
      if (target !== "tall") Keyboard.dismiss();
      animSnap(target);
    },
    [animSnap],
  );

  const toggleChat = useCallback(() => {
    if (chatOpen) {
      setChatOpen(false);
      snapTo("mid");
    } else {
      setChatOpen(true);
      setUnreadCount(0);
      snapTo("tall");
    }
  }, [chatOpen, snapTo]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
      onPanResponderGrant: () => {
        dragStartH.current = snapH(snapRef.current);
      },
      onPanResponderMove: (_, g) => {
        sheetHeightAnim.setValue(
          Math.max(SHEET_PEEK, Math.min(SHEET_TALL, dragStartH.current - g.dy)),
        );
      },
      onPanResponderRelease: (_, g) => {
        const h = Math.max(
          SHEET_PEEK,
          Math.min(SHEET_TALL, dragStartH.current - g.dy),
        );
        if (h > (SHEET_MID + SHEET_TALL) / 2) {
          setChatOpen(true);
          setUnreadCount(0);
          snapTo("tall");
        } else if (h > (SHEET_PEEK + SHEET_MID) / 2) {
          setChatOpen(false);
          snapTo("mid");
        } else {
          setChatOpen(false);
          snapTo("peek");
        }
      },
    }),
  ).current;

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e: KeyboardEvent) => setKbHeight(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKbHeight(0),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const navigateEnd = useCallback(async (sid: string) => {
    if (rideEndedRef.current) return;
    rideEndedRef.current = true;
    await AsyncStorage.removeItem("active_session").catch(() => {});
    await AsyncStorage.removeItem(getChatKey(sid)).catch(() => {});
    try {
      const raw = await AsyncStorage.getItem("started_sessions");
      if (raw) {
        const arr: number[] = JSON.parse(raw);
        await AsyncStorage.setItem(
          "started_sessions",
          JSON.stringify(arr.filter((s) => s !== parseInt(sid))),
        );
      }
    } catch {}
    router.replace("/home/passenger");
  }, []);

  const showRatingForPassenger = useCallback(async (sid: string) => {
    if (rideEndedRef.current) return;
    rideEndedRef.current = true;
    await AsyncStorage.removeItem("active_session").catch(() => {});
    await AsyncStorage.removeItem(getChatKey(sid)).catch(() => {});
    setCompletedSessionId(sid);
    setShowRatingModal(true);
  }, []);

  const fetchRoute = useCallback(
    async (origin: LatLng, dest: LatLng, color: "green" | "blue") => {
      if (!origin || !dest) return;
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${dest.longitude},${dest.latitude}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes?.length) {
          const coords: LatLng[] = data.routes[0].geometry.coordinates.map(
            (c: number[]) => ({ latitude: c[1], longitude: c[0] }),
          );
          if (color === "green") setGreenRoute(coords);
          else setBlueRoute(coords);
        }
      } catch {
        if (color === "green") setGreenRoute([origin, dest]);
        else setBlueRoute([origin, dest]);
      }
    },
    [],
  );

  const refreshGreenRoute = useCallback(() => {
    const p = passengerLocationLatestRef.current,
      d = driverLocationLatestRef.current;
    if (p && d) fetchRoute(p, d, "green");
  }, [fetchRoute]);

  const refreshBlueRoute = useCallback(() => {
    const d = driverLocationLatestRef.current,
      dest = destCoordsRef.current;
    if (d && dest) fetchRoute(d, dest, "blue");
  }, [fetchRoute]);

  const startRouteRefresh = useCallback(() => {
    if (greenRouteTimerRef.current) clearInterval(greenRouteTimerRef.current);
    if (blueRouteTimerRef.current) clearInterval(blueRouteTimerRef.current);
    greenRouteTimerRef.current = setInterval(
      refreshGreenRoute,
      ROUTE_REFRESH_MS,
    );
    blueRouteTimerRef.current = setInterval(refreshBlueRoute, ROUTE_REFRESH_MS);
  }, [refreshGreenRoute, refreshBlueRoute]);

  const updateOtherLocation = useCallback(
    (data: any) => {
      const coords: LatLng = {
        latitude: Number(data.lat),
        longitude: Number(data.lng),
      };
      setOtherLocation(coords);
      setOtherLocationAge(0);
      if (otherAgeTimerRef.current) clearInterval(otherAgeTimerRef.current);
      otherAgeTimerRef.current = setInterval(
        () => setOtherLocationAge((p) => (p !== null ? p + 1 : 1)),
        1000,
      );

      if (data.role === "passenger") {
        setPassengerLiveLocation(coords);
        passengerLocationLatestRef.current = coords;
      } else if (data.role === "driver") {
        setDriverLiveLocation(coords);
        driverLocationLatestRef.current = coords;
      }

      const pLoc = passengerLocationLatestRef.current,
        dLoc = driverLocationLatestRef.current,
        dest = destCoordsRef.current;
      if (pLoc && dLoc) fetchRoute(pLoc, dLoc, "green");
      if (dLoc && dest) fetchRoute(dLoc, dest, "blue");
    },
    [fetchRoute],
  );

  const resolveSession = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const res: any = await apiFetch(`${API_URL}/active-session`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res?.success && res?.session) {
        const sid = String(res.session.sessionId),
          mod = res.session.mode;
        sessionIdRef.current = sid;
        modeRef.current = mod;
        setSessionId(sid);
        setMode(mod);
        await AsyncStorage.setItem(
          "active_session",
          JSON.stringify({ sessionId: sid, mode: mod }),
        );
        const s = res.session;

        const vehicleNumber =
          s.vehicleNumber ??
          s.vehicle_number ??
          s.rideNumber ??
          s.ride_number ??
          null;

        const rideData: RideInfo = {
          pickup: mod === "driver" ? s.passengerPickup : s.driverPickup,

          destination:
            mod === "driver" ? s.passengerDestination : s.driverDestination,

          rideDate: s.ride_datetime ? fmtRideTime(s.ride_datetime) : undefined,
          seats: s.seats,
          price: s.price ? String(parseFloat(s.price)) : undefined,

          otherName:
            mod === "driver"
              ? [s.passengerFirst, s.passengerLast].join(" ")
              : [s.driverFirst, s.driverLast].join(" "),

          otherPhone: mod === "driver" ? s.passengerPhone : s.driverPhone,

          otherProfilePic:
            mod === "driver" ? s.passengerProfilePic : s.driverProfilePic,

          vehicleNumber: s.vehicleNumber,
        };
        setRideInfo(rideData);
        if (mod !== "driver")
          setDriverName(
            [s.driverFirst, s.driverLast].filter(Boolean).join(" ") || "Driver",
          );
        return;
      }
      const raw = await AsyncStorage.getItem("active_session");
      if (raw) {
        const p = JSON.parse(raw);
        sessionIdRef.current = p.sessionId;
        modeRef.current = p.mode;
        setSessionId(p.sessionId);
        setMode(p.mode);
      }
    } catch {}
  };

  const fetchDriverDetails = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const res: any = await apiFetch(`${API_URL}/my-ride-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const accepted = (res?.requests ?? []).find(
        (r: any) =>
          r.status === "accepted" &&
          String(r.session_id) === sessionIdRef.current,
      );
      if (accepted) {
        const name = [accepted.driverFirst, accepted.driverLast]
          .filter(Boolean)
          .join(" ");
        if (name) {
          setDriverName(name);
          setRideInfo((prev) => ({
            ...prev,
            otherName: name,
            otherPhone: accepted.driverPhone,
            otherProfilePic:
              prev.otherProfilePic ?? accepted.driverProfilePic ?? null,
            vehicleNumber:
              prev.vehicleNumber ??
              accepted.rideNumber ??
              accepted.ride_number ??
              accepted.vehicleNumber ??
              accepted.vehicle_number,
          }));
        }
      }
    } catch {}
  }, []);

  const fetchVehicleNumberFallback = useCallback(async () => {
    if (!sessionId) return;
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const res: any = await apiFetch(`${API_URL}/my-ride-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const match = (res?.requests ?? []).find(
        (r: any) => String(r.session_id) === sessionIdRef.current,
      );
      if (match) {
        const vn =
          match.rideNumber ??
          match.ride_number ??
          match.vehicleNumber ??
          match.vehicle_number;
        if (vn)
          setRideInfo((prev) => ({
            ...prev,
            vehicleNumber: prev.vehicleNumber ?? vn,
          }));
      }
    } catch {}
  }, [sessionId]);

  const checkSessionStatus = useCallback(async () => {
    const sid = sessionIdRef.current;
    if (!sid || rideEndedRef.current) return;
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const res: any = await apiFetch(
        `${API_URL}/ride-session-status?sessionId=${sid}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res?.success) return;
      if (res.status === "cancelled")
        Alert.alert("Ride Cancelled", "This ride was cancelled.", [
          { text: "OK", onPress: () => navigateEnd(sid) },
        ]);
      else if (res.status === "completed") {
        if (modeRef.current === "passenger") showRatingForPassenger(sid);
        else
          Alert.alert("Ride Completed ✅", "This ride has been completed.", [
            { text: "OK", onPress: () => navigateEnd(sid) },
          ]);
      }
    } catch {}
  }, [navigateEnd, showRatingForPassenger]);

  const connectSocket = useCallback(
    (sid: string, mod: string) => {
      if (socketRef.current?.connected) return;
      if (socketRef.current) {
        try {
          socketRef.current.disconnect();
        } catch {}
        socketRef.current = null;
      }
      const socket = io(API_URL, { transports: ["websocket"], forceNew: true });
      socketRef.current = socket;

      socket.on("connect", async () => {
        const rawUser = await AsyncStorage.getItem("user");
        const user = rawUser ? JSON.parse(rawUser) : null;
        if (user?.Id)
          socket.emit(
            mod === "driver" ? "register_driver" : "register_passenger",
            mod === "driver" ? { driverId: user.Id } : { passengerId: user.Id },
          );
        socket.emit("join_session", { sessionId: sid });
      });

      socket.on("location_update", (data: any) => {
        if (String(data.sessionId ?? data.session_id) === String(sid))
          updateOtherLocation(data);
      });

      socket.on("chat_message", (msg: Msg) => {
        setMessages((prev) => {
          if (
            prev.some(
              (m) =>
                (msg.clientId && m.clientId === msg.clientId) ||
                m.ts === msg.ts,
            )
          )
            return prev;
          return [...prev, msg];
        });
        if (!chatOpen) setUnreadCount((c) => c + 1);
      });

      socket.on("chat_history", (history: Msg[]) => {
        if (Array.isArray(history) && history.length > 0) setMessages(history);
      });

      socket.on("ride_cancelled", () =>
        Alert.alert("Ride Cancelled", "The ride was cancelled.", [
          { text: "OK", onPress: () => navigateEnd(sid) },
        ]),
      );

      socket.on("passenger_requesting_complete", () => {
        if (modeRef.current === "driver") {
          Alert.alert(
            "Passenger Requesting Completion 🔔",
            "The passenger is requesting you to complete and confirm the ride.",
            [
              { text: "Later", style: "cancel" },
              {
                text: "Complete Ride",
                onPress: () => {
                  otpInitiatorRef.current = true;
                  initiateComplete();
                },
              },
            ],
          );
        }
      });

      socket.on("ride_completed", () => {
        if (otpFallbackTimerRef.current) {
          clearTimeout(otpFallbackTimerRef.current);
          otpFallbackTimerRef.current = null;
        }
        setShowOtpModal(false);
        otpInitiatorRef.current = false;
        if (modeRef.current === "passenger") showRatingForPassenger(sid);
        else
          Alert.alert("Ride Completed ✅", "Ride finished successfully.", [
            { text: "OK", onPress: () => navigateEnd(sid) },
          ]);
      });

      socket.on("ride_completion_otp", (data: any) => {
        if (String(data.sessionId ?? data.session_id) !== String(sid)) return;
        if (otpFallbackTimerRef.current) {
          clearTimeout(otpFallbackTimerRef.current);
          otpFallbackTimerRef.current = null;
        }
        if (modeRef.current === "driver") {
          setShowOtpModal(true);
        } else {
          setMyOtpCode(data.passengerOtp);
          setShowOtpModal(true);
        }
      });
    },
    [navigateEnd, showRatingForPassenger, updateOtherLocation, chatOpen],
  );

  useEffect(() => {
    resolveSession();
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    if (mode === "passenger") fetchDriverDetails();
    setTimeout(fetchVehicleNumberFallback, 2000);
  }, [sessionId, mode]);

  useEffect(() => {
    if (rideInfo.destCoords) destCoordsRef.current = rideInfo.destCoords;
    if (rideInfo.pickupCoords) pickupCoordsRef.current = rideInfo.pickupCoords;
  }, [rideInfo.destCoords, rideInfo.pickupCoords]);

  useEffect(() => {
    if (!sessionId || !mode) return;
    connectSocket(sessionId, mode);
    checkSessionStatus();
    const poll = setInterval(checkSessionStatus, 5000);
    startRouteRefresh();
    const handleAppState = async (next: AppStateStatus) => {
      if (next === "active") {
        await resolveSession();
        if (sessionIdRef.current && modeRef.current)
          connectSocket(sessionIdRef.current, modeRef.current);
        checkSessionStatus();
      }
    };
    const sub = AppState.addEventListener("change", handleAppState);
    return () => {
      clearInterval(poll);
      sub.remove();
      if (otherAgeTimerRef.current) clearInterval(otherAgeTimerRef.current);
      if (otpFallbackTimerRef.current)
        clearTimeout(otpFallbackTimerRef.current);
      if (greenRouteTimerRef.current) clearInterval(greenRouteTimerRef.current);
      if (blueRouteTimerRef.current) clearInterval(blueRouteTimerRef.current);
      try {
        socketRef.current?.emit("leave_session", { sessionId });
      } catch {}
      try {
        socketRef.current?.disconnect();
      } catch {}
      socketRef.current = null;
    };
  }, [sessionId, mode]);

  useEffect(() => {
    if (!sessionId || !mode) return;
    let mounted = true;
    const start = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationStatus("error");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: LOCATION_ACCURACY,
      });
      if (!mounted) return;
      const coords: LatLng = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      myLocationRef.current = coords;
      myLocationLatestRef.current = coords;
      setMyLocation(coords);
      setSpeed(pos.coords.speed ?? null);
      setLocationStatus("active");
      if (modeRef.current === "driver") {
        driverLocationLatestRef.current = coords;
        setDriverLiveLocation(coords);
      } else {
        passengerLocationLatestRef.current = coords;
        setPassengerLiveLocation(coords);
      }
      socketRef.current?.emit(
        modeRef.current === "driver" ? "driver_location" : "passenger_location",
        {
          sessionId: sessionIdRef.current,
          lat: coords.latitude,
          lng: coords.longitude,
        },
      );

      locSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: LOCATION_ACCURACY,
          timeInterval: LOCATION_INTERVAL_MS,
          distanceInterval: LOCATION_DISTANCE_FILTER,
        },
        (loc) => {
          if (!mounted) return;
          const c: LatLng = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          myLocationRef.current = c;
          myLocationLatestRef.current = c;
          setMyLocation(c);
          setSpeed(loc.coords.speed ?? null);
          setLocationStatus("active");
          if (modeRef.current === "driver") {
            driverLocationLatestRef.current = c;
            setDriverLiveLocation(c);
          } else {
            passengerLocationLatestRef.current = c;
            setPassengerLiveLocation(c);
          }
          socketRef.current?.emit(
            modeRef.current === "driver"
              ? "driver_location"
              : "passenger_location",
            {
              sessionId: sessionIdRef.current,
              lat: c.latitude,
              lng: c.longitude,
            },
          );
          const pLoc = passengerLocationLatestRef.current,
            dLoc = driverLocationLatestRef.current,
            dest = destCoordsRef.current;
          if (pLoc && dLoc) fetchRoute(pLoc, dLoc, "green");
          if (dLoc && dest) fetchRoute(dLoc, dest, "blue");
        },
      );
    };
    start().catch(() => {
      if (mounted) setLocationStatus("error");
    });
    return () => {
      mounted = false;
      locSubscriptionRef.current?.remove();
      locSubscriptionRef.current = null;
    };
  }, [sessionId, mode]);

  useEffect(() => {
    const go = async () => {
      if (
        !rideInfo.pickup ||
        !rideInfo.destination ||
        (rideInfo.pickupCoords && rideInfo.destCoords)
      )
        return;
      try {
        const [pickupGeo, destGeo] = await Promise.all([
          Location.geocodeAsync(rideInfo.pickup).catch(() => null),
          Location.geocodeAsync(rideInfo.destination).catch(() => null),
        ]);
        const pickupCoords = pickupGeo?.[0]
          ? {
              latitude: pickupGeo[0].latitude,
              longitude: pickupGeo[0].longitude,
            }
          : (myLocationRef.current ?? ITM_COORDS);
        const destCoords = destGeo?.[0]
          ? { latitude: destGeo[0].latitude, longitude: destGeo[0].longitude }
          : null;
        if (pickupCoords && destCoords) {
          pickupCoordsRef.current = pickupCoords;
          destCoordsRef.current = destCoords;
          setRideInfo((prev) => ({ ...prev, pickupCoords, destCoords }));
          const dLoc = driverLocationLatestRef.current ?? pickupCoords;
          const pLoc =
            passengerLocationLatestRef.current ??
            myLocationRef.current ??
            pickupCoords;
          driverLocationLatestRef.current =
            driverLocationLatestRef.current ?? dLoc;
          await fetchRoute(pLoc, dLoc, "green");
          await fetchRoute(dLoc, destCoords, "blue");
          mapRef.current?.fitToCoordinates([pickupCoords, destCoords], {
            edgePadding: {
              top: 80,
              right: 50,
              bottom: SHEET_MID + 60,
              left: 50,
            },
            animated: true,
          });
        }
      } catch {}
    };
    go();
  }, [rideInfo.pickup, rideInfo.destination, myLocation]);

  const sendMessage = () => {
    const sid = sessionIdRef.current;
    if (!inputMsg.trim() || !sid) return;
    const now = new Date();
    const msg: Msg = {
      senderId: modeRef.current ?? "me",
      message: inputMsg.trim(),
      ts: now.toISOString(),
      clientId: now.getTime().toString(),
    };
    socketRef.current?.emit("chat_message", { ...msg, sessionId: sid });
    setMessages((prev) => [...prev, msg]);
    setInputMsg("");
  };

  const cancelRide = () => {
    const sid = sessionIdRef.current;
    if (!sid) return;
    Alert.alert("Cancel Ride", "Are you sure you want to cancel this ride?", [
      { text: "No", style: "cancel" },
      {
        text: "Cancel Ride",
        style: "destructive",
        onPress: () => {
          socketRef.current?.emit("cancel_ride", {
            sessionId: sid,
            by: modeRef.current,
          });
          navigateEnd(sid);
        },
      },
    ]);
  };

  const initiateComplete = async () => {
    const sid = sessionIdRef.current;
    if (!sid) return;
    try {
      otpInitiatorRef.current = true;
      const token = await AsyncStorage.getItem("token");
      const res: any = await apiFetch(`${API_URL}/complete-ride/send-otp`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId: sid }),
      });
      if (!res?.success) {
        otpInitiatorRef.current = false;
        Alert.alert("Error", res?.message ?? "Could not initiate completion.");
        return;
      }
      otpFallbackTimerRef.current = setTimeout(() => {
        if (otpInitiatorRef.current) setShowOtpModal(true);
      }, 4000);
    } catch {
      otpInitiatorRef.current = false;
      Alert.alert("Error", "Network error. Please try again.");
    }
  };

  const askDriverToComplete = async () => {
    const sid = sessionIdRef.current;
    if (!sid || askingConfirm) return;
    setAskingConfirm(true);
    try {
      const token = await AsyncStorage.getItem("token");
      socketRef.current?.emit("passenger_requesting_complete", {
        sessionId: sid,
      });
      await apiFetch(`${API_URL}/notify-complete-request`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId: sid }),
      });
      Alert.alert(
        "Request Sent ✅",
        "We've notified your driver to complete the ride.",
        [{ text: "OK" }],
      );
    } catch {
      Alert.alert("Request Sent ✅", "Your driver has been notified.", [
        { text: "OK" },
      ]);
    } finally {
      setTimeout(() => setAskingConfirm(false), 30000);
    }
  };

  const openDirections = () => {
    const dest = rideInfo.destCoords;
    if (!dest) {
      Alert.alert("Error", "Destination not available");
      return;
    }
    const origin = myLocation ?? ITM_COORDS;
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&origin=${origin.latitude},${origin.longitude}&destination=${dest.latitude},${dest.longitude}&travelmode=driving`,
    );
  };

  const isOwn = (m: Msg) => String(m.senderId) === String(modeRef.current);
  const otherSignalLabel =
    otherLocationAge === null
      ? null
      : otherLocationAge < 10
        ? "Live"
        : otherLocationAge < 30
          ? `${otherLocationAge}s ago`
          : "Signal lost";
  const otherSignalColor =
    otherLocationAge === null || otherLocationAge < 10
      ? "#22c55e"
      : otherLocationAge < 30
        ? "#f59e0b"
        : "#ef4444";
  const mapCenter = rideInfo.pickupCoords ?? myLocation ?? ITM_COORDS;
  const bottomOffset = chatOpen && kbHeight > 0 ? kbHeight - insets.bottom : 0;
  const driverMapCoords =
    mode === "driver" ? myLocation : (driverLiveLocation ?? otherLocation);
  const passengerMapCoords =
    mode === "passenger"
      ? myLocation
      : (passengerLiveLocation ?? otherLocation);

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
      <RatingModal
        visible={showRatingModal}
        sessionId={completedSessionId}
        driverName={driverName}
        onDone={() => {
          setShowRatingModal(false);
          router.replace("/home/passenger");
        }}
      />
      <OtpEntryModal
        visible={showOtpModal}
        sessionId={sessionId ?? ""}
        mode={mode ?? ""}
        myOtp={myOtpCode}
        onVerified={() => {
          setShowOtpModal(false);
          setMyOtpCode(undefined);
          otpInitiatorRef.current = false;
        }}
        onClose={() => {
          setShowOtpModal(false);
          setMyOtpCode(undefined);
          otpInitiatorRef.current = false;
        }}
      />

      <MapView
        ref={mapRef}
        style={{
          position: "absolute",
          inset: 0,
          width: SCREEN_W,
          height: SCREEN_H,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsTraffic={false}
        showsCompass={false}
        mapPadding={{ top: 0, right: 0, bottom: SHEET_MID, left: 0 }}
        initialRegion={{
          latitude: mapCenter.latitude,
          longitude: mapCenter.longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
      >
        {greenRoute.length > 1 && (
          <>
            <Polyline
              coordinates={greenRoute}
              strokeColor="#15803d"
              strokeWidth={6}
            />
            <Polyline
              coordinates={greenRoute}
              strokeColor="#22c55e"
              strokeWidth={3}
            />
          </>
        )}
        {blueRoute.length > 1 && (
          <>
            <Polyline
              coordinates={blueRoute}
              strokeColor="#1d4ed8"
              strokeWidth={6}
            />
            <Polyline
              coordinates={blueRoute}
              strokeColor="#3b82f6"
              strokeWidth={3}
            />
          </>
        )}

        {rideInfo.pickupCoords && (
          <Marker
            coordinate={rideInfo.pickupCoords}
            title="Pickup"
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            zIndex={2}
          >
            <PickupMarkerView />
          </Marker>
        )}

        {rideInfo.destCoords && (
          <Marker
            coordinate={rideInfo.destCoords}
            title="Destination"
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={true}
            zIndex={2}
          >
            <DestinationMarkerView />
          </Marker>
        )}

        {driverMapCoords && (
          <Marker
            coordinate={driverMapCoords}
            title={
              mode === "driver"
                ? "You (Driver)"
                : (rideInfo.otherName ?? "Driver")
            }
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={true}
            zIndex={2}
          >
            <DriverMarkerView
              name={mode === "driver" ? "You" : rideInfo.otherName}
            />
          </Marker>
        )}

        {passengerMapCoords && (
          <Marker
            coordinate={passengerMapCoords}
            title={
              mode === "passenger"
                ? "You (Passenger)"
                : (rideInfo.otherName ?? "Passenger")
            }
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={true}
            zIndex={2}
          >
            <PassengerMarkerView
              name={mode === "passenger" ? "You" : rideInfo.otherName}
            />
          </Marker>
        )}
      </MapView>

      <View
        style={{
          position: "absolute",
          top: insets.top + 16,
          left: 16,
          right: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 10,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: "rgba(255,255,255,0.96)",
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 9,
            elevation: 6,
          }}
        >
          <PulseDot
            color={
              locationStatus === "active"
                ? "#22c55e"
                : locationStatus === "error"
                  ? "#ef4444"
                  : "#f59e0b"
            }
          />
          <View>
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#1a1a2e" }}>
              {locationStatus === "active"
                ? `Session #${sessionId}`
                : locationStatus === "error"
                  ? "Location error"
                  : "Acquiring GPS…"}
            </Text>
            {speed !== null && speed > 0.5 && (
              <Text style={{ fontSize: 11, color: "#666", marginTop: 1 }}>
                {(speed * 3.6).toFixed(0)} km/h
              </Text>
            )}
          </View>
        </View>
        {!!rideInfo.vehicleNumber && (
          <View
            style={{
              backgroundColor: "#1a1a2e",
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 8,
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              borderWidth: 1.5,
              borderColor: "#f59e0b",
            }}
          >
            <Hash size={11} color="#f59e0b" />
            <Text
              style={{
                color: "#f59e0b",
                fontWeight: "800",
                fontSize: 12,
                letterSpacing: 2,
              }}
            >
              {rideInfo.vehicleNumber.toUpperCase()}
            </Text>
          </View>
        )}
        {etaMinutes !== null && (
          <View
            style={{
              backgroundColor: "#1a1a2e",
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 9,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Zap size={13} color="#f59e0b" fill="#f59e0b" />
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
              {etaMinutes} min
            </Text>
          </View>
        )}
      </View>

      <View
        style={{
          position: "absolute",
          right: 16,
          bottom: SHEET_MID + 16,
          zIndex: 10,
          gap: 10,
        }}
      >
        {mode === "driver" && (
          <TouchableOpacity
            onPress={openDirections}
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: "#4f8ef7",
              alignItems: "center",
              justifyContent: "center",
              elevation: 8,
            }}
          >
            <Navigation2 size={20} color="#fff" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() =>
            Alert.alert("Emergency SOS", "Choose an option", [
              {
                text: "Women Helpline",
                onPress: () => Linking.openURL("tel:1091"),
              },
              { text: "Police", onPress: () => Linking.openURL("tel:100") },
              { text: "Cancel", style: "cancel" },
            ])
          }
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            backgroundColor: "#ef4444",
            alignItems: "center",
            justifyContent: "center",
            elevation: 8,
          }}
        >
          <Shield size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: bottomOffset,
          height: sheetHeightAnim,
          backgroundColor: "#fff",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          shadowColor: "#000",
          shadowOpacity: 0.18,
          shadowRadius: 24,
          elevation: 20,
          zIndex: 20,
          overflow: "hidden",
        }}
      >
        <View
          {...panResponder.panHandlers}
          style={{ paddingTop: 10, paddingBottom: 6, alignItems: "center" }}
        >
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: "#e2e8f0",
            }}
          />
        </View>

        {!chatOpen && (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingBottom: Math.max(16, insets.bottom),
            }}
            showsVerticalScrollIndicator={false}
          >
            <RideInfoCard
              rideInfo={rideInfo}
              mode={mode}
              otherSignalColor={otherSignalColor}
              otherSignalLabel={otherSignalLabel}
              otherLocation={otherLocation}
              chatOpen={chatOpen}
              onToggleChat={toggleChat}
              unreadCount={unreadCount}
            />
            <View
              style={{
                height: 1,
                backgroundColor: "#f1f5f9",
                marginHorizontal: 16,
                marginBottom: 14,
              }}
            />
            <View style={{ paddingHorizontal: 16, gap: 10 }}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={() =>
                    router.replace(
                      modeRef.current === "driver"
                        ? "/home/driver"
                        : "/home/passenger",
                    )
                  }
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    backgroundColor: "#f8fafc",
                    borderRadius: 14,
                    paddingVertical: 13,
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                  }}
                >
                  <X size={15} color="#64748b" />
                  <Text
                    style={{
                      color: "#64748b",
                      fontWeight: "700",
                      fontSize: 14,
                    }}
                  >
                    Exit
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={cancelRide}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    backgroundColor: "#fff1f2",
                    borderRadius: 14,
                    paddingVertical: 13,
                    borderWidth: 1,
                    borderColor: "#fecdd3",
                  }}
                >
                  <AlertCircle size={15} color="#e11d48" />
                  <Text
                    style={{
                      color: "#e11d48",
                      fontWeight: "700",
                      fontSize: 14,
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
              {mode === "driver" && (
                <TouchableOpacity
                  onPress={initiateComplete}
                  disabled={!sessionId}
                  style={{
                    backgroundColor: sessionId ? "#1a1a2e" : "#e2e8f0",
                    borderRadius: 16,
                    paddingVertical: 16,
                    alignItems: "center",
                    elevation: sessionId ? 4 : 0,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "800",
                      letterSpacing: 0.3,
                      color: sessionId ? "#fff" : "#94a3b8",
                    }}
                  >
                    ✅ Complete Ride
                  </Text>
                </TouchableOpacity>
              )}
              {mode === "passenger" && (
                <TouchableOpacity
                  onPress={askDriverToComplete}
                  disabled={!sessionId || askingConfirm}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    backgroundColor: askingConfirm ? "#e2e8f0" : "#eff6ff",
                    borderRadius: 16,
                    paddingVertical: 16,
                    borderWidth: 1.5,
                    borderColor: askingConfirm ? "#e2e8f0" : "#3b82f6",
                    elevation: askingConfirm ? 0 : 2,
                  }}
                >
                  <Bell
                    size={16}
                    color={askingConfirm ? "#94a3b8" : "#3b82f6"}
                    fill={askingConfirm ? "transparent" : "#bfdbfe"}
                  />
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "800",
                      letterSpacing: 0.2,
                      color: askingConfirm ? "#94a3b8" : "#1d4ed8",
                    }}
                  >
                    {askingConfirm
                      ? "Request Sent…"
                      : "Ask Driver to Complete Ride"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        )}

        {chatOpen && (
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: "#f1f5f9",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                {rideInfo.otherProfilePic ? (
                  <Image
                    source={{ uri: rideInfo.otherProfilePic }}
                    style={{ width: 36, height: 36, borderRadius: 18 }}
                  />
                ) : (
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: "#1a1a2e",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{ color: "#fff", fontWeight: "800", fontSize: 14 }}
                    >
                      {(
                        rideInfo.otherName?.[0] ??
                        (mode === "driver" ? "P" : "D")
                      ).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: "#1a1a2e",
                    }}
                  >
                    {rideInfo.otherName ??
                      (mode === "driver" ? "Passenger" : "Driver")}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <PulseDot color={otherSignalColor} />
                    <Text style={{ fontSize: 11, color: "#64748b" }}>
                      {otherSignalLabel ?? "Waiting…"}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                onPress={toggleChat}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: "#f1f5f9",
                  borderRadius: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 7,
                }}
              >
                <ChevronDown size={14} color="#64748b" />
                <Text
                  style={{ fontSize: 12, color: "#64748b", fontWeight: "600" }}
                >
                  Hide
                </Text>
              </TouchableOpacity>
            </View>
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => item.clientId ?? item.ts}
              style={{ flex: 1 }}
              contentContainerStyle={{
                padding: 14,
                paddingBottom: 4,
                flexGrow: 1,
                justifyContent: messages.length === 0 ? "center" : "flex-start",
              }}
              onContentSizeChange={() =>
                listRef.current?.scrollToEnd({ animated: true })
              }
              ListEmptyComponent={
                <Text
                  style={{
                    color: "#94a3b8",
                    textAlign: "center",
                    fontSize: 13,
                  }}
                >
                  No messages yet — say hi! 👋
                </Text>
              }
              renderItem={({ item }) => (
                <View
                  style={{
                    alignItems: isOwn(item) ? "flex-end" : "flex-start",
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: isOwn(item) ? "#1a1a2e" : "#f1f5f9",
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 20,
                      borderBottomRightRadius: isOwn(item) ? 4 : 20,
                      borderBottomLeftRadius: isOwn(item) ? 20 : 4,
                      maxWidth: "78%",
                    }}
                  >
                    <Text
                      style={{
                        color: isOwn(item) ? "#fff" : "#1a1a2e",
                        fontSize: 14,
                        lineHeight: 20,
                      }}
                    >
                      {item.message}
                    </Text>
                    <Text
                      style={{
                        fontSize: 10,
                        marginTop: 4,
                        textAlign: "right",
                        color: isOwn(item)
                          ? "rgba(255,255,255,0.55)"
                          : "#94a3b8",
                      }}
                    >
                      {fmtTime(item.ts)}
                    </Text>
                  </View>
                </View>
              )}
            />
            <View
              style={{
                flexDirection: "row",
                paddingHorizontal: 14,
                paddingVertical: 10,
                paddingBottom: Math.max(10, insets.bottom),
                gap: 8,
                borderTopWidth: 1,
                borderTopColor: "#f1f5f9",
                alignItems: "flex-end",
                backgroundColor: "#fff",
              }}
            >
              <TextInput
                value={inputMsg}
                onChangeText={setInputMsg}
                placeholder="Message…"
                placeholderTextColor="#94a3b8"
                multiline
                maxLength={500}
                style={{
                  flex: 1,
                  backgroundColor: "#f8fafc",
                  color: "#1a1a2e",
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  fontSize: 14,
                  maxHeight: 90,
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                }}
                blurOnSubmit={false}
              />
              <TouchableOpacity
                onPress={sendMessage}
                disabled={!inputMsg.trim()}
                style={{
                  backgroundColor: inputMsg.trim() ? "#1a1a2e" : "#e2e8f0",
                  borderRadius: 20,
                  width: 44,
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Send size={16} color={inputMsg.trim() ? "#fff" : "#94a3b8"} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
}
