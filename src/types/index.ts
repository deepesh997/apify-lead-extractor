export interface ExtractedLead {
  id: string;
  name: string;
  phoneNumber: string;
  email: string;
  designation: string;
  experience: string;
  company?: string;
  location?: string;
  sourceUrl?: string;
  resumeUrl?: string;
  snippet?: string;
}

export interface ExtractionRequest {
  keyword: string;
  maxResults?: number;
  apiToken?: string;
  actorId?: string;
  provider?: 'apify' | 'serpapi';
  serpApiKey?: string;
  includeMockFallback?: boolean;
}

export interface ExtractionResponse {
  success: boolean;
  leads: ExtractedLead[];
  count: number;
  source: 'apify' | 'serpapi' | 'fallback_simulation';
  actorUsed?: string;
  executionTimeMs: number;
  message?: string;
  error?: string;
}
