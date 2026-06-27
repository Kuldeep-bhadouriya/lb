import PlacesAutocomplete from "@hammim-in/react-native-places-autocomplete";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Keyboard,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { MapPressEvent, Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GOOGLE_MAPS_API_KEY } from "../../lib/config";

import { useTheme } from "../../theme/ThemeContext";
import Button from "../components/Button";
import Card from "../components/Card";
import ScreenWrapper from "../components/ScreenWrapper";

export default function EditPickupSearch() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const rideId = (params?.rideId as string) || "unknown";

  const [locating, setLocating] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);

  const [selectedPlace, setSelectedPlace] = useState<{
    desc: string;
    lat: number;
    lng: number;
  } | null>(null);

  const [mapMarker, setMapMarker] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  React.useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });

    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const animateToggle = (showMap: boolean) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(slideAnim, {
        toValue: 20,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMapVisible(showMap);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleSelect = (data: any) => {
    try {
      const desc =
        data?.description ||
        data?.result?.formatted_address ||
        data?.structured_formatting?.main_text ||
        "Selected Location";

      const lat =
        data?.details?.geometry?.location?.lat ||
        data?.result?.geometry?.location?.lat ||
        null;

      const lng =
        data?.details?.geometry?.location?.lng ||
        data?.result?.geometry?.location?.lng ||
        null;

      if (!lat || !lng) {
        Alert.alert("Error", "Could not retrieve coordinates.");
        return;
      }

      setSelectedPlace({ desc, lat, lng });
    } catch {
      Alert.alert("Error", "Something went wrong while selecting the place.");
    }
  };

  const saveAndReturn = async (payload: any) => {
    try {
      await AsyncStorage.setItem(
        `edit_return_${rideId}`,
        JSON.stringify(payload),
      );

      router.back();
    } catch {
      Alert.alert("Error", "Unable to return selection.");
    }
  };

  const confirmSelection = async () => {
    if (!selectedPlace) return;

    const { desc, lat, lng } = selectedPlace;

    await saveAndReturn({
      type: "pickup",
      desc,
      lat,
      lng,
      isCurrent: false,
    });
  };

  const useCurrentLocation = async () => {
    setLocating(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission denied", "Allow location access.");
        setLocating(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({});
      const coords = pos.coords;

      const [place] = await Location.reverseGeocodeAsync(coords);

      const desc =
        [place.name, place.street, place.city, place.region]
          .filter(Boolean)
          .join(", ") || "Current Location";

      await saveAndReturn({
        type: "pickup",
        desc,
        lat: coords.latitude,
        lng: coords.longitude,
        isCurrent: true,
      });
    } catch {
      Alert.alert("Error", "Unable to fetch location.");
    } finally {
      setLocating(false);
    }
  };

  const handleMapPress = (e: MapPressEvent) => {
    setMapMarker(e.nativeEvent.coordinate);
  };

  const confirmMapLocation = async () => {
    if (!mapMarker) return;

    try {
      const coords = mapMarker;

      const [place] = await Location.reverseGeocodeAsync(coords);

      const desc =
        [place.name, place.street, place.city, place.region]
          .filter(Boolean)
          .join(", ") || "Selected location";

      await saveAndReturn({
        type: "pickup",
        desc,
        lat: coords.latitude,
        lng: coords.longitude,
        isCurrent: false,
      });
    } catch {
      Alert.alert("Error", "Unable to reverse geocode this location.");
    }
  };

  return (
    <ScreenWrapper>
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {!mapVisible ? (
          <View style={{ padding: 20 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "700",
                color: colors.text,
                marginBottom: 20,
              }}
            >
              Set Pickup Location
            </Text>

            <Card style={{ padding: 16, borderRadius: 24 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 8,
                }}
              >
                <View style={{ flex: 1, overflow: "hidden" }}>
                  <PlacesAutocomplete
                    placeholder="Search pickup location"
                    apiKey={GOOGLE_MAPS_API_KEY}
                    query={{ language: "en", components: "country:in" }}
                    onPlaceSelected={handleSelect}
                    placeDetailsEnable={true}
                    styles={{
                      container: { flex: 0 },
                      inputRow: { paddingRight: 0 },
                      textInput: {
                        borderWidth: 0,
                        fontSize: 16,
                        color: colors.text,
                      },
                    }}
                  />
                </View>
                <TouchableOpacity
                  disabled={!selectedPlace}
                  onPress={confirmSelection}
                  style={{
                    backgroundColor: selectedPlace
                      ? colors.primary
                      : colors.border,
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ color: colors.background, fontWeight: "600" }}>
                    Go
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <MapView
              style={{ flex: 1 }}
              initialRegion={{
                latitude: 26.2123,
                longitude: 78.1762,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              onPress={handleMapPress}
            >
              {mapMarker && <Marker coordinate={mapMarker} pinColor="blue" />}
            </MapView>

            {mapMarker && (
              <Button onPress={confirmMapLocation} style={{ margin: 20 }}>
                Confirm Pickup
              </Button>
            )}
          </View>
        )}
      </Animated.View>

      <Card
        style={{
          marginHorizontal: 20,
          marginBottom:
            keyboardHeight > 0
              ? keyboardHeight - insets.bottom + 20
              : 20 + insets.bottom,
          borderRadius: 24,
          paddingVertical: 14,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
          <TouchableOpacity onPress={() => animateToggle(!mapVisible)}>
            <Text style={{ color: colors.primary, fontWeight: "600" }}>
              {mapVisible ? "Back to Search" : "Choose from Map"}
            </Text>
          </TouchableOpacity>

        </View>
      </Card>
    </ScreenWrapper>
  );
}
