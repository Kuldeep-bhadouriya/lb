import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { ArrowRight, Car, Clock, Star } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { io, Socket } from "socket.io-client";
import { apiFetch } from "../../lib/apiFetch";
import { API_URL } from "../../lib/config";
import { useTheme } from "../../theme/ThemeContext";
import ScreenWrapper from "../components/ScreenWrapper";

const CREDITS_PER_INR = 10;

const JSON_HEADERS = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

function StarDisplay({
  rating,
  total,
  size = 11,
}: {
  rating: number | null;
  total?: number;
  size?: number;
}) {
  const { colors } = useTheme();
  if (!rating)
    return (
      <Text style={{ fontSize: size, color: colors.textMuted }}>
        No ratings
      </Text>
    );
  const full = Math.floor(rating),
    half = rating - full >= 0.5;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          color="#f59e0b"
          fill={
            s <= full
              ? "#f59e0b"
              : s === full + 1 && half
                ? "#f59e0b"
                : "transparent"
          }
          strokeWidth={1.5}
        />
      ))}
      <Text style={{ fontSize: size, color: colors.textMuted, marginLeft: 3 }}>
        {rating.toFixed(1)}
        {total ? ` (${total})` : ""}
      </Text>
    </View>
  );
}

function Avatar({
  uri,
  size = 40,
  initials = "?",
}: {
  uri?: string | null;
  size?: number;
  initials?: string;
}) {
  const [err, setErr] = useState(false);
  if (!uri || err) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "#1e293b",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{ color: "#fff", fontSize: size * 0.38, fontWeight: "700" }}
        >
          {initials[0]?.toUpperCase() ?? "?"}
        </Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#e2e8f0",
      }}
      onError={() => setErr(true)}
    />
  );
}

function Badge({ status }: { status: string }) {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: "#fef9c3", color: "#854d0e", label: "Pending" },
    accepted: { bg: "#dcfce7", color: "#166534", label: "Accepted" },
    rejected: { bg: "#fee2e2", color: "#991b1b", label: "Rejected" },
    cancelled: { bg: "#fee2e2", color: "#991b1b", label: "Cancelled" },
    completed: { bg: "#ede9fe", color: "#5b21b6", label: "Completed" },
    expired: { bg: "#f1f5f9", color: "#64748b", label: "Expired" },
  };
  const c = config[status] ?? config.expired;
  return (
    <View
      style={{
        backgroundColor: c.bg,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: "700",
          color: c.color,
          letterSpacing: 0.4,
        }}
      >
        {c.label.toUpperCase()}
      </Text>
    </View>
  );
}

function RouteRow({
  pickup,
  destination,
  colors,
}: {
  pickup: string;
  destination: string;
  colors: any;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "stretch",
        gap: 10,
        marginBottom: 12,
      }}
    >
      <View
        style={{
          width: 18,
          alignItems: "center",
          paddingTop: 3,
          paddingBottom: 3,
        }}
      >
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: "#22c55e",
            marginBottom: 2,
          }}
        />
        <View style={{ flex: 1, width: 1.5, backgroundColor: colors.border }} />
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: "#ef4444",
            marginTop: 2,
          }}
        />
      </View>
      <View style={{ flex: 1, justifyContent: "space-between" }}>
        <Text
          style={{ fontSize: 13, color: colors.text, marginBottom: 8 }}
          numberOfLines={1}
        >
          {pickup}
        </Text>
        <Text style={{ fontSize: 13, color: colors.text }} numberOfLines={1}>
          {destination}
        </Text>
      </View>
    </View>
  );
}

function SectionHeader({ label, count }: { label: string; count?: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
        marginTop: 8,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: "800",
          color: colors.textMuted,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
      {count != null && count > 0 && (
        <View
          style={{
            backgroundColor: colors.primary,
            borderRadius: 10,
            minWidth: 20,
            height: 20,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 5,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
            {count}
          </Text>
        </View>
      )}
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
    </View>
  );
}

function EmptyCard({
  emoji,
  title,
  subtitle,
}: {
  emoji: string;
  title: string;
  subtitle: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        alignItems: "center",
        paddingVertical: 32,
        backgroundColor: colors.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: "dashed",
        marginBottom: 24,
      }}
    >
      <Text style={{ fontSize: 36, marginBottom: 10 }}>{emoji}</Text>
      <Text
        style={{
          fontSize: 15,
          fontWeight: "600",
          color: colors.text,
          marginBottom: 4,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: colors.textMuted,
          textAlign: "center",
          paddingHorizontal: 24,
        }}
      >
        {subtitle}
      </Text>
    </View>
  );
}

