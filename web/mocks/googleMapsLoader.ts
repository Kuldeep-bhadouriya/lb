let loaderPromise: Promise<any> | null = null;

export function loadGoogleMaps(apiKey: string, libraries: string[] = []) {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  const googleMaps = (window as any).google?.maps;
  if (googleMaps) {
    return Promise.resolve((window as any).google);
  }

  if (loaderPromise) {
    return loaderPromise;
  }

  const scriptId = "google-maps-js";
  const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
  const libraryParam = libraries.length ? `&libraries=${libraries.join(",")}` : "";
  const src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}${libraryParam}`;

  loaderPromise = new Promise((resolve, reject) => {
    const finish = () => {
      const loadedGoogle = (window as any).google;
      if (loadedGoogle?.maps) {
        resolve(loadedGoogle);
      } else {
        reject(new Error("Google Maps API failed to initialize."));
      }
    };

    if (existingScript) {
      existingScript.addEventListener("load", finish, { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Google Maps script failed to load.")),
        { once: true },
      );

      const waitUntilReady = window.setInterval(() => {
        if ((window as any).google?.maps) {
          window.clearInterval(waitUntilReady);
          finish();
        }
      }, 200);
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = finish;
    script.onerror = () => reject(new Error("Google Maps script failed to load."));
    document.head.appendChild(script);
  }).catch((error) => {
    loaderPromise = null;
    throw error;
  });

  return loaderPromise;
}
