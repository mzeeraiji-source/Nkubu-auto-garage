/**
 * Google Maps Service
 * Location services and garage location finder
 */

class GoogleMapsService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  }

  /**
   * Get garage location
   */
  async getGarageLocation(address: string): Promise<{
    success: boolean;
    latitude?: number;
    longitude?: number;
    error?: string;
  }> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&key=${this.apiKey}`
      );

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          success: true,
          latitude: location.lat,
          longitude: location.lng,
        };
      }

      return {
        success: false,
        error: 'Location not found',
      };
    } catch (error) {
      console.error('Google Maps error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get location',
      };
    }
  }

  /**
   * Calculate distance between two points
   */
  async calculateDistance(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
  ): Promise<{
    success: boolean;
    distance?: number;
    duration?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&key=${this.apiKey}`
      );

      const data = await response.json();

      if (data.rows && data.rows.length > 0) {
        const element = data.rows[0].elements[0];
        return {
          success: true,
          distance: element.distance.value / 1000, // Convert to km
          duration: element.duration.text,
        };
      }

      return {
        success: false,
        error: 'Could not calculate distance',
      };
    } catch (error) {
      console.error('Distance calculation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate distance',
      };
    }
  }
}

export const googleMapsService = new GoogleMapsService();