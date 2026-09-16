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
}: ApifyRunOptions): Promise<{ leads: ExtractedLead[]; source: 'apify' | 'fallback_simulation'; actorUsed: string }> {
  const token = apiToken || process.env.APIFY_API_TOKEN;

  if (!token) {
    console.warn('No APIFY_API_TOKEN provided. Generating realistic demonstration data.');
    return {
      leads: generateDemoLeads(keyword, maxResults),
      source: 'fallback_simulation',
      actorUsed: 'demo-simulator (provide API token for live Apify runs)',
    };
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

      console.log(`Starting Apify Actor [${actorId}] with keyword: "${keyword}"...`);
      const run = await client.actor(actorId).call(runInput, {
        timeout: 120,
        memory: 1024,
      });

      const { items: datasetItems } = await client.dataset(run.defaultDatasetId).listItems();
      
      // Flatten organic results from Google search scraper
      for (const page of datasetItems as any[]) {
        if (page.organicResults && Array.isArray(page.organicResults)) {
          items.push(...page.organicResults);
        } else {
          items.push(page);
        }
      }
    } else {
      // Direct specialized actor invocation
      const runInput = {
        searchQueries: [keyword],
        queries: [keyword],
        keyword: keyword,
        maxItems: maxResults,
        limit: maxResults,
      };

      console.log(`Starting specialized Apify Actor [${actorId}]...`);
      const run = await client.actor(actorId).call(runInput, {
        timeout: 120,
        memory: 1024,
      });

      const { items: datasetItems } = await client.dataset(run.defaultDatasetId).listItems();
      items = datasetItems as Record<string, any>[];
    }

    if (!items || items.length === 0) {
      console.log('No raw items returned by Actor, falling back to simulated query preview.');
      return {
        leads: generateDemoLeads(keyword, maxResults),
        source: 'fallback_simulation',
        actorUsed: `${actorId} (No live results returned, displayed simulation preview)`,
      };
    }

    // Transform and normalize all items
    const leads = items
      .slice(0, maxResults)
      .map((item, index) => normalizeApifyItem(item, index));

    return {
      leads,
      source: 'apify',
      actorUsed: actorId,
    };
  } catch (error: any) {
    console.error('Apify extraction failed:', error?.message || error);
    // Graceful fallback with error context so UI remains operational
    const fallback = generateDemoLeads(keyword, maxResults);
    return {
      leads: fallback,
      source: 'fallback_simulation',
      actorUsed: `${actorId} (Failed: ${error?.message || 'Check Apify Token & Actor Permissions'})`,
    };
  }
}

/**
 * Generate high-quality realistic sample leads for demonstration or testing when no token is present
 */
export function generateDemoLeads(keyword: string, count: number = 5): ExtractedLead[] {
  const sampleProfiles = [
    {
      name: 'Sarah Chen',
      email: 'sarah.chen.tech@gmail.com',
      phoneNumber: '+1 (415) 890-2145',
      designation: `Principal ${keyword || 'Software Engineer'}`,
      experience: '9+ years in distributed systems & cloud architecture',
      company: 'Databricks',
      location: 'San Francisco, CA',
      sourceUrl: 'https://linkedin.com/in/sarah-chen-demo',
      resumeUrl: 'https://read.cv/sarahchen',
      snippet: `Senior leader specializing in ${keyword}. Built multi-region microservices handling 50k RPS. Contact: sarah.chen.tech@gmail.com | (415) 890-2145`,
    },
    {
      name: 'Marcus Vance',
      email: 'm.vance.dev@outlook.com',
      phoneNumber: '+1 (206) 431-7789',
      designation: `Staff ${keyword || 'Solutions Architect'}` ,
      experience: '7 years of enterprise development & team leadership',
      company: 'Amazon Web Services',
      location: 'Seattle, WA',
      sourceUrl: 'https://linkedin.com/in/marcus-vance-demo',
      resumeUrl: 'https://flowcv.me/marcus-vance-cloud',
      snippet: `Passionate about scalable workflows and ${keyword}. 7 yrs exp designing high-availability systems. Reach out at m.vance.dev@outlook.com.`,
    },
    {
      name: 'Elena Rostova',
      email: 'elena.rostova@proton.me',
      phoneNumber: '+44 20 7946 0912',
      designation: `Senior ${keyword || 'Product Specialist'}`,
      experience: '6+ years driving technical roadmap and growth',
      company: 'Revolut',
      location: 'London, UK',
      sourceUrl: 'https://linkedin.com/in/elena-rostova-demo',
      snippet: `Specialized in scaling ${keyword} across EMEA. Track record in 0-to-1 product launches. Direct phone: +44 20 7946 0912`,
    },
    {
      name: 'Arjun Patel',
      email: 'arjun.patel.tech@gmail.com',
      phoneNumber: '+91 98201 44521',
      designation: `Lead ${keyword || 'Full Stack Consultant'}`,
      experience: '8 years hands-on production engineering & mentoring',
      company: 'TCS Digital Labs',
      location: 'Bengaluru, India',
      sourceUrl: 'https://linkedin.com/in/arjun-patel-demo',
      resumeUrl: 'https://drive.google.com/file/d/1A2B3C4D_arjun_cv/view',
      snippet: `Full stack consultant with 8+ years experience specializing in modern web ecosystems and ${keyword}. Email: arjun.patel.tech@gmail.com`,
    },
    {
      name: 'David Kim',
      email: 'david.kim.eng@gmail.com',
      phoneNumber: '+1 (512) 674-8831',
      designation: `Head of ${keyword || 'Engineering'}`,
      experience: '12+ years building and scaling engineering teams',
      company: 'Techstars Accelerator',
      location: 'Austin, TX',
      sourceUrl: 'https://linkedin.com/in/david-kim-demo',
      snippet: `Engineering executive with 12+ years experience. Angel investor and advisor in ${keyword}. Contact: david.kim.eng@gmail.com / (512) 674-8831`,
    },
    {
      name: 'Chloe Dubois',
      email: 'chloe.dubois@freemail.io',
      phoneNumber: '+33 1 42 68 55 00',
      designation: `Senior ${keyword || 'Data Strategist'}`,
      experience: '5 years in AI automation & quantitative pipelines',
      company: 'Station F',
      location: 'Paris, France',
      sourceUrl: 'https://linkedin.com/in/chloe-dubois-demo',
      resumeUrl: 'https://notion.site/chloe-dubois-cv-2026',
      snippet: `Data strategist & consultant in ${keyword}. 5 yrs exp driving digital transformation. Inquiries: chloe.dubois@freemail.io`,
    }
  ];

  return sampleProfiles.slice(0, Math.min(count, sampleProfiles.length)).map((p, idx) => ({
    id: `demo-${idx + 1}-${Date.now()}`,
    ...p,
  }));
}
