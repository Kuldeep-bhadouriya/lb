# React Native Places Autocomplete

A lightweight, customizable, and easy-to-use Google Places Autocomplete component for React Native apps.  
Built using Google Places API for fast location search with minimal setup.

---

## ✨ Features

- 🔥 Lightweight and fast
- 🛠️ Fully customizable UI
- 🧠 Smart debounce (reduces API calls)
- 🌍 Supports additional Google Places API query parameters (language, components, sessiontoken, etc.)
- 🚀 Works out of the box for iOS and Android
- 📝 Written fully in TypeScript

---

## 📦 Installation

```bash
npm install @hammim-in/react-native-places-autocomplete
# or
yarn add @hammim-in/react-native-places-autocomplete
```

## Usage

```javascript
import PlacesAutocomplete from '@hammim-in/react-native-places-autocomplete';

export default function App() {
  return (
      <PlacesAutocomplete
        query={{
          language: 'en',              // Optional
          components: 'country:us',    // Optional
        }}
        placeholder="Search places..."
        onPress={(data) => {
          console.log('Selected Place:', data);
        }}
        apiKey='YOUR_GOOGLE_API_KEY' // Required
      />
  );
}
```
## 🛠️ Props

| Prop Name | Type | Required | Description |
|:----------|:-----|:---------|:------------|
| `apiKey` | `string` | ✅ Yes | Google Places API query configuration. Must include at least the API `key`. |
| `query` | `Query` |  ❌ No | Optional to filter search ressult. |
| `placeholder` | `string` | ❌ No | Placeholder text for the search input. Defaults to `"Search for places"`. |
| `onPress` | `(data: GooglePlaceData) => void` | ❌ No | Callback function triggered when a place is selected. |

## 📋 Query Object

The `query` prop expects an object with the following structure:

| Key | Type | Required | Description |
|:----|:-----|:---------|:------------|
| `language` | `string` | ❌ No | Preferred language for results. Example: `'en'`, `'fr'`. |
| `components` | `string` | ❌ No | Restrict results to a specific country. Example: `'country:us'`. |
| `sessiontoken` | `string` | ❌ No | (Optional) Session token for billing optimization. |
| ...and others (offset, location, radius, strictbounds, rankby) |

🔔 **Note:** `key` is mandatory; others are optional based on your use-case.

## 🎨 Customization

You can easily customize:

- Input field styles
- Loading indicator
- Result item styles
- Clear button (✖️)
- Debounce timing (default 500ms in code, editable)
- Placeholder text color and input text color

## 🚀 Advanced Usage

You can extend and modify the component for:

- Handling session tokens to optimize Google billing.
- Limiting to specific place types (e.g., addresses only).
- Adding your own custom render item for search results.
- Adding location bias with latitude/longitude.

## 🧩 Types

### `GooglePlaceData`
```ts
interface GooglePlaceData {
  description: string;
  id: string;
  place_id: string;
  reference: string;
}

interface Query {
  sessiontoken?: string;
  offset?: number;
  location?: string;
  radius?: number;
  components?: string;
  rankby?: string;
  language?: string;
  strictbounds?: boolean;
}

```

### Example for **Screenshots** section:

```markdown
## 📸 Screenshots

| Search Input | Search Results |
|:-------------|:---------------|
| ![Input Example](link-to-image-1) | ![Result Example](link-to-image-2) |

```

## 📄 License

MIT License © 2025 [Ham Mim](https://hammim.in)

## 🙌 Support

If you find any issues or have a feature request, feel free to [open an issue](https://github.com/hammim-in/react-native-places-autocomplete/issues).

Or contact: [support@hammim.in](mailto:support@hammim.in)

## 🚧 Future Improvements (Coming Soon)

- Customizable debounce delay
- Add current location ("Use my location") button
- Styling props for better theming
- Support reverse geocoding
- Localization for different languages
