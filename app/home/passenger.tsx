import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Clock, MapPin, Navigation, Search } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { LatLng, Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { apiFetch } from "../../lib/apiFetch";
import {
  API_URL,
  GOOGLE_MAPS_API_KEY,
  RECENTS_STORAGE_KEY,
} from "../../lib/config";
import { useTheme } from "../../theme/ThemeContext";
import Button from "../components/Button";
import Card from "../components/Card";
import ScreenWrapper from "../components/ScreenWrapper";

const { width, height } = Dimensions.get("window");
const ASPECT = width / height;
const LAT_DELTA = 0.05;
const LNG_DELTA = LAT_DELTA * ASPECT;

const ITM_GWALIOR = {
  description:
    "ITM Gwalior, Nh-75, opp. Sithouli Railway Station, Sithouli, Gwalior, Madhya Pradesh 474001",
  location: { latitude: 26.1473717, longitude: 78.1880359 },
};

type RecentPlace = { id: string; title: string; location: LatLng };

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
  const [step, setStep] = useState<QuickProfileStep>(
    initialPhone ? "gender" : "phone",
  );
  const [phone, setPhone] = useState(initialPhone || "");
  const [phoneError, setPhoneError] = useState("");
  const [gender, setGender] = useState(initialGender || "");

  useEffect(() => {
    if (visible) {
      setStep(initialPhone ? "gender" : "phone");
      setPhone(initialPhone || "");
      setGender(initialGender || "");
      setPhoneError("");
    }
  }, [visible]);

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

  const handlePhoneNext = () => {
    if (!phone || phoneError) {
      setPhoneError(phone ? phoneError : "Phone number is required");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setPhoneError("Enter a valid 10-digit Indian phone number");
      return;
    }
    setStep("gender");
  };

  const handleFinish = () => {
    if (!gender) {
      Alert.alert("Required", "Please select your gender");
      return;
    }
    onComplete(phone, gender);
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

          <View
            style={{
              flexDirection: "row",
              gap: 8,
              alignSelf: "center",
              marginBottom: 24,
            }}
          >
            {["phone", "gender"].map((s) => (
              <View
                key={s}
                style={{
                  width: step === s ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: step === s ? colors.primary : colors.border,
                }}
              />
            ))}
          </View>

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
                Almost there! 📱
              </Text>
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 14,
                  marginBottom: 24,
                }}
              >
                Add your phone number so the driver can reach you.
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
                  placeholder="Phone number"
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
              <Button onPress={handlePhoneNext}>Next →</Button>
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
                One more thing 👤
              </Text>
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 14,
                  marginBottom: 24,
                }}
              >
                Your gender helps match you with the right rides.
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
                      }}
                    >
                      {g}
                    </Text>
                    {gender === g && (
                      <View style={{ marginLeft: "auto" }}>
                        <Text style={{ color: colors.primary, fontSize: 18 }}>
                          ✓
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              <Button onPress={handleFinish}>Book Ride ✓</Button>
              {!initialPhone && (
                <TouchableOpacity
                  onPress={() => setStep("phone")}
                  style={{ marginTop: 12, alignItems: "center" }}
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
            style={{ marginTop: 12, alignItems: "center" }}
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

export default function Passenger() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView | null>(null);
  const { colors } = useTheme();

  const [user, setUser] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<LatLng>({
    latitude: 26.2183,
    longitude: 78.1828,
  });
  const [pickup, setPickup] = useState<any>(null);
  const [destination, setDestination] = useState<any>(null);
  const [pickupIsCurrent, setPickupIsCurrent] = useState(false);
  const [destinationIsCurrent, setDestinationIsCurrent] = useState(false);
  const [recentPlaces, setRecentPlaces] = useState<RecentPlace[]>([]);
  const [rides, setRides] = useState([]);
  const [loadingRides, setLoadingRides] = useState(false);
  const [showITMModal, setShowITMModal] = useState(false);
  const [showQuickProfile, setShowQuickProfile] = useState(false);

  const [requestingRide, setRequestingRide] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;
        const res: any = await apiFetch(`${API_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.success) return;
        const normalized = {
          ...res.user,
          emailVerified:
            res.user.emailVerified ?? res.user.EmailVerified ?? false,
        };
        setUser(normalized);
        await AsyncStorage.setItem("user", JSON.stringify(normalized));
      } catch (err) {}
    };
    loadUser();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(RECENTS_STORAGE_KEY);
        if (raw) setRecentPlaces(JSON.parse(raw));
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setCurrentLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch {}
    })();
  }, []);

  useEffect(() => {
    try {
      if (params?.pickupDesc && params?.pickupLat && params?.pickupLng) {
        const desc = decodeURIComponent(params.pickupDesc as string);
        const lat = Number(params.pickupLat),
          lng = Number(params.pickupLng);
        if (!isNaN(lat) && !isNaN(lng)) {
          setPickup({
            description: desc,
            location: { latitude: lat, longitude: lng },
          });
          setPickupIsCurrent(params.pickupIsCurrent === "1");
          setTimeout(fitToMarkers, 200);
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
        if (!isNaN(lat) && !isNaN(lng)) {
          setDestination({
            description: desc,
            location: { latitude: lat, longitude: lng },
          });
          setDestinationIsCurrent(params.destinationIsCurrent === "1");
          addToRecents(desc, { latitude: lat, longitude: lng });
          setTimeout(fitToMarkers, 200);
        }
      }
    } catch {}
  }, [params?.destinationDesc, params?.destinationLat, params?.destinationLng]);

  useEffect(() => {
    AsyncStorage.setItem(RECENTS_STORAGE_KEY, JSON.stringify(recentPlaces));
  }, [recentPlaces]);

  const addToRecents = (title: string, location: LatLng) => {
    setRecentPlaces((prev) => {
      const filtered = prev.filter((p) => p.title !== title);
      return [
        { id: Date.now().toString(), title, location },
        ...filtered,
      ].slice(0, 3);
    });
  };

  const fitToMarkers = () => {
    if (!mapRef.current) return;
    const ids: string[] = [];
    if (pickup) ids.push("pickup");
    if (destination) ids.push("destination");
    if (!ids.length) return;
    mapRef.current.fitToSuppliedMarkers(ids, {
      animated: true,
      edgePadding: { top: 90, bottom: 300, left: 40, right: 40 },
    });
  };

  const handleGo = () => {
    if (!pickup || !destination) {
      Alert.alert("Missing Info", "Please select both pickup and destination.");
      return;
    }

    const isFaculty = user?.isFaculty === true;

    router.push({
      pathname: "../ride/availableRides",
      params: {
        pickup: encodeURIComponent(pickup.description),
        destination: encodeURIComponent(destination.description),
        pickupLat: pickup.location.latitude,
        pickupLng: pickup.location.longitude,
        destLat: destination.location.latitude,
        destLng: destination.location.longitude,
        userPhone: user?.phone || user?.Phone || "",
        userGender: user?.gender || "",
        rideType: isFaculty ? "faculty" : "general",
      },
    });
  };

  const handleRequestRide = async () => {
    if (!pickup || !destination) {
      return Alert.alert(
        "Set Locations",
        "Please set both pickup and destination first.",
      );
    }

    const token = await AsyncStorage.getItem("token");
    if (!token) return router.push("/auth/login");

    Alert.alert(
      "Request a Ride 🙋",
      "Can't find a ride? Post a request and drivers with matching routes will be notified.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Post Request",
          onPress: async () => {
            setRequestingRide(true);
            try {
              const isFaculty = user?.isFaculty === true;
              const data: any = await apiFetch(
                `${API_URL}/standalone-ride-request`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    pickup,
                    destination,
                    rideType: isFaculty ? "faculty" : "general",
                  }),
                },
              );
              if (data.success) {
                Alert.alert(
                  "Request Posted! 🎉",
                  "Your ride request is live. You'll be notified when a driver accepts.",
                  [{ text: "OK", onPress: () => router.push("/home/Myrides") }],
                );
              } else {
                Alert.alert("Error", data.message || "Could not post request.");
              }
            } catch (err: any) {
              Alert.alert(
                "Error",
                err.message || "Could not connect to server.",
              );
            } finally {
              setRequestingRide(false);
            }
          },
        },
      ],
    );
  };

  const handleITMFill = (field: "pickup" | "destination") => {
    setShowITMModal(false);
    if (field === "pickup") {
      setPickup(ITM_GWALIOR);
      setPickupIsCurrent(false);
    } else {
      setDestination(ITM_GWALIOR);
      setDestinationIsCurrent(false);
      addToRecents(ITM_GWALIOR.description, ITM_GWALIOR.location);
    }
    setTimeout(fitToMarkers, 200);
  };

  const loadMyRides = async () => {
    setLoadingRides(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const res: any = await apiFetch(`${API_URL}/my-rides`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.success) setRides(res.rides);
    } catch {}
    setLoadingRides(false);
  };

  useEffect(() => {
    loadMyRides();
  }, []);

  const isFaculty = user?.isFaculty === true;

  return (
    <ScreenWrapper>
      <ITMFillModal
        visible={showITMModal}
        onClose={() => setShowITMModal(false)}
        onSelect={handleITMFill}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {isFaculty && (
          <View
            style={{
              margin: 16,
              marginBottom: 0,
              padding: 12,
              backgroundColor: "#1a3a6b",
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Text style={{ fontSize: 18 }}>🏛️</Text>
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>
              Faculty mode — you'll only see faculty rides
            </Text>
          </View>
        )}

        {user && !user.emailVerified && (
          <View
            style={{
              margin: 16,
              marginBottom: 0,
              padding: 12,
              backgroundColor: "#fef3c7",
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Text style={{ fontSize: 18 }}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 13, color: "#92400e", fontWeight: "600" }}
              >
                Email not verified
              </Text>
              <TouchableOpacity
                onPress={() => router.push("../verify/verifyEmail")}
              >
                <Text style={{ fontSize: 12, color: "#b45309", marginTop: 2 }}>
                  Tap to verify →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 25,
              height: 260,
              borderRadius: 24,
              overflow: "hidden",
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <MapView
              ref={mapRef}
              style={{ flex: 1 }}
              initialRegion={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: LAT_DELTA,
                longitudeDelta: LNG_DELTA,
              }}
              showsUserLocation
            >
              {pickup && !pickupIsCurrent && (
                <Marker
                  identifier="pickup"
                  coordinate={pickup.location}
                  pinColor="blue"
                />
              )}
              {destination && (
                <Marker
                  identifier="destination"
                  coordinate={destination.location}
                  pinColor="red"
                />
              )}
              {pickup && destination && (
                <MapViewDirections
                  origin={pickup.location}
                  destination={destination.location}
                  apikey={GOOGLE_MAPS_API_KEY}
                  strokeWidth={4}
                  strokeColor="#4285F4"
                  onReady={fitToMarkers}
                />
              )}
            </MapView>

            <TouchableOpacity
              onPress={() =>
                mapRef.current?.animateToRegion({
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  latitudeDelta: LAT_DELTA,
                  longitudeDelta: LNG_DELTA,
                })
              }
              style={{
                position: "absolute",
                right: 16,
                top: 20,
                backgroundColor: colors.card,
                padding: 12,
                borderRadius: 30,
                shadowColor: "#000",
                shadowOpacity: 0.25,
                shadowRadius: 15,
                elevation: 12,
              }}
            >
              <MapPin color={colors.primary} size={20} />
            </TouchableOpacity>
          </View>

          <Card
            style={{
              marginTop: 20,
              marginHorizontal: 16,
              borderRadius: 28,
              padding: 20,
            }}
          >
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

            <Text style={{ color: colors.text, fontWeight: "600" }}>
              Pickup
            </Text>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 16,
                paddingHorizontal: 16,
                borderRadius: 18,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                marginTop: 6,
              }}
              onPress={() =>
                router.push({
                  pathname: "../pickupSearch",
                  params: {
                    destinationDesc: destination
                      ? encodeURIComponent(destination.description)
                      : undefined,
                    destinationLat: destination?.location.latitude,
                    destinationLng: destination?.location.longitude,
                  },
                })
              }
            >
              <Text style={{ flex: 1, color: colors.text }}>
                {pickup ? pickup.description : "Select pickup location"}
              </Text>
              <MapPin color={colors.primary} size={18} />
            </TouchableOpacity>

            <Text
              style={{ marginTop: 14, color: colors.text, fontWeight: "600" }}
            >
              Destination
            </Text>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 16,
                paddingHorizontal: 16,
                borderRadius: 18,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                marginTop: 6,
              }}
              onPress={() =>
                router.push({
                  pathname: "../destinationSearch",
                  params: {
                    pickupDesc: pickup
                      ? encodeURIComponent(pickup.description)
                      : undefined,
                    pickupLat: pickup?.location.latitude,
                    pickupLng: pickup?.location.longitude,
                  },
                })
              }
            >
              <Text style={{ flex: 1, color: colors.text }}>
                {destination ? destination.description : "Search destination"}
              </Text>
              <Search color={colors.text} size={18} />
            </TouchableOpacity>

            <View style={{ marginTop: 18 }}>
              <Button onPress={handleGo}>Show Rides</Button>
            </View>

            {pickup && destination && (
              <TouchableOpacity
                onPress={handleRequestRide}
                disabled={requestingRide}
                style={{
                  marginTop: 10,
                  padding: 14,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: "#1a3a6b",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  backgroundColor: "#f0f4ff",
                }}
              >
                {requestingRide ? (
                  <ActivityIndicator size="small" color="#1a3a6b" />
                ) : (
                  <>
                    <Text style={{ fontSize: 16 }}>🙋</Text>
                    <Text
                      style={{
                        color: "#1a3a6b",
                        fontWeight: "600",
                        fontSize: 14,
                      }}
                    >
                      Can't find a ride? Request one
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <Text
              style={{
                marginTop: 24,
                marginBottom: 10,
                color: colors.text,
                fontWeight: "600",
              }}
            >
              Recent Destinations
            </Text>

            <FlatList
              data={recentPlaces}
              scrollEnabled={false}
              keyExtractor={(i) => i.id}
              renderItem={({ item }) => (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 14,
                    marginBottom: 8,
                    backgroundColor: colors.card,
                    borderRadius: 18,
                  }}
                >
                  <TouchableOpacity
                    style={{ flexDirection: "row", flex: 1 }}
                    onPress={() => {
                      setDestination({
                        description: item.title,
                        location: item.location,
                      });
                      setDestinationIsCurrent(false);
                      setTimeout(fitToMarkers, 200);
                    }}
                  >
                    <Clock size={18} color={colors.text} />
                    <Text
                      style={{ flex: 1, marginLeft: 10, color: colors.text }}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      setRecentPlaces((prev) =>
                        prev.filter((p) => p.id !== item.id),
                      )
                    }
                  >
                    <Text style={{ color: "#FF3B30", fontWeight: "600" }}>
                      Remove
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
