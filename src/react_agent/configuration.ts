/**
 * Define the configurable parameters for the agent.
 */
import { Annotation } from "@langchain/langgraph";
import { SYSTEM_PROMPT_TEMPLATE } from "./prompts.js";
import { RunnableConfig } from "@langchain/core/runnables";

// Mock data for testing
export const MOCK_HOTELS = [
  {
    id: "h1",
    name: "Luxury Palace Hotel",
    location: "Downtown",
    price: 300,
    rating: 4.8,
    amenities: ["Pool", "Spa", "Restaurant", "Gym"],
    roomTypes: ["Standard", "Deluxe", "Suite"],
    availability: true,
  },
  {
    id: "h2",
    name: "Seaside Resort",
    location: "Beach Front",
    price: 250,
    rating: 4.5,
    amenities: ["Beach Access", "Pool", "Restaurant"],
    roomTypes: ["Standard", "Ocean View"],
    availability: true,
  },
];

export const MOCK_TAXI_SERVICES = [
  {
    id: "t1",
    type: "Standard",
    baseRate: 10,
    perHourRate: 30,
    perKmRate: 2,
    availability: true,
  },
  {
    id: "t2",
    type: "Premium",
    baseRate: 15,
    perHourRate: 45,
    perKmRate: 3,
    availability: true,
  },
];

// Define agent configuration type
type AgentConfig = {
  enabled: boolean;
  model: string;
};

export const ConfigurationSchema = Annotation.Root({
  /**
   * The system prompt to be used by the agent.
   */
  systemPromptTemplate: Annotation<string>,

  /**
   * The name of the language model to be used by the agent.
   */
  model: Annotation<string>,

  /**
   * Agent-specific configurations
   */
  agents: Annotation<{
    itinerary: AgentConfig;
    hotel: AgentConfig;
    taxi: AgentConfig;
  }>,
});

export function ensureConfiguration(
  config: RunnableConfig
): typeof ConfigurationSchema.State {
  /**
   * Ensure the defaults are populated.
   */
  const configurable = config.configurable ?? {};
  return {
    systemPromptTemplate:
      configurable.systemPromptTemplate ?? SYSTEM_PROMPT_TEMPLATE,
    model: configurable.model ?? "gpt-4-turbo-preview",
    agents: {
      itinerary: {
        enabled: true,
        model: "gpt-4-turbo-preview",
      },
      hotel: {
        enabled: true,
        model: "gpt-4-turbo-preview",
      },
      taxi: {
        enabled: true,
        model: "gpt-4-turbo-preview",
      },
    },
  };
}
