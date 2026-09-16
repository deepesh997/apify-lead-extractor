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
}

export interface ExtractionResponse {
  success: boolean;
  leads: ExtractedLead[];
  count: number;
  source: 'apify' | 'serpapi';
  actorUsed?: string;
  executionTimeMs: number;
  message?: string;
  error?: string;
}
