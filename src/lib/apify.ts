import { ApifyClient } from 'apify-client';
import { ExtractedLead } from '@/types';
import { normalizeApifyItem } from './extractor';

const DEFAULT_ACTOR_ID = 'apify/google-search-scraper';

interface ApifyRunOptions {
  keyword: string;
  maxResults?: number;
  apiToken?: string;
  actorId?: string;
}

/**
 * Execute an Apify Actor and extract normalized leads
 */
export async function runApifyExtraction({
  keyword,
  maxResults = 10,
  apiToken,
  actorId = DEFAULT_ACTOR_ID,
}: ApifyRunOptions): Promise<{ leads: ExtractedLead[]; source: 'apify'; actorUsed: string }> {
  const token = apiToken || process.env.APIFY_API_TOKEN;

  if (!token) {
    throw new Error(
      'APIFY_API_TOKEN is required for real web scraping. Please add APIFY_API_TOKEN to your server .env.local / Vercel Environment Variables (so no user has to enter it), or paste it in Settings.'
    );
  }

  const client = new ApifyClient({
    token: token.trim(),
  });

  try {
    let items: Record<string, any>[] = [];

    if (actorId === 'apify/google-search-scraper' || actorId.includes('google-search')) {
      // Build targeted X-ray search query to harvest public professional profiles with contact info and resumes
      const queries = [
        `site:linkedin.com/in/ "${keyword}" ("email" OR "@gmail.com" OR "contact" OR "phone" OR "resume" OR "cv")`,
        `site:linkedin.com/in/ "${keyword}" "years of experience"`,
      ].join('\n');

      const runInput = {
        queries,
        maxPagesPerQuery: 1,
        resultsPerPage: Math.min(maxResults, 20),
        mobileResults: false,
        countryCode: 'us',
        languageCode: 'en',
      };

      console.log(`Starting real Apify Actor [${actorId}] scraping for: "${keyword}"...`);
      const run = await client.actor(actorId).call(runInput, {
        timeout: 120,
        memory: 1024,
      });

      const { defaultDatasetId } = run;
      if (defaultDatasetId) {
        const dataset = await client.dataset(defaultDatasetId).listItems({
          limit: maxResults * 2,
        });
        items = dataset.items || [];
      }
    } else {
      console.log(`Starting real Apify Actor [${actorId}] scraping for: "${keyword}"...`);
      const run = await client.actor(actorId).call(
        {
          searchQueries: [keyword],
          maxResults,
        },
        {
          timeout: 120,
        }
      );

      if (run.defaultDatasetId) {
        const dataset = await client.dataset(run.defaultDatasetId).listItems({
          limit: maxResults,
        });
        items = dataset.items || [];
      }
    }

    // Transform and normalize all real scraped items
    const leads = items
      .slice(0, maxResults)
      .map((item, index) => normalizeApifyItem(item, index));

    return {
      leads,
      source: 'apify',
      actorUsed: actorId,
    };
  } catch (error: any) {
    console.error('Real Apify scraping failed:', error?.message || error);
    throw new Error(`Real scraping failed via Apify: ${error?.message || 'Check your Apify token and actor quota'}`);
  }
}
