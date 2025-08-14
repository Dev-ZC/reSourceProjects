import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../client";

interface StartChatRequest {
  prompt: string;
  project_id: string;
}

interface ContinueChatRequest {
  conversation_history: string[];  // Array of strings containing the conversation history
  project_id: string;
}

// Response type from the chat API
export interface AgentConversationResponse {
  wait_for_human: boolean;
  conversation_history?: string;    // Single string when receiving from backend (when wait_for_human is true)
  model_response?: string;          // Response from the model (when wait_for_human is false)
}

const startChat = async (request: StartChatRequest): Promise<AgentConversationResponse> => {
  const { data } = await api.post<AgentConversationResponse>("/api/chat/chat-start", request);
  return data;
};

export const useStartChat = () => {
  const queryClient = useQueryClient();
  
  return useMutation<AgentConversationResponse, Error, StartChatRequest>({
    mutationFn: startChat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat'] });
    },
  });
};

const continueChat = async (request: ContinueChatRequest): Promise<AgentConversationResponse> => {
  const { data } = await api.post<AgentConversationResponse>("/api/chat/chat-continue", request);
  return data;
};

export const useContinueChat = () => {
  const queryClient = useQueryClient();
  
  return useMutation<AgentConversationResponse, Error, ContinueChatRequest>({
    mutationFn: continueChat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat'] });
    },
  });
};