function PulseDot({ color = "#22c55e" }: { color?: string }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1.7,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);
  return (
    <View
      style={{
        width: 10,
        height: 10,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View
        style={{
          position: "absolute",
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: color,
          opacity: 0.35,
          transform: [{ scale: anim }],
        }}
      />
      <View
        style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }}
      />
    </View>
  );
}

function SeatIcons({ item }: { item: any }) {
  const isBike = (item.vehicleType ?? item.vehicle_type ?? "car") === "bike";
  const total = isBike ? 1 : 3;
  const left = Number(item.seats ?? total);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
      {Array.from({ length: total }).map((_, i) => (
        <Text key={i} style={{ fontSize: 13, opacity: i >= left ? 0.2 : 1 }}>
          {isBike ? "🧑" : "🪑"}
        </Text>
      ))}
      <Text style={{ fontSize: 11, color: "#888", marginLeft: 3 }}>
        {isBike ? "🏍️" : "🚗"} {left} left
      </Text>
    </View>
  );
}

function ScheduleBadge({ item, colors }: { item: any; colors: any }) {
  if (!item.is_scheduled && !item.isScheduled) return null;
  const days = item.schedule_days ?? item.scheduleDays ?? "";
  const time = item.schedule_time ?? item.scheduleTime ?? "";
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: colors.primary + "15",
        alignSelf: "flex-start",
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        marginBottom: 6,
      }}
    >
      <Text style={{ fontSize: 11 }}>📅</Text>
      <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "600" }}>
        {[days, time].filter(Boolean).join(" · ")}
      </Text>
    </View>
  );
}

