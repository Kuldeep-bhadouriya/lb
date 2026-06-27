import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Calendar,
  Clock,
  FileText,
  Hash,
  MapPin,
  Tag,
  Users,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "../../lib/apiFetch";
import { API_URL } from "../../lib/config";
import { useTheme } from "../../theme/ThemeContext";
import Button from "../components/Button";
import Card from "../components/Card";
import ScreenWrapper from "../components/ScreenWrapper";

const GOOGLE_MAPS_APIKEY = "AIzaSyCOxael8-m7OrNFz--Tlc2Bz3hjHK6jiIE";

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

export default function EditRide() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();

  const rideParamString = (params.ride as string) || undefined;
  const currentRideId =
    (params.ride ? JSON.parse(params.ride as string).id : undefined) ||
    params.rideId;

  const [pickup, setPickup] = useState<any>(null);
  const [destination, setDestination] = useState<any>(null);
  const [seats, setSeats] = useState("");
  const [rideNumber, setRideNumber] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [rideDateTime, setRideDateTime] = useState<Date | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [gender, setGender] = useState<string | null>(null);

  const [seatsError, setSeatsError] = useState("");
  const [priceError, setPriceError] = useState("");
  const [plateError, setPlateError] = useState("");

  useEffect(() => {
    if (!rideParamString) return;
    try {
      const ride = JSON.parse(rideParamString);
      setPickup({
        description: ride.pickup_desc,
        location: {
          latitude: Number(ride.pickup_lat),
          longitude: Number(ride.pickup_lng),
        },
      });
      setDestination({
        description: ride.destination_desc,
        location: {
          latitude: Number(ride.dest_lat),
          longitude: Number(ride.dest_lng),
        },
      });
      setSeats(String(ride.seats));
      setRideNumber(ride.ride_number);
      setPrice(ride.price || "");
      setNotes(ride.notes || "");
      setRideDateTime(new Date(ride.ride_datetime));
      setGender(ride.gender ?? null);
    } catch {}
  }, [rideParamString]);

  const applyReturned = useCallback(async () => {
    if (!currentRideId) return;

    try {
      const key = `edit_return_${currentRideId}`;
      const raw = await AsyncStorage.getItem(key);

      if (!raw) return;

      const payload = JSON.parse(raw);

      if (payload.type === "pickup") {
        setPickup({
          description: payload.desc,
          location: {
            latitude: Number(payload.lat),
            longitude: Number(payload.lng),
          },
        });
      } else if (payload.type === "destination") {
        setDestination({
          description: payload.desc,
          location: {
            latitude: Number(payload.lat),
            longitude: Number(payload.lng),
          },
        });
      }

      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn("Failed to apply returned edit selection", e);
    }
  }, [currentRideId]);

  useFocusEffect(
    useCallback(() => {
      applyReturned();
    }, [applyReturned]),
  );

  const handleSeatsChange = (text: string) => {
    if (!/^\d*$/.test(text)) return;
    setSeats(text);
    if (!text) {
      setSeatsError("");
      return;
    }
    const num = Number(text);
    if (num < 1) setSeatsError("Minimum 1 seat required");
    else if (num > 4) setSeatsError("Max 4 seats allowed");
    else setSeatsError("");
  };

  const handlePriceChange = (text: string) => {
    if (!/^\d*$/.test(text)) return;
    setPrice(text);
    if (!text) {
      setPriceError("");
      return;
    }
    const num = Number(text);
    if (num > 1000) setPriceError("Max price is ₹1000");
    else setPriceError("");
  };

  const handlePlateChange = (text: string) => {
    setRideNumber(text);
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

  const openPickupSearch = () =>
    router.push({
      pathname: "./editPickupSearch",
      params: {
        destinationDesc: destination
          ? encodeURIComponent(destination.description)
          : undefined,
        destinationLat: destination?.location.latitude,
        destinationLng: destination?.location.longitude,
        rideId: currentRideId,
      },
    });

  const openDestinationSearch = () =>
    router.push({
      pathname: "./editDestinationSearch",
      params: {
        pickupDesc: pickup ? encodeURIComponent(pickup.description) : undefined,
        pickupLat: pickup?.location.latitude,
        pickupLng: pickup?.location.longitude,
        rideId: currentRideId,
      },
    });

  const saveChanges = async () => {
    if (!pickup || !destination || !seats || !rideNumber) {
      return Alert.alert("Missing Fields", "Complete all required fields");
    }

    if (seatsError || priceError || plateError) {
      return Alert.alert(
        "Fix Errors",
        "Please fix the highlighted fields first",
      );
    }

    try {
      const token = await AsyncStorage.getItem("token");

      const res: any = await apiFetch(`${API_URL}/update-ride`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: currentRideId,
          pickup,
          destination,
          seats,
          rideNumber,
          price: price ? Number(price) : 0,
          notes: notes?.trim() ? notes : "Nothing Specified",
          rideDateTime: rideDateTime
            ? rideDateTime.toISOString().slice(0, 19).replace("T", " ")
            : null,
        }),
      });

      if (!res.success) {
        return Alert.alert("Error", res.message);
      }

      Alert.alert("Updated", "Ride updated successfully", [
        {
          text: "OK",
          onPress: () => router.replace("/home/Myrides"),
        },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update ride");
    }
  };

  return (
    <ScreenWrapper>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 140,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              color: colors.text,
              marginBottom: 20,
            }}
          >
            Edit Ride
          </Text>

          {pickup && destination && (
            <View
              style={{
                height: 260,
                borderRadius: 24,
                overflow: "hidden",
                marginBottom: 24,
                shadowColor: colors.shadow,
                shadowOpacity: 0.2,
                shadowRadius: 20,
                elevation: 8,
              }}
            >
              <MapView
                style={{ flex: 1 }}
                region={{
                  latitude: pickup.location.latitude,
                  longitude: pickup.location.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
              >
                <Marker coordinate={pickup.location} pinColor="blue" />
                <Marker coordinate={destination.location} pinColor="red" />
                <MapViewDirections
                  origin={pickup.location}
                  destination={destination.location}
                  apikey={GOOGLE_MAPS_APIKEY}
                  strokeWidth={4}
                  strokeColor={colors.primary}
                />
              </MapView>
            </View>
          )}

          <Card style={{ marginBottom: 24 }}>
            <Text style={[styles.label, { color: colors.text }]}>Pickup</Text>

            <TouchableOpacity
              style={[
                styles.inputRow,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={openPickupSearch}
            >
              <Text style={{ flex: 1, color: colors.text }}>
                {pickup ? pickup.description : "Pickup location"}
              </Text>
              <MapPin color={colors.primary} size={18} />
            </TouchableOpacity>

            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>
              Destination
            </Text>

            <TouchableOpacity
              style={[
                styles.inputRow,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={openDestinationSearch}
            >
              <Text style={{ flex: 1, color: colors.text }}>
                {destination ? destination.description : "Destination"}
              </Text>
              <MapPin color={colors.primary} size={18} />
            </TouchableOpacity>

            <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
              <TouchableOpacity
                style={[
                  styles.inlineInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: colors.text }}>
                  {rideDateTime ? rideDateTime.toLocaleDateString() : "Date"}
                </Text>
                <Calendar color={colors.primary} size={18} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.inlineInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={{ color: colors.text }}>
                  {rideDateTime
                    ? rideDateTime.toLocaleTimeString().slice(0, 5)
                    : "Time"}
                </Text>
                <Clock color={colors.primary} size={18} />
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 16 }}>
              <Text style={[styles.labelSmall, { color: colors.text }]}>
                Seats
              </Text>
              <View
                style={[
                  styles.textInputRow,
                  {
                    backgroundColor: colors.surface,
                    borderColor: seatsError ? "#ef4444" : colors.border,
                  },
                ]}
              >
                <TextInput
                  placeholder="Seats (1-4)"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.textInput, { color: colors.text }]}
                  keyboardType="numeric"
                  value={seats}
                  onChangeText={handleSeatsChange}
                />
                <Users
                  color={seatsError ? "#ef4444" : colors.primary}
                  size={18}
                />
              </View>
              <FieldError message={seatsError} />
            </View>

            <View style={{ marginTop: 16 }}>
              <Text style={[styles.labelSmall, { color: colors.text }]}>
                Ride Number
              </Text>
              <View
                style={[
                  styles.textInputRow,
                  {
                    backgroundColor: colors.surface,
                    borderColor: plateError ? "#ef4444" : colors.border,
                  },
                ]}
              >
                <TextInput
                  placeholder="Ride Number Plate"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.textInput, { color: colors.text }]}
                  value={rideNumber}
                  onChangeText={handlePlateChange}
                  autoCapitalize="characters"
                />
                <Hash
                  color={plateError ? "#ef4444" : colors.primary}
                  size={18}
                />
              </View>
              <FieldError message={plateError} />
            </View>

            <View style={{ marginTop: 16 }}>
              <Text style={[styles.labelSmall, { color: colors.text }]}>
                Price (Optional)
              </Text>
              <View
                style={[
                  styles.textInputRow,
                  {
                    backgroundColor: colors.surface,
                    borderColor: priceError ? "#ef4444" : colors.border,
                  },
                ]}
              >
                <TextInput
                  placeholder="Price (Optional, Max ₹1000)"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.textInput, { color: colors.text }]}
                  keyboardType="numeric"
                  value={price}
                  onChangeText={handlePriceChange}
                />
                <Tag
                  color={priceError ? "#ef4444" : colors.primary}
                  size={18}
                />
              </View>
              <FieldError message={priceError} />
            </View>

            <View style={{ marginTop: 16 }}>
              <Text style={[styles.labelSmall, { color: colors.text }]}>
                Notes
              </Text>
              <View
                style={[
                  styles.textAreaRow,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <TextInput
                  placeholder="Notes"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.textArea, { color: colors.text }]}
                  multiline
                  value={notes}
                  onChangeText={setNotes}
                />
                <FileText color={colors.primary} size={18} />
              </View>
            </View>
          </Card>

          <Button onPress={saveChanges}>Save Changes</Button>
        </ScrollView>

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
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  labelSmall: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  inputRow: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  inlineInput: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textInputRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    padding: 0,
  },
  textAreaRow: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  textArea: {
    flex: 1,
    minHeight: 80,
    textAlignVertical: "top",
    padding: 0,
  },
});
