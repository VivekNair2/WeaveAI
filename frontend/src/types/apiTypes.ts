// Common response type
export interface ApiResponse {
  message: string;
  [key: string]: any; // Additional data that may be returned
}

// 1. Text Agent API
export interface TextAgentRequest {
  model: string;
  query: string;
  instructions: string;
}

// 2. CSV Agent API
// Note: For FormData, we use a different approach since it's not a JSON payload
export interface CsvAgentParams {
  model: string;
  query: string;
  file: File;
}

// 3. RAG Agent API
export interface RagAgentParams {
  model: string;
  query: string;
  file: File;
}

// 4. Web Search Agent API
export interface WebAgentRequest {
  model: string;
  query: string;
  instructions: string;
}

// 5. Zoom Agent API
export interface ZoomAgentRequest {
  account_id: string;
  client_id: string;
  client_secret: string;
  query: string;
}

// 6. Voice Agent API - No payload required

// API Endpoints mapping
export enum ApiEndpoint {
  TextAgent = 'http://localhost:8000/text_agent',
  CsvAgent = 'http://localhost:8000/csv_agent',
  RagAgent = 'http://localhost:8000/rag_agent',
  WebAgent = 'http://localhost:8000/web_agent',
  ZoomAgent = 'http://localhost:8000/zoom_agent',
  VoiceAgent = 'http://localhost:8000/voice_agent',
}

// Helper function for JSON payload APIs
export async function sendJsonRequest<T, R = ApiResponse>(
  endpoint: ApiEndpoint, 
  payload: T
): Promise<R> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

// Helper function for FormData payload APIs
export async function sendFormDataRequest<R = ApiResponse>(
  endpoint: ApiEndpoint, 
  params: CsvAgentParams | RagAgentParams
): Promise<R> {
  const formData = new FormData();
  formData.append('model', params.model);
  formData.append('query', params.query);
  formData.append('file', params.file);
  
  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

// Voice agent request (no payload)
export async function sendVoiceAgentRequest<R = ApiResponse>(): Promise<R> {
  const response = await fetch(ApiEndpoint.VoiceAgent, {
    method: 'POST'
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}