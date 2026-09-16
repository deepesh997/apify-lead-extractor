import { ExtractedLead } from '@/types';
import { normalizeApifyItem } from './extractor';

interface SerpApiOptions {
  keyword: string;
  maxResults?: number;
  apiKey?: string;
}

/**
 * Extract leads using SerpAPI (Real Live Google Search Engine)
 */
export async function runSerpApiExtraction({
  keyword,
  maxResults = 10,
  apiKey,
}: SerpApiOptions): Promise<{ leads: ExtractedLead[]; source: 'serpapi'; actorUsed: string }> {
  const key = apiKey || process.env.SERPAPI_API_KEY;

  if (!key) {
    throw new Error(
      'SERPAPI_API_KEY is required for real Google search scraping. Please add SERPAPI_API_KEY to your server .env.local / Vercel Environment Variables, or enter your key in Settings.'
    );
  }

  // Targeted Google X-ray query for profiles, contact info, and resumes
  const query = `site:linkedin.com/in/ "${keyword}" ("email" OR "@gmail.com" OR "contact" OR "phone" OR "resume" OR "cv")`;
  
  const url = new URL('https://serpapi.com/search.json');
  url.searchParams.set('engine', 'google');
  url.searchParams.set('q', query);
  url.searchParams.set('num', String(Math.min(maxResults, 20)));
  url.searchParams.set('api_key', key.trim());

  console.log(`[SerpAPI] Querying Google for "${keyword}"...`);
  const res = await fetch(url.toString());

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`SerpAPI error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const organicResults: any[] = data.organic_results || [];

  if (organicResults.length === 0) {
    return {
      leads: [],
      source: 'serpapi',
      actorUsed: 'serpapi (Google Search)',
    };
  }

  const leads = organicResults.slice(0, maxResults).map((item, index) => {
    return normalizeApifyItem({
      id: `serpapi-${index}-${Date.now()}`,
      title: item.title,
      name: item.title,
      snippet: item.snippet,
      description: item.snippet,
      url: item.link,
      displayedUrl: item.displayed_link,
      ...item
    }, index);
  });

  return {
    leads,
    source: 'serpapi',
    actorUsed: 'serpapi-google-engine',
  };
}
