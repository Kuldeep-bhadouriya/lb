import React, { useState, useEffect, useRef } from "react";
import { View, TextInput, Text, TouchableOpacity, ActivityIndicator } from "react-native";

export default function PlacesAutocomplete({
  placeholder,
  apiKey,
  query,
  onPlaceSelected,
  styles,
}: any) {
  const [inputVal, setInputVal] = useState("");
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initService = () => {
      try {
        const g = (window as any).google;
        if (g?.maps?.places) {
          autocompleteService.current = new g.maps.places.AutocompleteService();
          const dummy = document.createElement("div");
          placesService.current = new g.maps.places.PlacesService(dummy);
        }
      } catch (e) {
        console.error("Failed to init Google Places Autocomplete service:", e);
      }
    };

    if ((window as any).google?.maps?.places) {
      initService();
    } else {
      const scriptId = "google-maps-places-script";
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => initService();
        document.head.appendChild(script);
      } else {
        const interval = setInterval(() => {
          if ((window as any).google?.maps?.places) {
            clearInterval(interval);
            initService();
          }
        }, 300);
        return () => clearInterval(interval);
      }
    }
  }, [apiKey]);

  const handleTextChange = (text: string) => {
    setInputVal(text);
    if (!text.trim() || !autocompleteService.current) {
      setPredictions([]);
      return;
    }

    setLoading(true);
    autocompleteService.current.getPlacePredictions(
      {
        input: text,
        componentRestrictions: { country: "in" },
        ...query,
      },
      (results: any, status: any) => {
        setLoading(false);
        if (status === "OK" && results) {
          setPredictions(results);
        } else {
          setPredictions([]);
        }
      }
    );
  };

  const handleSelectPrediction = (prediction: any) => {
    setInputVal(prediction.description);
    setPredictions([]);

    if (placesService.current) {
      setLoading(true);
      placesService.current.getDetails(
        { placeId: prediction.place_id, fields: ["geometry", "formatted_address"] },
        (result: any, status: any) => {
          setLoading(false);
          if (status === "OK" && result) {
            onPlaceSelected({
              description: prediction.description,
              details: {
                geometry: {
                  location: {
                    lat: result.geometry.location.lat(),
                    lng: result.geometry.location.lng(),
                  },
                },
              },
            });
          }
        }
      );
    } else {
      onPlaceSelected({
        description: prediction.description,
        details: null,
      });
    }
  };

  return (
    <View style={{ width: "100%", position: "relative" }}>
      <TextInput
        style={styles?.textInput}
        placeholder={placeholder}
        value={inputVal}
        onChangeText={handleTextChange}
      />
      {loading && (
        <ActivityIndicator
          size="small"
          color="#3b82f6"
          style={{ position: "absolute", right: 12, top: 12 }}
        />
      )}
      {predictions.length > 0 && (
        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "#e2e8f0",
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 5,
            marginTop: 6,
            maxHeight: 220,
            overflow: "auto",
            zIndex: 99999,
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
          }}
        >
          {predictions.map((p) => (
            <TouchableOpacity
              key={p.place_id}
              onPress={() => handleSelectPrediction(p)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#f1f5f9",
              }}
            >
              <Text style={{ fontSize: 14, color: "#334155" }}>
                {p.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
