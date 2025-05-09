/**
 * Define the configurable parameters for the agent.
 */
import { Annotation } from "@langchain/langgraph";
import { SYSTEM_PROMPT_TEMPLATE } from "./prompts.js";
import { RunnableConfig } from "@langchain/core/runnables";

// Mock data for testing
export const MOCK_HOTELS = [
  { id: "h1", name: "Treasure Island", price: 91, availability: true },
  {
    id: "h2",
    name: "The LINQ Hotel and Casino",
    price: 318,
    availability: true,
  },
  {
    id: "h3",
    name: "The Westin Las Vegas Hotel & Spa",
    price: 318,
    availability: true,
  },
  { id: "h4", name: "The Platinum Hotel", price: 358, availability: true },
  {
    id: "h5",
    name: "Renaissance Las Vegas Hotel",
    price: 254,
    availability: true,
  },
  {
    id: "h6",
    name: "Princess Suite Platinum Hotel",
    price: 237,
    availability: true,
  },
  {
    id: "h7",
    name: "Paris Las Vegas Hotel & Casino",
    price: 138,
    availability: true,
  },
  {
    id: "h8",
    name: "Planet Hollywood Resort & Casino",
    price: 74,
    availability: true,
  },
  { id: "h9", name: "Five Star Trump Hotel", price: 288, availability: true },
  {
    id: "h10",
    name: "Jet Luxury at The Signature Condo Hotel",
    price: 108,
    availability: true,
  },
  {
    id: "h11",
    name: "The Signature at MGM Grand",
    price: 218,
    availability: true,
  },
];

export const MOCK_TAXI_SERVICES = [
  { id: "t1", type: "UberX", price: 11.97, availability: true },
  { id: "t2", type: "UberXL", price: 25.67, availability: true },
  { id: "t3", type: "Premier SUV", price: 43.13, availability: true },
  { id: "t4", type: "Comfort Electric", price: 20.05, availability: true },
  { id: "t5", type: "Comfort", price: 16.46, availability: true },
  { id: "t6", type: "Platinum", price: 87.61, availability: true },
  { id: "t7", type: "Platinum SUV", price: 96.36, availability: true },
  { id: "t8", type: "Premier", price: 35.04, availability: true },
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
