import { Tool } from "@langchain/core/tools";
import { MOCK_HOTELS, MOCK_TAXI_SERVICES } from "./configuration.js";

// Hotel Selector Agent Tools
export class SearchHotelsTools extends Tool {
  name = "search_hotels";
  description =
    "Search for hotels based on criteria like location, price range, and amenities";

  async _call(input: string): Promise<string> {
    // Mock implementation using MOCK_HOTELS
    return JSON.stringify(MOCK_HOTELS);
  }
}

export class CheckHotelAvailabilityTool extends Tool {
  name = "check_hotel_availability";
  description = "Check if a specific hotel has rooms available for given dates";

  async _call(input: string): Promise<string> {
    const hotelId = JSON.parse(input).hotelId;
    const hotel = MOCK_HOTELS.find((h) => h.id === hotelId);
    return JSON.stringify({ available: hotel?.availability ?? false });
  }
}

// Taxi Agent Tools
export class SearchTaxiServicesTool extends Tool {
  name = "search_taxi_services";
  description =
    "Search for available taxi services based on type and requirements";

  async _call(input: string): Promise<string> {
    // Mock implementation using MOCK_TAXI_SERVICES
    return JSON.stringify(MOCK_TAXI_SERVICES);
  }
}

export class CalculateTaxiFareTool extends Tool {
  name = "calculate_taxi_fare";
  description = "Calculate estimated taxi fare based on distance or duration";

  async _call(input: string): Promise<string> {
    const { serviceId, hours, distance } = JSON.parse(input);
    const service = MOCK_TAXI_SERVICES.find((t) => t.id === serviceId);

    if (!service) {
      return JSON.stringify({ error: "Service not found" });
    }

    const hourlyCharge = hours ? hours * service.perHourRate : 0;
    const distanceCharge = distance ? distance * service.perKmRate : 0;
    const totalFare = service.baseRate + hourlyCharge + distanceCharge;

    return JSON.stringify({
      baseRate: service.baseRate,
      hourlyCharge,
      distanceCharge,
      totalFare,
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
