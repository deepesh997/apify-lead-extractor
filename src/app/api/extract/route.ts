import { NextRequest, NextResponse } from 'next/server';
import { runApifyExtraction } from '@/lib/apify';
import { ExtractionRequest, ExtractionResponse } from '@/types';

// Allow Vercel serverless function up to 60s runtime if on Pro/Enterprise, or standard on Hobby
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body: ExtractionRequest = await req.json();
    const { keyword, maxResults = 10, apiToken, actorId } = body;

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

    console.log(`[API /extract] Extracting leads for keyword: "${trimmedKeyword}", limit: ${sanitizedLimit}`);

    const result = await runApifyExtraction({
      keyword: trimmedKeyword,
      maxResults: sanitizedLimit,
      apiToken,
      actorId,
    });

    const executionTimeMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      leads: result.leads,
      count: result.leads.length,
      source: result.source,
      actorUsed: result.actorUsed,
      executionTimeMs,
      message: `Successfully extracted ${result.leads.length} leads for "${trimmedKeyword}".`,
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
