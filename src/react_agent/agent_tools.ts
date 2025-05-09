import { Tool } from "@langchain/core/tools";
import { MOCK_TAXI_SERVICES, MOCK_HOTELS } from "./configuration.js";

// Hotel API interface
interface HotelVendor {
  price1?: string;
  tax1?: string;
  vendor1?: string;
  price2?: string;
  tax2?: string;
  vendor2?: string;
  price3?: string;
  tax3?: string;
  vendor3?: string;
  price4?: string;
  tax4?: string;
  vendor4?: string;
}

interface HotelInfo {
  hotelName: string;
  hotelId: string;
}

interface HotelResponse {
  hotelInfo: HotelInfo;
  vendors: HotelVendor;
}

// Hotel Selector Agent Tools
export class SearchHotelsTools extends Tool {
  name = "search_hotels";
  description =
    "Search for hotels in a specific city. Input should be a city name.";

  async _call(input: string): Promise<string> {
    // Ignore input and always return the mock hotels for the Bitcoin conference
    return JSON.stringify(MOCK_HOTELS);
  }
}

export class CheckHotelAvailabilityTool extends Tool {
  name = "check_hotel_availability";
  description =
    "Check pricing and availability for a specific hotel. Input should be a JSON string with hotelId.";

  async _call(input: string): Promise<string> {
    try {
      const { hotelId } = JSON.parse(input);

      // Note: The free API doesn't support direct hotel ID lookup
      // In a production environment, you would use the premium API for this
      // For now, we'll return a simplified response
      return JSON.stringify({
        available: true,
        message:
          "Note: This is using the free API which doesn't support real-time availability. For accurate availability, please upgrade to the premium API.",
      });
    } catch (error) {
      console.error("Error checking hotel availability:", error);
      return JSON.stringify({
        error: "Failed to check hotel availability. Please try again.",
      });
    }
  }
}

// Taxi Agent Tools
export class SearchTaxiServicesTool extends Tool {
  name = "search_taxi_services";
  description =
    "Search for available taxi services based on type and requirements";

  async _call(input: string): Promise<string> {
    return JSON.stringify(MOCK_TAXI_SERVICES);
  }
}

export class CalculateTaxiFareTool extends Tool {
  name = "calculate_taxi_fare";
  description = "Calculate estimated taxi fare based on selected service";

  async _call(input: string): Promise<string> {
    const { serviceId } = JSON.parse(input);
    const service = MOCK_TAXI_SERVICES.find((t) => t.id === serviceId);

    if (!service) {
      return JSON.stringify({ error: "Service not found" });
    }

    return JSON.stringify({
      serviceId: service.id,
      type: service.type,
      price: service.price,
      availability: service.availability,
      totalFare: service.price,
    });
  }
}

// Itinerary Agent Tools
export class CreateItineraryTool extends Tool {
  name = "create_itinerary";
  description = "Create a new travel itinerary with specified details";

  async _call(input: string): Promise<string> {
    const itinerary = {
      id: "itin_" + Date.now(),
      ...JSON.parse(input),
      status: "created",
    };
    return JSON.stringify(itinerary);
  }
}

export class UpdateItineraryTool extends Tool {
  name = "update_itinerary";
  description = "Update an existing travel itinerary";

  async _call(input: string): Promise<string> {
    const updates = JSON.parse(input);
    return JSON.stringify({
      id: updates.id,
      status: "updated",
      ...updates,
    });
  }
}

// Export tool instances
export const HOTEL_TOOLS = [
  new SearchHotelsTools(),
  new CheckHotelAvailabilityTool(),
];

export const TAXI_TOOLS = [
  new SearchTaxiServicesTool(),
  new CalculateTaxiFareTool(),
];

export const ITINERARY_TOOLS = [
  new CreateItineraryTool(),
  new UpdateItineraryTool(),
];
