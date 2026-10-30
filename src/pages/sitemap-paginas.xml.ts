import type { APIRoute } from 'astro';
import {
  comunidades,
  normas,
  provincias,
  temas,
  ultimaVerificacion,
} from '@/lib/datos';
import { SITUACIONES } from '@/lib/contenido/situaciones';
import { sitemap } from '@/lib/sitemap';

const PAGINAS = [
  '/',
  '/consulta',
  '/situaciones',
  '/normativa',
  '/temas',
  '/comunidades',
  '/mapa',
  '/perros-potencialmente-peligrosos',
  '/seguros',
  '/multas',
  '/que-hacer-si',
  '/cambios',
  '/preguntas-frecuentes',
  '/metodologia',
  '/colabora',
  '/apoya',
  '/sobre',
  '/contacto',
  '/aviso-legal',
  '/privacidad',
  '/cookies',
  '/accesibilidad',
];

export const GET: APIRoute = () => {
  const fecha = ultimaVerificacion();
  return sitemap([
    ...PAGINAS.map((ruta) => ({ ruta, fecha })),
    ...normas().map((n) => ({
      ruta: `/normativa/${n.slug}`,
      fecha: n.verificadaEn,
    })),
    ...temas().map((t) => ({ ruta: `/temas/${t.slug}`, fecha })),
    ...SITUACIONES.map((s) => ({ ruta: `/situaciones/${s.slug}`, fecha })),
    ...comunidades().map((c) => ({ ruta: `/comunidades/${c.slug}`, fecha })),
    ...provincias().map((p) => ({ ruta: `/provincias/${p.slug}`, fecha })),
  ]);
};
