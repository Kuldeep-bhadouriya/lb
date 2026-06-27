export const MediaTypeOptions = {
  All: "All",
  Videos: "Videos",
  Images: "Images",
};

export const UIImagePickerPreferredAssetRepresentationMode = {
  Automatic: "automatic",
  Current: "current",
  Compatible: "compatible",
};

export async function requestMediaLibraryPermissionsAsync() {
  return { status: "granted", granted: true };
}

export async function requestCameraPermissionsAsync() {
  return { status: "granted", granted: true };
}

export async function launchCameraAsync(options: any = {}) {
  // On web, fallback to file picker with capture attribute
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.setAttribute("capture", "environment");
    input.style.display = "none";
    document.body.appendChild(input);

    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      document.body.removeChild(input);
      if (!file) {
        resolve({ canceled: true, assets: null });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          canceled: false,
          assets: [{ uri: reader.result, width: 500, height: 500 }],
        });
      };
      reader.readAsDataURL(file);
    };

    input.click();
  });
}

export async function launchImageLibraryAsync(options: any = {}) {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";
    document.body.appendChild(input);

    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      document.body.removeChild(input);
      if (!file) {
        resolve({ canceled: true, assets: null });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          canceled: false,
          assets: [
            {
              uri: reader.result,
              width: 500,
              height: 500,
            },
          ],
        });
      };
      reader.readAsDataURL(file);
    };

    // Cancel callback helper
    window.addEventListener(
      "focus",
      () => {
        setTimeout(() => {
          if (!input.files || input.files.length === 0) {
            if (document.body.contains(input)) {
              document.body.removeChild(input);
            }
            resolve({ canceled: true, assets: null });
          }
        }, 1000);
      },
      { once: true }
    );

    input.click();
  });
}
