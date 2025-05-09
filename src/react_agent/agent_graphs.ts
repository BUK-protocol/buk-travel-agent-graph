import {
  AIMessage,
  BaseMessage,
  MessageContentComplex,
} from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { ConfigurationSchema, ensureConfiguration } from "./configuration.js";
import { HOTEL_TOOLS, TAXI_TOOLS } from "./agent_tools.js";
import { loadChatModel } from "./utils.js";

const DEFAULT_TIMEOUT = 60000; // 60 seconds

// Helper function to validate state
function validateState(state: any): state is typeof MessagesAnnotation.State {
  return (
    state &&
    typeof state === "object" &&
    "messages" in state &&
    Array.isArray(state.messages)
  );
}

// Helper function to check if a message indicates task completion
function isTaskComplete(message: BaseMessage): boolean {
  const content = getMessageContent(message).toLowerCase();
  return (
    content.includes("task complete") ||
    content.includes("booking confirmed") ||
    content.includes("completed") ||
    content.includes("finished")
  );
}

// Coordinator agent system prompt
const COORDINATOR_PROMPT = `You are a travel service coordinator. Your role is to:
1. Understand user requests and direct them to the appropriate specialized agent:
   - Hotel Agent: For hotel bookings and inquiries
   - Taxi Agent: For taxi/transportation arrangements
2. Do NOT try to handle bookings yourself
3. Simply identify if the request is about:
   - Hotels/accommodation -> Route to Hotel Agent
   - Taxi/transportation -> Route to Taxi Agent
4. If the request is unclear, ask for clarification
5. Once you've identified the appropriate agent, indicate this with "Routing to [agent type]..."
6. End your response with "task complete" when you've determined the routing

Example responses:
- "This seems to be a hotel booking request. Routing to Hotel Agent... task complete"
- "I'll connect you with our Taxi Agent for transportation. Routing to Taxi Agent... task complete"
- "Could you please clarify if you're looking for hotel booking or transportation arrangements?"

Remember: Your job is ONLY to route requests, not to handle them directly.`;

// Helper function to create model caller for each agent
function createModelCaller(agentType: "coordinator" | "hotel" | "taxi") {
  return async function callModel(
    state: typeof MessagesAnnotation.State,
    config: RunnableConfig
  ): Promise<typeof MessagesAnnotation.Update> {
    try {
      if (!validateState(state)) {
        throw new Error("Invalid state object");
      }

      const configuration = ensureConfiguration(config);
      const agentConfig =
        configuration.agents[
          agentType === "coordinator" ? "itinerary" : agentType
        ];

      if (!agentConfig.enabled) {
        throw new Error(`${agentType} agent is disabled`);
      }

      const tools = {
        coordinator: [], // Coordinator doesn't need tools, just routes requests
        hotel: HOTEL_TOOLS,
        taxi: TAXI_TOOLS,
      }[agentType];

      const model = (await loadChatModel(agentConfig.model)).bindTools(tools);

      // Create an AbortController with timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
      }, DEFAULT_TIMEOUT);

      try {
        const systemPrompt =
          agentType === "coordinator"
            ? COORDINATOR_PROMPT
            : `You are the ${agentType} agent. Always indicate when you have completed your task by including phrases like "task complete" or "finished". ${configuration.systemPromptTemplate.replace(
                "{system_time}",
                new Date().toISOString()
              )}`;

        const response = await model.invoke(
          [
            {
              role: "system",
              content: systemPrompt,
            },
            ...state.messages,
          ],
          { signal: controller.signal }
        );

        return { messages: [response] };
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      console.error(`Error in ${agentType} agent:`, error);
      // Return a graceful error message as part of the conversation
      return {
        messages: [
          {
            role: "assistant",
            content: `I apologize, but I encountered an error while processing your request. ${
              error instanceof Error ? error.message : "Please try again."
            } Task complete.`,
          },
        ],
      };
    }
  };
}

// Helper function to route model output
function routeModelOutput(state: typeof MessagesAnnotation.State): string {
  try {
    if (!validateState(state)) {
      console.error("Invalid state in routeModelOutput");
      return "__end__";
    }

    const messages = state.messages;
    if (!messages.length) {
      return "__end__";
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) {
      return "__end__";
    }

    if (isTaskComplete(lastMessage)) {
      return "__end__";
    }

    if ((lastMessage as AIMessage)?.tool_calls?.length || 0 > 0) {
      return "tools";
    }
  } catch (error) {
    console.error("Error in routeModelOutput:", error);
  }
  return "__end__";
}

// Helper function to extract text content from MessageContentComplex
function getTextFromComplex(content: MessageContentComplex): string {
  try {
    if ("text" in content) {
      return content.text;
    }
  } catch (error) {
    console.error("Error in getTextFromComplex:", error);
  }
  return "";
}

// Helper function to get message content as string
function getMessageContent(message: BaseMessage): string {
  try {
    if (!message || !message.content) {
      return "";
    }

    if (typeof message.content === "string") {
      return message.content;
    }
    if (Array.isArray(message.content)) {
      return message.content
        .map((item) =>
          typeof item === "string" ? item : getTextFromComplex(item)
        )
        .join(" ");
    }
  } catch (error) {
    console.error("Error in getMessageContent:", error);
  }
  return "";
}

// Create individual agent graphs
function createAgentGraph(agentType: "coordinator" | "hotel" | "taxi") {
  try {
    const tools = {
      coordinator: [], // Coordinator doesn't need tools
      hotel: HOTEL_TOOLS,
      taxi: TAXI_TOOLS,
    }[agentType];

    const modelCaller = createModelCaller(agentType);

    const workflow = new StateGraph(MessagesAnnotation, ConfigurationSchema)
      .addNode("callModel", modelCaller)
      .addNode("tools", new ToolNode(tools))
      .addEdge("__start__", "callModel")
      .addConditionalEdges("callModel", routeModelOutput)
      .addEdge("tools", "callModel");

    return workflow.compile();
  } catch (error) {
    console.error(`Error creating ${agentType} graph:`, error);
    throw error;
  }
}

// Export individual agent graphs
export const coordinatorGraph = createAgentGraph("coordinator");
export const hotelGraph = createAgentGraph("hotel");
export const taxiGraph = createAgentGraph("taxi");

// Create and export the main orchestrator graph
const orchestratorWorkflow = new StateGraph(
  MessagesAnnotation,
  ConfigurationSchema
)
  .addNode("coordinator", coordinatorGraph)
  .addNode("hotel", hotelGraph)
  .addNode("taxi", taxiGraph)
  .addEdge("__start__", "coordinator")
  .addConditionalEdges("coordinator", (state) => {
    try {
      if (!validateState(state)) {
        console.error("Invalid state in coordinator routing");
        return "__end__";
      }

      const messages = state.messages;
      if (!messages.length) {
        return "__end__";
      }

      const lastMessage = messages[messages.length - 1];
      if (!lastMessage) {
        return "__end__";
      }

      const content = getMessageContent(lastMessage).toLowerCase();

      // Route based on the coordinator's routing indication
      if (content.includes("routing to hotel")) {
        return "hotel";
      } else if (content.includes("routing to taxi")) {
        return "taxi";
      }
    } catch (error) {
      console.error("Error in orchestrator routing:", error);
    }
    return "__end__";
  })
  // Sub-agents complete their tasks independently
  .addConditionalEdges("hotel", (state) => "__end__")
  .addConditionalEdges("taxi", (state) => "__end__");

export const orchestratorGraph = orchestratorWorkflow.compile({
  interruptBefore: [], // Allow interrupting before any node execution
  interruptAfter: [], // Allow interrupting after any node execution
});
