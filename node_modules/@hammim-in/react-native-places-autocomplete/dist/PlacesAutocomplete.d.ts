import * as React from 'react';
import { StyleProp, ViewStyle, TextStyle } from 'react-native';
interface GooglePlacePrediction {
    description: string;
    place_id: string;
    reference: string;
    id: string;
    matched_substrings?: Array<{
        length: number;
        offset: number;
    }>;
    structured_formatting?: any;
    terms?: Array<{
        offset: number;
        value: number;
    }>;
    types?: Array<string>;
    result?: {
        address_components: Array<any>;
        geometry: {
            location: {
                lat: number;
                lng: number;
            };
        };
        formatted_address: string | any;
    };
}
interface PlacesQuery {
    sessiontoken?: string;
    offset?: number;
    location?: string;
    radius?: number;
    components?: string;
    rankby?: string;
    language?: string;
    strictbounds?: boolean;
}
interface PlacesAutocompleteProps {
    apiKey: string;
    query?: PlacesQuery;
    placeholder?: string;
    minLength?: number;
    debounce?: number;
    onPlaceSelected?: (place: GooglePlacePrediction) => void;
    styles?: {
        container?: StyleProp<ViewStyle>;
        inputRow?: StyleProp<ViewStyle>;
        textInput?: StyleProp<TextStyle>;
    };
    placeDetailsEnable: boolean;
}
declare const PlacesAutocomplete: React.FC<PlacesAutocompleteProps>;
export default PlacesAutocomplete;
