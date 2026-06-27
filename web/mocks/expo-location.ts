export enum Accuracy {
  Lowest = 1,
  Low = 2,
  Balanced = 3,
  High = 4,
  Highest = 5,
  BestForNavigation = 6,
}

export async function requestForegroundPermissionsAsync() {
  return { status: "granted" };
}

export async function getCurrentPositionAsync(options: any = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      resolve({
        coords: {
          latitude: 26.2183,
          longitude: 78.1828,
        },
      });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed,
          },
          timestamp: position.timestamp,
        });
      },
      (error) => {
        // Fallback to Gwalior coordinates if user blocks location
        resolve({
          coords: {
            latitude: 26.2183,
            longitude: 78.1828,
          },
        });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

// Simple lookup database for Gwalior regions to make reverseGeocodeAsync return realistic results
export async function reverseGeocodeAsync(coords: { latitude: number; longitude: number }) {
  // Approximate standard response
  // If near Sithouli:
  const lat = coords.latitude;
  const lng = coords.longitude;

  if (Math.abs(lat - 26.1473717) < 0.01 && Math.abs(lng - 78.1880359) < 0.01) {
    return [
      {
        name: "ITM University",
        street: "Sithouli Campus, NH-75",
        city: "Gwalior",
        region: "Madhya Pradesh",
        country: "India",
      },
    ];
  }

  return [
    {
      name: "Gwalior Region",
      street: "Gwalior Road",
      city: "Gwalior",
      region: "Madhya Pradesh",
      country: "India",
    },
  ];
}

export async function geocodeAsync(address: string) {
  // Return a fallback coordinate for Gwalior area
  return [
    {
      latitude: 26.2183,
      longitude: 78.1828,
      altitude: null,
      accuracy: null,
    },
  ];
}

export async function watchPositionAsync(
  options: any,
  callback: (location: any) => void
) {
  if (!navigator.geolocation) {
    return { remove: () => {} };
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      callback({
        coords: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
        },
        timestamp: position.timestamp,
      });
    },
    (error) => {
      console.warn("Location watch error:", error.message);
    },
    {
      enableHighAccuracy: options?.accuracy === Accuracy.High || options?.accuracy === Accuracy.Highest,
      maximumAge: options?.timeInterval || 5000,
      timeout: 10000,
    }
  );

  return {
    remove: () => {
      navigator.geolocation.clearWatch(watchId);
    },
  };
}
