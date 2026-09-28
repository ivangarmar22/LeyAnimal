import type { APIRoute } from 'astro';
import { URL_SITIO } from '@/lib/sitio';

export const GET: APIRoute = () =>
  new Response(
    `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap-index.xml', URL_SITIO).toString()}\n`,
    {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    },
  );
