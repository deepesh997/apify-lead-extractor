import { NextRequest, NextResponse } from 'next/server';
import { runApifyExtraction } from '@/lib/apify';
import { runSerpApiExtraction } from '@/lib/serpapi';
import { runFreeExtraction } from '@/lib/freeEngine';
import { ExtractionRequest, ExtractionResponse } from '@/types';

// Allow Vercel serverless function up to 60s runtime if on Pro/Enterprise, or standard on Hobby
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body: ExtractionRequest = await req.json();
    const { keyword, maxResults = 10, apiToken, actorId, provider = 'free', serpApiKey } = body;

    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          leads: [],
          count: 0,
          source: 'fallback_simulation',
          executionTimeMs: 0,
          error: 'Keyword is required to extract leads.',
        } satisfies ExtractionResponse,
        { status: 400 }
      );
    }

    const trimmedKeyword = keyword.trim();
    const sanitizedLimit = Math.max(1, Math.min(Number(maxResults) || 10, 50));

    console.log(`[API /extract] Provider: ${provider}, Keyword: "${trimmedKeyword}", Limit: ${sanitizedLimit}`);

    let result;
    if (provider === 'serpapi') {
      result = await runSerpApiExtraction({
        keyword: trimmedKeyword,
        maxResults: sanitizedLimit,
        apiKey: serpApiKey,
      });
    } else if (provider === 'apify') {
      result = await runApifyExtraction({
        keyword: trimmedKeyword,
        maxResults: sanitizedLimit,
        apiToken,
        actorId,
      });
    } else {
      // Free zero-key engine
      result = await runFreeExtraction({
        keyword: trimmedKeyword,
        maxResults: sanitizedLimit,
      });
    }

    const executionTimeMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      leads: result.leads,
      count: result.leads.length,
      source: result.source,
      actorUsed: result.actorUsed,
      executionTimeMs,
      message: `Successfully extracted ${result.leads.length} leads for "${trimmedKeyword}" via ${provider.toUpperCase()}.`,
    } satisfies ExtractionResponse);
  } catch (err: any) {
    console.error('[API /extract] Error:', err);
    return NextResponse.json(
      {
        success: false,
        leads: [],
        count: 0,
        source: 'fallback_simulation',
        executionTimeMs: Date.now() - startTime,
        error: err?.message || 'An unexpected error occurred during extraction.',
      } satisfies ExtractionResponse,
      { status: 500 }
    );
  }
}
