/**
 * PDF generation API URL: Vercel vs Netlify.
 * - On Vercel (*.vercel.app): use same-origin /api/generate-pdf
 * - On Netlify or custom domain: use Netlify function (with optional subdomain workaround)
 */

import { getNetlifyFunctionUrl } from './netlifyFunctions';

const VERCEL_PDF_PATH = '/api/generate-pdf';

function isVercel(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname.endsWith('.vercel.app') || hostname === 'vercel.app';
}

/**
 * Returns the URL to call for PDF generation (generate PDF + upload to storage).
 * Use this in useShareLesson when generating share links.
 */
export function getPdfApiUrl(): string {
  if (isVercel()) {
    return VERCEL_PDF_PATH; // same origin on Vercel
  }
  return getNetlifyFunctionUrl('/.netlify/functions/generate-pdf');
}
