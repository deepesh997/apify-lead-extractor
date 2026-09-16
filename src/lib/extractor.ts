import { ExtractedLead } from '@/types';

// Regex patterns for entity extraction
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g;
const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}\b/g;
const YEARS_EXP_REGEX = /(\b\d{1,2}\+?\s*(?:-\s*\d{1,2})?\s*(?:years?|yrs?)(?:\s+of)?\s*(?:experience|exp)?\b)/i;

/**
 * Clean and extract name from titles or raw strings
 * Handles: "Jane Doe - Lead Software Architect - Microsoft | LinkedIn" -> "Jane Doe"
 */
export function extractName(rawText: string): string {
  if (!rawText) return 'Anonymous Candidate';
  
  // Strip common endings
  let cleaned = rawText
    .replace(/\|\s*LinkedIn.*$/i, '')
    .replace(/-\s*LinkedIn.*$/i, '')
    .replace(/:\s*LinkedIn.*$/i, '')
    .trim();

  // If separated by dash or pipe, first part is usually the name
  const parts = cleaned.split(/[-–|•:]/);
  if (parts.length > 1 && parts[0].trim().length >= 2 && parts[0].trim().length <= 40) {
    cleaned = parts[0].trim();
  }

  // Remove trailing ellipsis or noise
  cleaned = cleaned.replace(/\.{2,}/g, '').trim();

  return cleaned || 'Candidate';
}

/**
 * Extract email from text or item properties
 */
export function extractEmail(item: Record<string, any>, fullText: string): string {
  if (item.email && typeof item.email === 'string' && item.email.includes('@')) {
    return item.email.trim();
  }
  if (Array.isArray(item.emails) && item.emails.length > 0) {
    const valid = item.emails.find((e: any) => typeof e === 'string' && e.includes('@'));
    if (valid) return valid.trim();
  }

  const matches = fullText.match(EMAIL_REGEX);
  if (matches && matches.length > 0) {
    // Filter out common false positives like asset extensions
    const filtered = matches.filter(e => !e.endsWith('.png') && !e.endsWith('.jpg') && !e.endsWith('.svg'));
    if (filtered.length > 0) return filtered[0];
  }

  return 'Not publicly listed';
}

/**
 * Extract phone number from text or item properties
 */
export function extractPhoneNumber(item: Record<string, any>, fullText: string): string {
  if (item.phone && typeof item.phone === 'string' && item.phone.replace(/\D/g, '').length >= 7) {
    return item.phone.trim();
  }
  if (item.phoneNumber && typeof item.phoneNumber === 'string') {
    return item.phoneNumber.trim();
  }
  if (Array.isArray(item.phones) && item.phones.length > 0) {
    return item.phones[0];
  }

  const matches = fullText.match(PHONE_REGEX);
  if (matches) {
    for (const match of matches) {
      const digits = match.replace(/\D/g, '');
      // Valid phone numbers usually have 7 to 15 digits
      if (digits.length >= 8 && digits.length <= 15) {
        return match.trim();
      }
    }
  }

  return 'Available upon request';
}

/**
 * Extract designation / job title from raw item or text
 */
export function extractDesignation(item: Record<string, any>, rawText: string): string {
  if (item.designation && typeof item.designation === 'string') return item.designation.trim();
  if (item.jobTitle && typeof item.jobTitle === 'string') return item.jobTitle.trim();
  if (item.headline && typeof item.headline === 'string') return item.headline.trim();
  if (item.occupation && typeof item.occupation === 'string') return item.occupation.trim();
  if (item.position && typeof item.position === 'string') return item.position.trim();

  // Try extracting from title (e.g. "John Doe - Senior Backend Engineer at Stripe")
  const parts = rawText.split(/[-–|•]/);
  if (parts.length > 1) {
    const candidateTitle = parts[1].trim();
    if (candidateTitle.length > 3 && candidateTitle.length < 80) {
      return candidateTitle;
    }
  }

  // Look for common keywords
  const titleMatch = rawText.match(/(?:working as|current role|designation|title[:\s]+)([a-zA-Z\s]+(?:Developer|Engineer|Manager|Lead|Director|Consultant|Architect|Specialist))/i);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].trim();
  }

  return 'Professional';
}

/**
 * Extract experience summary or years of experience
 */
export function extractExperience(item: Record<string, any>, fullText: string): string {
  if (item.experience && typeof item.experience === 'string') return item.experience.trim();
  if (item.totalExperienceYears) return `${item.totalExperienceYears} years of experience`;
  
  // If positions array exists
  if (Array.isArray(item.positions) && item.positions.length > 0) {
    const count = item.positions.length;
    const latest = item.positions[0];
    const role = latest.title || latest.role || 'Role';
    const company = latest.companyName || latest.company || '';
    return `${count} past roles (Latest: ${role}${company ? ' at ' + company : ''})`;
  }

  const expMatch = fullText.match(YEARS_EXP_REGEX);
  if (expMatch && expMatch[1]) {
    return expMatch[1].trim();
  }

  // Look for "years" mentions in snippet
  const snippetMatch = fullText.match(/(\d+\+?\s*years?)/i);
  if (snippetMatch) {
    return `${snippetMatch[1]} in industry`;
  }

  return 'Mid-to-Senior Level';
}

/**
 * Universal parser converting any Apify Actor dataset item into a normalized ExtractedLead
 */
export function normalizeApifyItem(item: Record<string, any>, index: number): ExtractedLead {
  const combinedText = [
    item.title || '',
    item.name || '',
    item.fullName || '',
    item.headline || '',
    item.snippet || item.description || '',
    item.summary || '',
    item.bio || '',
    JSON.stringify(item.additionalData || {}),
  ].join(' ');

  const rawName = item.fullName || item.name || item.title || `Candidate #${index + 1}`;
  const name = extractName(rawName);
  const designation = extractDesignation(item, item.title || item.headline || combinedText);
  const email = extractEmail(item, combinedText);
  const phoneNumber = extractPhoneNumber(item, combinedText);
  const experience = extractExperience(item, combinedText);

  // Extract source url or profile link
  const sourceUrl = item.url || item.link || item.profileUrl || item.displayedUrl || undefined;
  const company = item.company || item.companyName || undefined;
  const location = item.location || item.city || undefined;

  return {
    id: item.id || `lead-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
    name,
    designation,
    email,
    phoneNumber,
    experience,
    company,
    location,
    sourceUrl,
    snippet: item.snippet || item.description || (item.headline ? `${item.headline}` : undefined),
  };
}
