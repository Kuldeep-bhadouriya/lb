import React, { useEffect, useRef, useContext } from "react";
import { MapContext } from "react-native-maps";

export default function MapViewDirections({
  origin,
  destination,
  apikey,
  strokeWidth,
  strokeColor,
  onReady,
}: any) {
  const context = useContext(MapContext);
  const directionsRendererRef = useRef<any>(null);

  useEffect(() => {
    if (!context) return;
    const { map, google } = context;
    if (!map || !google) return;

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: strokeColor || "#4285F4",
        strokeWeight: strokeWidth || 4,
      },
    });

    directionsRendererRef.current = directionsRenderer;

    directionsService.route(
      {
        origin: { lat: origin.latitude, lng: origin.longitude },
        destination: { lat: destination.latitude, lng: destination.longitude },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (response: any, status: any) => {
        if (status === "OK" && response) {
          directionsRenderer.setDirections(response);
          if (onReady) {
            const route = response.routes[0];
            const leg = route.legs[0];
            onReady({
              distance: leg.distance.value / 1000,
              duration: leg.duration.value / 60,
              coordinates: route.overview_path.map((p: any) => ({
                latitude: p.lat(),
                longitude: p.lng(),
              })),
              fare: Math.round(leg.distance.value / 100), // Custom fallback if needed
            });
          }
        } else {
          console.warn("Google Maps Directions request failed: " + status);
        }
      }
    );

    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, [origin, destination, context]);

  return null;
}
