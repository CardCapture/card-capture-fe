declare global {
  interface Window {
    google: {
      maps: {
        places: {
          AutocompleteService: new () => google.maps.places.AutocompleteService;
          PlacesService: new (container: HTMLElement) => google.maps.places.PlacesService;
          PlacesServiceStatus: {
            OK: string;
          };
        };
      };
    };
  }
}

declare namespace google.maps.places {
  interface AutocompletePrediction {
    description: string;
    place_id: string;
    types: string[];
  }

  interface AutocompleteService {
    getPlacePredictions(
      request: {
        input: string;
        types?: string[];
        componentRestrictions?: { country: string };
      },
      callback: (predictions: AutocompletePrediction[] | null, status: string) => void
    ): void;
  }

  interface PlaceResult {
    address_components?: AddressComponent[];
    formatted_address?: string;
  }

  interface AddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
  }

  interface PlacesService {
    getDetails(
      request: {
        placeId: string;
        fields: string[];
      },
      callback: (place: PlaceResult | null, status: string) => void
    ): void;
  }

  interface PlacesServiceStatus {
    OK: string;
  }
}

export {};