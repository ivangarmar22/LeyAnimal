import type { APIRoute } from 'astro';
import { traductor } from '@/i18n/catalogos';
import { cambios } from '@/lib/datos';
import { URL_SITIO } from '@/lib/sitio';

const escapar = (t: string) =>
  t
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Feed RSS 2.0 de cambios normativos, en espanol. */
export const GET: APIRoute = () => {
  const t = traductor('es', 'cambios');
  const enlace = new URL('/cambios', URL_SITIO).toString();
  const items = [...cambios()]
    .sort((a, b) => (b.publicadoEn ?? '').localeCompare(a.publicadoEn ?? ''))
    .map((c) =>
      [
        '    <item>',
        `      <title>${escapar(c.titulo)}</title>`,
        `      <link>${escapar(c.norma ? new URL(`/normativa/${c.norma}`, URL_SITIO).toString() : enlace)}</link>`,
        `      <guid isPermaLink="false">${escapar(c.id)}</guid>`,
        c.publicadoEn
          ? `      <pubDate>${new Date(`${c.publicadoEn}T12:00:00Z`).toUTCString()}</pubDate>`
          : null,
        c.resumen
          ? `      <description>${escapar(c.resumen)}</description>`
          : null,
        `      <category>${escapar(t(`tipos.${c.tipo}`))}</category>`,
        '    </item>',
      ]
        .filter((l) => l !== null)
        .join('\n'),
    );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapar(t('rssTitulo'))}</title>
    <link>${escapar(enlace)}</link>
    <description>${escapar(t('rssDescripcion'))}</description>
    <language>es-ES</language>
    <atom:link href="${escapar(new URL('/cambios/rss.xml', URL_SITIO).toString())}" rel="self" type="application/rss+xml" />
${items.join('\n')}
  </channel>
</rss>
`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