function WaitingForDriverCard({
  name,
  avatar,
  onCancel,
}: {
  name: string;
  avatar?: string | null;
  onCancel: () => void;
}) {
  const dotAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(dotAnim, {
        toValue: 3,
        duration: 1800,
        useNativeDriver: false,
      }),
    ).start();
  }, []);

  return (
    <View
      style={{
        borderRadius: 20,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#bbf7d0",
        backgroundColor: "#ffffff",
        marginBottom: 12,
      }}
    >
      <View style={{ height: 4, backgroundColor: "#22c55e" }} />
      <View style={{ padding: 20 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            marginBottom: 20,
          }}
        >
          <View style={{ position: "relative" }}>
            <Avatar uri={avatar} size={54} initials={name} />
            <View
              style={{
                position: "absolute",
                bottom: 1,
                right: 1,
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: "#fff",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PulseDot color="#22c55e" />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "800",
                color: "#0f172a",
                marginBottom: 2,
              }}
            >
              {name}
            </Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
            >
              <PulseDot color="#22c55e" />
              <Text
                style={{ fontSize: 12, color: "#16a34a", fontWeight: "600" }}
              >
                Driver confirmed — preparing ride
              </Text>
            </View>
          </View>
        </View>
        <View
          style={{
            backgroundColor: "#f0fdf4",
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: "#bbf7d0",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 32, marginBottom: 8 }}>🚗</Text>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: "#15803d",
              textAlign: "center",
            }}
          >
            Waiting for driver to start
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: "#166534",
              textAlign: "center",
              marginTop: 4,
              lineHeight: 18,
            }}
          >
            You'll be notified automatically{"\n"}when the ride begins
          </Text>
          <View style={{ flexDirection: "row", gap: 5, marginTop: 12 }}>
            {[0, 1, 2].map((i) => (
              <Animated.View
                key={i}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 3.5,
                  backgroundColor: "#22c55e",
                  opacity: dotAnim.interpolate({
                    inputRange: [i, i + 0.5, i + 1, 3],
                    outputRange: [0.3, 1, 0.3, 0.3],
                    extrapolate: "clamp",
                  }),
                }}
              />
            ))}
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          {["📍 Stay nearby", "🔔 Notifs on", "💬 Chat open"].map((tip) => (
            <View
              key={tip}
              style={{
                flex: 1,
                backgroundColor: "#f8fafc",
                borderRadius: 10,
                paddingVertical: 8,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#e2e8f0",
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  color: "#475569",
                  fontWeight: "600",
                  textAlign: "center",
                }}
              >
                {tip}
              </Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          onPress={onCancel}
          style={{
            paddingVertical: 13,
            borderRadius: 14,
            alignItems: "center",
            backgroundColor: "#fff1f2",
            borderWidth: 1,
            borderColor: "#fecdd3",
          }}
        >
          <Text style={{ color: "#dc2626", fontWeight: "700", fontSize: 13 }}>
            Cancel Request
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function JoinSessionCard({
  sessionId,
  mode,
  name,
  avatar,
  onJoin,
}: {
  sessionId: number;
  mode: string;
  name: string;
  avatar?: string | null;
  onJoin: () => void;
}) {
  const glowAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <View
      style={{
        borderRadius: 20,
        overflow: "hidden",
        borderWidth: 1.5,
        borderColor: "#3b82f6",
        backgroundColor: "#fff",
        marginBottom: 12,
      }}
    >
      <View style={{ height: 4, backgroundColor: "#3b82f6" }} />
      <View style={{ padding: 20 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <View style={{ position: "relative" }}>
            <Avatar uri={avatar} size={50} initials={name} />
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: "#3b82f6",
                borderWidth: 2,
                borderColor: "#fff",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 8 }}>🚗</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "800", color: "#0f172a" }}>
              {name}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: "#3b82f6",
                fontWeight: "600",
                marginTop: 1,
              }}
            >
              {mode === "driver" ? "Passenger boarded" : "Ride is live!"}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: "#eff6ff",
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 20,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "700", color: "#1d4ed8" }}>
              #{sessionId}
            </Text>
          </View>
        </View>
        <View
          style={{
            backgroundColor: "#eff6ff",
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: "#bfdbfe",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Animated.Text
            style={{
              fontSize: 28,
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.7, 1],
              }),
            }}
          >
            🔵
          </Animated.Text>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: "#1d4ed8",
              marginTop: 6,
            }}
          >
            Ride In Progress
          </Text>
          <Text style={{ fontSize: 12, color: "#3b82f6", marginTop: 3 }}>
            Tap below to open live tracking
          </Text>
        </View>
        <TouchableOpacity
          onPress={onJoin}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            backgroundColor: "#1a1a2e",
            paddingVertical: 15,
            borderRadius: 16,
          }}
        >
          <Text style={{ fontSize: 16 }}>📍</Text>
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>
            Join Live Tracking
          </Text>
          <ArrowRight size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function MyRides() {
  const { colors } = useTheme();
  const router = useRouter();

  const [session, setSession] = useState<any | null>(null);
  const [startedSessions, setStartedSessions] = useState<Set<number>>(
    new Set(),
  );
  const [requests, setRequests] = useState<any[]>([]);
  const [rides, setRides] = useState<any[]>([]);
  const [standaloneRequests, setStandaloneRequests] = useState<any[]>([]);
  const [incomingStandalone, setIncomingStandalone] = useState<any[]>([]); 
  const [user, setUser] = useState<any>(null);
  const [loadingInit, setLoadingInit] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    (async () => {
      const u = JSON.parse((await AsyncStorage.getItem("user")) || "{}");
      setUser(u);
    })();
  }, []);

  const persistStartedSession = async (sid: number) => {
    try {
      const raw = await AsyncStorage.getItem("started_sessions");
      const existing: number[] = raw ? JSON.parse(raw) : [];
      if (!existing.includes(sid)) {
        existing.push(sid);
        await AsyncStorage.setItem(
          "started_sessions",
          JSON.stringify(existing),
        );
      }
    } catch {}
  };

  const loadStartedSessions = async () => {
    try {
      const raw = await AsyncStorage.getItem("started_sessions");
      if (raw) setStartedSessions(new Set(JSON.parse(raw)));
    } catch {}
  };

  const loadSession = async () => {
    try {
      const raw = await AsyncStorage.getItem("active_session");
      setSession(raw ? JSON.parse(raw) : null);
    } catch {
      setSession(null);
    }
  };

  const loadRequests = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const [driverRes, passengerRes]: any = await Promise.all([
        apiFetch(`${API_URL}/driver/ride-requests`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
        apiFetch(`${API_URL}/my-ride-requests`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
      ]);
      const combined = [
        ...(driverRes?.requests ?? []),
        ...(passengerRes?.requests ?? []),
      ];
      setRequests(Array.from(new Map(combined.map((i) => [i.id, i])).values()));
    } catch {
    } finally {
      loadingRef.current = false;
    }
  };

  const loadMyRides = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const res: any = await apiFetch(`${API_URL}/my-rides`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRides(res?.rides ?? []);
    } catch {
      setRides([]);
    }
  };

  const loadStandaloneRequests = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const res: any = await apiFetch(`${API_URL}/my-standalone-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res?.success) setStandaloneRequests(res.requests ?? []);
    } catch {}
  };

  const loadIncomingStandalone = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const res: any = await apiFetch(`${API_URL}/driver/standalone-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res?.success) setIncomingStandalone(res.requests ?? []);
    } catch {}
  };

  const loadAll = useCallback(async () => {
    await Promise.all([
      loadSession(),
      loadRequests(),
      loadMyRides(),
      loadStartedSessions(),
      loadStandaloneRequests(),
      loadIncomingStandalone(),
    ]);
    setLoadingInit(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll]),
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      const token = await AsyncStorage.getItem("token");
      const userData = JSON.parse((await AsyncStorage.getItem("user")) || "{}");
      if (!token || !userData?.Id) return;
      const socket = io(API_URL, {
        transports: ["websocket"],
        auth: { token },
      });
      socketRef.current = socket;

      if (userData.role === "driver")
        socket.emit("register_driver", { driverId: userData.Id });
      else socket.emit("register_passenger", { passengerId: userData.Id });

      socket.on("new_ride_request", () => mounted && loadRequests());
      socket.on("request_rejected", () => mounted && loadRequests());
      socket.on("request_expired", () => mounted && loadRequests());

      socket.on("request_accepted", async () => {
        if (!mounted) return;
        await loadRequests();
        if (userData.role !== "driver") {
          Alert.alert(
            "Ride Accepted! 🎉",
            "Your driver has accepted your request. Waiting for them to start the ride.",
            [{ text: "OK" }],
          );
        }
      });

      socket.on("ride_started", async (data: any) => {
        if (!mounted) return;
        const sid = parseInt(data?.sessionId);
        if (sid) {
          setStartedSessions((prev) => {
            const u = new Set(prev);
            u.add(sid);
            return u;
          });
          await persistStartedSession(sid);
        }
        await loadRequests();
        await loadSession();
        if (sid) {
          const mode = userData.role === "driver" ? "driver" : "passenger";
          await AsyncStorage.setItem(
            "active_session",
            JSON.stringify({ sessionId: sid, mode }),
          );
          setSession({ sessionId: sid, mode });
        }
      });
    })();
    return () => {
      mounted = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  const joinSession = async (sessionId: number, mode: string) => {
    await AsyncStorage.setItem(
      "active_session",
      JSON.stringify({ sessionId, mode }),
    );
    router.replace({ pathname: "/ride/tracking", params: { sessionId, mode } });
  };

  const resumeSession = () => {
    if (session)
      router.push({
        pathname: "/ride/tracking",
        params: { sessionId: session.sessionId, mode: session.mode },
      });
  };

  const clearSession = () =>
    Alert.alert("Remove Session", "Remove the saved session?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("active_session");
          setSession(null);
        },
      },
    ]);

  const acceptRequest = async (id: number) => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return;
    const res: any = await apiFetch(`${API_URL}/accept-ride-request`, {
      method: "POST",
      headers: JSON_HEADERS(token),
      body: JSON.stringify({ requestId: id }),
    });
    if (res.success) {
      await loadRequests();
      Alert.alert(
        "Ride Accepted ✅",
        "Tap 'Start Ride' when you're ready to pick up the passenger.",
      );
    } else Alert.alert("Error", res.message || "Failed");
  };

  const startRide = async (sessionId: number) => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return;
    const res: any = await apiFetch(`${API_URL}/start-ride`, {
      method: "POST",
      headers: JSON_HEADERS(token),
      body: JSON.stringify({ sessionId }),
    });
    if (res.success) {
      await AsyncStorage.setItem(
        "active_session",
        JSON.stringify({ sessionId, mode: "driver" }),
      );
      setStartedSessions((prev) => new Set([...prev, sessionId]));
      await persistStartedSession(sessionId);
      setSession({ sessionId, mode: "driver" });
      router.replace({
        pathname: "/ride/tracking",
        params: { sessionId, mode: "driver" },
      });
    } else Alert.alert("Error", res.message);
  };

  const rejectRequest = async (id: number) => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return;
    await apiFetch(`${API_URL}/reject-ride-request`, {
      method: "POST",
      headers: JSON_HEADERS(token),
      body: JSON.stringify({ requestId: id }),
    });
    loadRequests();
  };

  const cancelRequest = async (id: number) => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return;
    await apiFetch(`${API_URL}/cancel-ride-request`, {
      method: "POST",
      headers: JSON_HEADERS(token),
      body: JSON.stringify({ requestId: id }),
    });
    loadRequests();
  };

  const cancelStandaloneRequest = async (id: number) => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return;
    setStandaloneRequests((prev) => prev.filter((r) => r.id !== id));
    const res: any = await apiFetch(`${API_URL}/cancel-standalone-request`, {
      method: "POST",
      headers: JSON_HEADERS(token),
      body: JSON.stringify({ requestId: id }),
    });
    if (!res.success) {
      Alert.alert("Error", res.message || "Could not cancel");
      loadStandaloneRequests();
    }
  };

  const acceptStandaloneRequest = async (
    reqId: number,
    candidateRideId: number,
  ) => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return;
    setIncomingStandalone((prev) => prev.filter((r) => r.id !== reqId));
    const res: any = await apiFetch(`${API_URL}/accept-standalone-request`, {
      method: "POST",
      headers: JSON_HEADERS(token),
      body: JSON.stringify({ requestId: reqId, rideId: candidateRideId }),
    });
    if (res.success) {
      Alert.alert(
        "Matched! 🎉",
        "The passenger has been notified. They'll confirm from their side.",
      );
      loadRequests();
    } else {
      Alert.alert("Error", res.message || "Could not accept request");
      loadIncomingStandalone();
    }
  };

  const rejectStandaloneRequest = async (reqId: number) => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return;
    setIncomingStandalone((prev) => prev.filter((r) => r.id !== reqId));
    await apiFetch(`${API_URL}/reject-standalone-request`, {
      method: "POST",
      headers: JSON_HEADERS(token),
      body: JSON.stringify({ requestId: reqId }),
    });
  };

  const deleteRide = (id: number) =>
    Alert.alert("Delete Ride", "Are you sure?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const token = await AsyncStorage.getItem("token");
          const res: any = await apiFetch(`${API_URL}/delete-ride`, {
            method: "POST",
            headers: JSON_HEADERS(token!),
            body: JSON.stringify({ id }),
          });
          if (res.success) loadMyRides();
        },
      },
    ]);

  const isDriver = (item: any) =>
    user && String(item.driver_id) === String(user.Id);
  const hasAccepted = requests.some(
    (r) => r.status === "accepted" && r.session_id,
  );
  const isDriverUser = user?.role === "driver";
  const isFemale = user?.gender?.toLowerCase() === "female";
  const isFaculty = user?.isFaculty === true;

  const sortedRequests = isFemale
    ? [
        ...requests.filter((r) => r.gender?.toLowerCase() === "female"),
        ...requests.filter((r) => r.gender?.toLowerCase() !== "female"),
      ]
    : requests;

  if (loadingInit)
    return (
      <ScreenWrapper>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: colors.textMuted, fontSize: 15 }}>
            Loading...
          </Text>
        </View>
      </ScreenWrapper>
    );

  const getRouteForUser = (item: any, _isDriver: boolean) => {
    if (_isDriver) {
      return {
        pickup:
          item.pickup?.description ||
          item.pickup_desc ||
          item.passengerPickup ||
          "Pickup N/A",
        destination:
          item.destination?.description ||
          item.destination_desc ||
          item.passengerDestination ||
          "Destination N/A",
      };
    }
    return {
      pickup:
        item.driverPickup ||
        item.pickup?.description ||
        item.pickup_desc ||
        "Pickup N/A",
      destination:
        item.driverDestination ||
        item.destination?.description ||
        item.destination_desc ||
        "Destination N/A",
    };
  };

  const renderRequest = (item: any) => {
    const _isDriver = isDriver(item);
    const isAccepted = item.status === "accepted";
    const name = _isDriver
      ? [item.passengerFirst, item.passengerLast].filter(Boolean).join(" ") ||
        "Passenger"
      : [item.driverFirst, item.driverLast].filter(Boolean).join(" ") ||
        "Driver";
    const imageUrl = _isDriver
      ? item.passengerProfilePic
      : item.driverProfilePic;
    const route = getRouteForUser(item, _isDriver);
    const rideStarted = item.ride_started === true;

    if (!_isDriver && isAccepted && rideStarted && item.session_id)
      return (
        <JoinSessionCard
          key={item.id}
          sessionId={parseInt(item.session_id)}
          mode="passenger"
          name={name}
          avatar={imageUrl}
          onJoin={() => joinSession(parseInt(item.session_id), "passenger")}
        />
      );

    if (!_isDriver && isAccepted && !rideStarted)
      return (
        <WaitingForDriverCard
          key={item.id}
          name={name}
          avatar={imageUrl}
          onCancel={() => cancelRequest(item.id)}
        />
      );

    if (_isDriver && isAccepted && rideStarted && item.session_id)
      return (
        <JoinSessionCard
          key={item.id}
          sessionId={parseInt(item.session_id)}
          mode="driver"
          name={name}
          avatar={imageUrl}
          onJoin={() => joinSession(parseInt(item.session_id), "driver")}
        />
      );

    return (
      <View
        key={item.id}
        style={{
          backgroundColor: colors.card,
          borderRadius: 20,
          marginBottom: 12,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: isAccepted ? "#22c55e30" : colors.border,
        }}
      >
        {isAccepted && (
          <View style={{ height: 3, backgroundColor: "#22c55e" }} />
        )}
        <View style={{ padding: 16 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Avatar uri={imageUrl} size={42} initials={name} />
              <View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: colors.text,
                  }}
                >
                  {name}
                </Text>
                {!_isDriver && item.driverAvgRating && (
                  <View style={{ marginTop: 2 }}>
                    <StarDisplay
                      rating={item.driverAvgRating}
                      total={item.driverTotalRatings}
                      size={10}
                    />
                  </View>
                )}
                {_isDriver && item.gender?.toLowerCase() === "female" && (
                  <Text
                    style={{ fontSize: 11, color: "#ec4899", marginTop: 1 }}
                  >
                    👩 Female-only
                  </Text>
                )}
              </View>
            </View>
            <Badge status={item.status} />
          </View>
          <Text
            style={{ fontSize: 10, color: colors.textMuted, marginBottom: 10 }}
          >
            {_isDriver ? "Passenger Route" : "Driver Route"}
          </Text>
          <RouteRow
            pickup={route.pickup}
            destination={route.destination}
            colors={colors}
          />

          {_isDriver ? (
            item.status === "pending" && !hasAccepted ? (
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  onPress={() => rejectRequest(item.id)}
                  style={{
                    flex: 1,
                    paddingVertical: 11,
                    borderRadius: 12,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  }}
                >
                  <Text
                    style={{
                      color: colors.textMuted,
                      fontWeight: "600",
                      fontSize: 13,
                    }}
                  >
                    Decline
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => acceptRequest(item.id)}
                  style={{
                    flex: 2,
                    paddingVertical: 11,
                    borderRadius: 12,
                    alignItems: "center",
                    backgroundColor: "#22c55e",
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}
                  >
                    Accept Ride
                  </Text>
                </TouchableOpacity>
              </View>
            ) : isAccepted && item.session_id ? (
              <TouchableOpacity
                onPress={() => startRide(item.session_id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  backgroundColor: "#1a1a2e",
                  paddingVertical: 13,
                  borderRadius: 14,
                }}
              >
                <Car size={16} color="#fff" />
                <Text
                  style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}
                >
                  Start Ride
                </Text>
                <ArrowRight size={14} color="#fff" />
              </TouchableOpacity>
            ) : (
              <View
                style={{
                  paddingVertical: 11,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                  Another ride is active
                </Text>
              </View>
            )
          ) : (
            item.status === "pending" && (
              <TouchableOpacity
                onPress={() => cancelRequest(item.id)}
                style={{
                  paddingVertical: 11,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: "#fff1f2",
                  borderWidth: 1,
                  borderColor: "#fecdd3",
                }}
              >
                <Text
                  style={{ color: "#e11d48", fontWeight: "600", fontSize: 13 }}
                >
                  Cancel Request
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper>
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingTop: 24,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadAll();
            }}
          />
        }
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "800",
            color: colors.text,
            marginBottom: 6,
          }}
        >
          Rides & Requests
        </Text>
        <Text
          style={{ fontSize: 14, color: colors.textMuted, marginBottom: 28 }}
        >
          {isDriverUser
            ? "Manage incoming requests and your posted rides"
            : "Track your ride requests and active sessions"}
        </Text>

        {isFaculty && (
          <View
            style={{
              backgroundColor: "#1a3a6b",
              borderRadius: 10,
              padding: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 14 }}>🏛️</Text>
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>
              Faculty mode — faculty rides only
            </Text>
          </View>
        )}

        {session && (
          <>
            <SectionHeader label="Active Session" />
            <View
              style={{
                backgroundColor: "#1a1a2e",
                borderRadius: 20,
                padding: 18,
                marginBottom: 24,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <PulseDot color="#22c55e" />
                <Text style={{ color: "#94a3b8", fontSize: 12, flex: 1 }}>
                  Live session in progress
                </Text>
                <View
                  style={{
                    backgroundColor: "#ffffff20",
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                  }}
                >
                  <Text style={{ color: "#94a3b8", fontSize: 11 }}>
                    #{session.sessionId}
                  </Text>
                </View>
              </View>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 17,
                  fontWeight: "700",
                  marginBottom: 4,
                }}
              >
                {session.mode === "driver" ? "🚗 Driving" : "🧍 Passenger"}
              </Text>
              <TouchableOpacity
                onPress={resumeSession}
                style={{
                  backgroundColor: "#22c55e",
                  borderRadius: 14,
                  paddingVertical: 13,
                  alignItems: "center",
                  marginBottom: 8,
                  marginTop: 10,
                }}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}
                >
                  Resume Live Tracking →
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={clearSession}
                style={{ paddingVertical: 10, alignItems: "center" }}
              >
                <Text style={{ color: "#64748b", fontSize: 13 }}>
                  Remove saved session
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <SectionHeader
          label="Requests"
          count={requests.filter((r) => r.status === "pending").length}
        />
        {requests.length === 0 ? (
          <EmptyCard
            emoji="🚕"
            title="No requests yet"
            subtitle={
              isDriverUser
                ? "Incoming passenger requests will appear here"
                : "Your ride requests will appear here"
            }
          />
        ) : (
          <View style={{ marginBottom: 28 }}>
            {sortedRequests.map(renderRequest)}
          </View>
        )}

        {standaloneRequests.length > 0 && (
          <>
            <SectionHeader
              label="Ride Requests Posted"
              count={standaloneRequests.length}
            />
            <View style={{ marginBottom: 28 }}>
              {standaloneRequests.map((req) => (
                <View
                  key={req.id}
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 16,
                    marginBottom: 12,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>🙋</Text>
                      <Text
                        style={{
                          color: colors.text,
                          fontWeight: "600",
                          fontSize: 14,
                        }}
                      >
                        Ride Request
                      </Text>
                    </View>
                    <Badge status={req.status} />
                  </View>
                  <RouteRow
                    pickup={req.pickup_desc || "Pickup"}
                    destination={req.destination_desc || "Destination"}
                    colors={colors}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.textMuted,
                      marginBottom: 10,
                    }}
                  >
                    Posted{" "}
                    {new Date(req.created_at).toLocaleString("en-IN", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </Text>
                  <TouchableOpacity
                    onPress={() => cancelStandaloneRequest(req.id)}
                    style={{
                      paddingVertical: 10,
                      borderRadius: 12,
                      alignItems: "center",
                      backgroundColor: "#fff1f2",
                      borderWidth: 1,
                      borderColor: "#fecdd3",
                    }}
                  >
                    <Text
                      style={{
                        color: "#e11d48",
                        fontWeight: "600",
                        fontSize: 13,
                      }}
                    >
                      Cancel Request
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </>
        )}

        {isDriverUser && incomingStandalone.length > 0 && (
          <>
            <SectionHeader
              label="Passenger Requests Matching Your Rides"
              count={incomingStandalone.length}
            />
            <View style={{ marginBottom: 28 }}>
              {incomingStandalone.map((req) => {
                const candidateRides = rides.filter((r) => Number(r.seats) > 0);
                const defaultRideId = candidateRides[0]?.id;
                return (
                  <View
                    key={req.id}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      marginBottom: 12,
                      padding: 16,
                      borderWidth: 1.5,
                      borderColor: "#3b82f6",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 12,
                      }}
                    >
                      <Avatar
                        uri={req.passengerProfilePic}
                        size={38}
                        initials={req.pFirst || "P"}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: colors.text,
                            fontWeight: "700",
                            fontSize: 14,
                          }}
                        >
                          {req.pFirst} {req.pLast}
                        </Text>
                        <Text
                          style={{
                            color: "#3b82f6",
                            fontSize: 11,
                            fontWeight: "600",
                          }}
                        >
                          🙋 Looking for a ride on your route
                        </Text>
                      </View>
                    </View>

                    <RouteRow
                      pickup={req.pickup_desc || "Pickup"}
                      destination={req.destination_desc || "Destination"}
                      colors={colors}
                    />

                    {candidateRides.length === 0 ? (
                      <View
                        style={{
                          backgroundColor: "#fef3c7",
                          borderRadius: 10,
                          padding: 10,
                          marginBottom: 10,
                        }}
                      >
                        <Text style={{ color: "#92400e", fontSize: 12 }}>
                          You have no rides with open seats right now. Post a
                          ride first to accept this request.
                        </Text>
                      </View>
                    ) : (
                      <View
                        style={{
                          flexDirection: "row",
                          gap: 8,
                          marginBottom: 4,
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => rejectStandaloneRequest(req.id)}
                          style={{
                            flex: 1,
                            paddingVertical: 11,
                            borderRadius: 12,
                            alignItems: "center",
                            borderWidth: 1,
                            borderColor: colors.border,
                            backgroundColor: colors.surface,
                          }}
                        >
                          <Text
                            style={{
                              color: colors.textMuted,
                              fontWeight: "600",
                              fontSize: 13,
                            }}
                          >
                            Reject
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            acceptStandaloneRequest(req.id, defaultRideId)
                          }
                          style={{
                            flex: 2,
                            paddingVertical: 11,
                            borderRadius: 12,
                            alignItems: "center",
                            backgroundColor: "#3b82f6",
                          }}
                        >
                          <Text
                            style={{
                              color: "#fff",
                              fontWeight: "700",
                              fontSize: 13,
                            }}
                          >
                            Accept
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </>
        )}

        {isDriverUser && (
          <>
            <SectionHeader label="My Posted Rides" count={rides.length} />
            {rides.length === 0 ? (
              <EmptyCard
                emoji="📋"
                title="No rides posted"
                subtitle="Rides you post as a driver will appear here"
              />
            ) : (
              rides.map((item: any) => {
                const credits = item.price
                  ? Math.round(parseFloat(item.price) * CREDITS_PER_INR)
                  : null;
                return (
                  <View
                    key={item.id}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 20,
                      marginBottom: 14,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View style={{ height: 3, backgroundColor: "#3b82f6" }} />
                    <View style={{ padding: 16 }}>
                      {(item.ride_type === "faculty" || isFaculty) && (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                            marginBottom: 8,
                          }}
                        >
                          <Text style={{ fontSize: 12 }}>🏛️</Text>
                          <Text
                            style={{
                              fontSize: 11,
                              color: "#1a3a6b",
                              fontWeight: "600",
                            }}
                          >
                            Faculty Ride
                          </Text>
                        </View>
                      )}
                      <RouteRow
                        pickup={item.pickup_desc || "Pickup"}
                        destination={item.destination_desc || "Destination"}
                        colors={colors}
                      />

                      <ScheduleBadge item={item} colors={colors} />

                      <View
                        style={{
                          flexDirection: "row",
                          flexWrap: "wrap",
                          gap: 6,
                          marginBottom: 14,
                          marginTop: 4,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                            backgroundColor: colors.surface,
                            borderRadius: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                          }}
                        >
                          <SeatIcons item={item} />
                        </View>

                        {credits !== null && (
                          <View
                            style={{
                              backgroundColor: "#fffbeb",
                              borderRadius: 8,
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderWidth: 1,
                              borderColor: "#fde68a",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 11,
                                color: "#92400e",
                                fontWeight: "700",
                              }}
                            >
                              🪙 {credits} credits
                            </Text>
                          </View>
                        )}

                        {item.ride_datetime && (
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                              backgroundColor: colors.surface,
                              borderRadius: 8,
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                            }}
                          >
                            <Clock size={10} color={colors.textMuted} />
                            <Text
                              style={{ fontSize: 11, color: colors.textMuted }}
                            >
                              {new Date(item.ride_datetime).toLocaleString(
                                "en-IN",
                                { dateStyle: "short", timeStyle: "short" },
                              )}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <TouchableOpacity
                          onPress={() =>
                            router.push({
                              pathname: "../ride/editRides",
                              params: { ride: JSON.stringify(item) },
                            })
                          }
                          style={{
                            flex: 1,
                            paddingVertical: 11,
                            borderRadius: 12,
                            alignItems: "center",
                            borderWidth: 1,
                            borderColor: colors.border,
                            backgroundColor: colors.surface,
                          }}
                        >
                          <Text
                            style={{
                              color: colors.text,
                              fontWeight: "600",
                              fontSize: 13,
                            }}
                          >
                            Edit
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => deleteRide(item.id)}
                          style={{
                            flex: 1,
                            paddingVertical: 11,
                            borderRadius: 12,
                            alignItems: "center",
                            backgroundColor: "#fff1f2",
                            borderWidth: 1,
                            borderColor: "#fecdd3",
                          }}
                        >
                          <Text
                            style={{
                              color: "#e11d48",
                              fontWeight: "600",
                              fontSize: 13,
                            }}
                          >
                            Delete
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}
