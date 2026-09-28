import type { APIRoute } from 'astro';
import { traductor } from '@/i18n/catalogos';
import { IDIOMAS, type Idioma } from '@/i18n/idiomas';
import type { IndiceBusqueda } from '@/islas/Buscador';
import { comunidades, normas, temas } from '@/lib/datos';
import { nombreNorma, textosTema } from '@/lib/datos/textos';

export function getStaticPaths() {
  return IDIOMAS.map((idioma) => ({ params: { idioma } }));
}

/** Nombres de comunidades, normas y guias, ya traducidos, para el buscador. */
export const GET: APIRoute = ({ params }) => {
  const idioma = params.idioma as Idioma;
  const t = traductor(idioma, 'temas');
  const indice: IndiceBusqueda = {
    comunidades: comunidades().map((c) => ({
      titulo: c.nombre,
      href: `/comunidades/${c.slug}`,
    })),
    normas: normas().map((n) => ({
      titulo: nombreNorma(n),
      detalle: n.titulo,
      href: `/normativa/${n.slug}`,
    })),
    temas: temas().map((tm) => ({
      titulo: textosTema(t, tm).nombre,
      href: `/temas/${tm.slug}`,
    })),
  };
  return new Response(JSON.stringify(indice), {
    headers: { 'Content-Type': 'application/json' },
  });
};
