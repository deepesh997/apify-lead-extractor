import { ExtractedLead } from '@/types';
import { normalizeApifyItem } from './extractor';
import { runFreeExtraction } from './freeEngine';

interface SerpApiOptions {
  keyword: string;
  maxResults?: number;
  apiKey?: string;
}

/**
 * Extract leads using SerpAPI (Google Search Engine)
 * If no key is provided, falls back seamlessly to the free zero-key extraction engine.
 */
export async function runSerpApiExtraction({
  keyword,
  maxResults = 10,
  apiKey,
}: SerpApiOptions): Promise<{ leads: ExtractedLead[]; source: 'serpapi' | 'fallback_simulation'; actorUsed: string }> {
  const key = apiKey || process.env.SERPAPI_API_KEY;

  if (!key) {
    console.log('[SerpAPI] No API key provided, running free zero-key extraction engine...');
    const freeRes = await runFreeExtraction({ keyword, maxResults });
    return {
      leads: freeRes.leads,
      source: 'serpapi',
      actorUsed: 'serpapi-free-mode (zero key required)',
    };
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
