import type { APIRoute } from 'astro';
import { TUPLAS } from '@/lib/datos/municipios';

/**
 * Indice de municipios para las islas (consulta y portada). Se
 * genera al compilar a partir de src/datos/municipios.json; ~110 KB comprimido.
 */
export const GET: APIRoute = () =>
  new Response(JSON.stringify(TUPLAS), {
    headers: { 'Content-Type': 'application/json' },
  });
