import React, {
  createContext,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { GOOGLE_MAPS_API_KEY } from "../../lib/config";
import { loadGoogleMaps } from "./googleMapsLoader";

export const MapContext = createContext<any>(null);

const MapView = React.forwardRef(function MapView(
  { style, initialRegion, children, onPress }: any,
  ref: any
) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [google, setGoogle] = useState<any>(null);
  const [markers, setMarkers] = useState<Record<string, any>>({});

  const registerMarker = (id: string, latLng: { latitude: number; longitude: number }) => {
    setMarkers((prev) => ({ ...prev, [id]: latLng }));
  };

  const unregisterMarker = (id: string) => {
    setMarkers((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  useImperativeHandle(ref, () => ({
    fitToSuppliedMarkers: (markerIds: string[]) => {
      if (!map || !google) return;
      const bounds = new google.maps.LatLngBounds();
      let count = 0;

      markerIds.forEach((id) => {
        const coord = markers[id];
        if (coord) {
          bounds.extend(new google.maps.LatLng(coord.latitude, coord.longitude));
          count++;
        }
      });

      if (count > 0) {
        map.fitBounds(bounds);
        // Add padding
        const listener = google.maps.event.addListenerOnce(map, "bounds_changed", () => {
          if (map.getZoom() > 15) map.setZoom(15);
        });
        setTimeout(() => google.maps.event.removeListener(listener), 1000);
      }
    },
    animateToRegion: (region: any) => {
      if (!map || !google) return;
      map.panTo(new google.maps.LatLng(region.latitude, region.longitude));
      map.setZoom(14);
    },
  }));

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initMap = () => {
      const g = (window as any).google;
      setGoogle(g);
      if (!mapContainerRef.current) return;

      const defaultLat = initialRegion?.latitude || 26.2183;
      const defaultLng = initialRegion?.longitude || 78.1828;

      const m = new g.maps.Map(mapContainerRef.current, {
        center: { lat: defaultLat, lng: defaultLng },
        zoom: 13,
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });

      if (onPress) {
        m.addListener("click", (e: any) => {
          onPress({
            nativeEvent: {
              coordinate: {
                latitude: e.latLng.lat(),
                longitude: e.latLng.lng(),
              },
            },
          });
        });
      }

      setMap(m);
    };

    if ((window as any).google?.maps) {
      initMap();
    } else {
      loadGoogleMaps(GOOGLE_MAPS_API_KEY)
        .then(() => initMap())
        .catch((error) => {
          console.error("Failed to load Google Maps:", error);
        });
    }
  }, []);

  return (
    <div ref={mapContainerRef} style={{ width: "100%", height: "100%", ...style }}>
      <MapContext.Provider value={{ map, google, registerMarker, unregisterMarker }}>
        {map && children}
      </MapContext.Provider>
    </div>
  );
});

export default MapView;

export function Marker({ coordinate, pinColor, identifier }: any) {
  const context = useContext(MapContext);
  const markerRef = useRef<any>(null);
  const id = identifier || `${coordinate.latitude}-${coordinate.longitude}`;

  useEffect(() => {
    if (!context) return;
    const { map, google, registerMarker, unregisterMarker } = context;
    if (!map || !google) return;

    registerMarker(id, coordinate);

    const m = new google.maps.Marker({
      position: { lat: coordinate.latitude, lng: coordinate.longitude },
      map: map,
      title: id,
      icon: pinColor === "blue" ? "https://maps.google.com/mapfiles/ms/icons/blue-dot.png" : undefined,
    });

    markerRef.current = m;

    return () => {
      unregisterMarker(id);
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [coordinate, context]);

  return null;
}

export function Polyline({ coordinates, strokeColor, strokeWidth }: any) {
  const context = useContext(MapContext);
  const polylineRef = useRef<any>(null);

  useEffect(() => {
    if (!context) return;
    const { map, google } = context;
    if (!map || !google) return;

    const path = coordinates.map((c: any) => ({ lat: c.latitude, lng: c.longitude }));
    const p = new google.maps.Polyline({
      path: path,
      geodesic: true,
      strokeColor: strokeColor || "#4285F4",
      strokeOpacity: 1.0,
      strokeWeight: strokeWidth || 4,
      map: map,
    });

    polylineRef.current = p;

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [coordinates, context]);

  return null;
}
export type LatLng = { latitude: number; longitude: number };
