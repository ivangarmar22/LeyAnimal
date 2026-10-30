import type { EstadoRequisito } from '@/lib/reglas';
import { useState } from 'preact/hooks';
import { ruta } from '@/lib/rutas';
import { crearTraductor, type Mensajes } from '@/i18n/traductor';
import { ESTADOS } from '@/lib/dominio/estados';
import { cn } from '@/lib/cn';
import { ChipEstado } from '@/ui/Chips';

export type Capa = 'seguro' | 'identificacion' | 'censo';
export type CasillaMapa = {
  codigo: string;
  nombre: string;
  slug: string;
  estados: Record<Capa, EstadoRequisito>;
};

/**
 * Posicion aproximada de cada comunidad en una rejilla de 8 columnas. No es
 * un mapa real (no hay libreria de mapas ni SVG de Espana): es un mosaico
 * que conserva la vecindad para orientarse de un vistazo.
 */
const POSICION: Record<string, { col: number; fila: number; ancho?: number }> =
  {
    '12': { col: 1, fila: 1 }, // Galicia
    '03': { col: 2, fila: 1 }, // Asturias
    '06': { col: 3, fila: 1 }, // Cantabria
    '16': { col: 4, fila: 1 }, // Pais Vasco
    '15': { col: 5, fila: 1 }, // Navarra
    '07': { col: 2, fila: 2, ancho: 2 }, // Castilla y Leon
    '17': { col: 4, fila: 2 }, // La Rioja
    '02': { col: 5, fila: 2, ancho: 2 }, // Aragon
    '09': { col: 7, fila: 2 }, // Cataluna
    '11': { col: 2, fila: 3 }, // Extremadura
    '13': { col: 3, fila: 3 }, // Madrid
    '08': { col: 4, fila: 3, ancho: 2 }, // Castilla-La Mancha
    '10': { col: 6, fila: 3 }, // Comunitat Valenciana
    '04': { col: 8, fila: 3 }, // Illes Balears
    '01': { col: 2, fila: 4, ancho: 3 }, // Andalucia
    '14': { col: 5, fila: 4 }, // Murcia
    '05': { col: 1, fila: 5, ancho: 2 }, // Canarias
    '18': { col: 3, fila: 5 }, // Ceuta
    '19': { col: 5, fila: 5 }, // Melilla
  };

const CAPAS: Capa[] = ['seguro', 'identificacion', 'censo'];

export default function Mosaico({
  textos,
  casillas,
}: {
  textos: Mensajes;
  casillas: CasillaMapa[];
}) {
  const tg = crearTraductor(textos);
  const t = tg.en('mapa');
  const [capa, setCapa] = useState<Capa>('seguro');
  const presentes = [...new Set(casillas.map((c) => c.estados[capa]))];

  return (
    <div>
      <div
        class="flex flex-wrap items-center gap-2"
        role="radiogroup"
        aria-label={t('capa')}
      >
        {CAPAS.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={capa === c}
            onClick={() => setCapa(c)}
            class={cn(
              'min-h-11 rounded-full border px-5 text-[0.9375rem] font-medium transition-colors',
              capa === c
                ? 'border-marca-600 bg-marca-50 font-semibold text-marca-700 shadow-[inset_0_0_0_1px_var(--color-marca-600)]'
                : 'border-borde-control bg-superficie text-texto-2 hover:border-marca-600 hover:text-texto',
            )}
          >
            {t(c)}
          </button>
        ))}
      </div>

      <ul class="mosaico mt-8" aria-label={t(capa)}>
        {casillas.map((c) => {
          const pos = POSICION[c.codigo];
          const estado = c.estados[capa];
          const { Icono, bloque, chip } = ESTADOS[estado];
          // La primera clase del chip es su color de texto.
          const colorTexto = chip.split(' ')[0];
          return (
            <li
              key={c.codigo}
              style={
                pos
                  ? {
                      '--col': pos.col,
                      '--fila': pos.fila,
                      '--ancho': pos.ancho ?? 1,
                    }
                  : undefined
              }
            >
              <a
                href={ruta(`/comunidades/${c.slug}`)}
                class={cn('ficha-mapa h-full border', bloque)}
              >
                <span class="font-semibold text-texto">{c.nombre}</span>
                <span
                  class={cn(
                    'flex items-center gap-1.5 font-medium',
                    colorTexto,
                  )}
                >
                  <Icono class="size-4 shrink-0" aria-hidden />
                  {tg(`estados.${estado}`)}
                </span>
              </a>
            </li>
          );
        })}
      </ul>

      <div class="mt-8 flex flex-wrap items-center gap-3">
        <span class="text-sm font-medium text-texto">{t('leyenda')}:</span>
        {presentes.map((e) => (
          <ChipEstado key={e} estado={e} t={tg} />
        ))}
      </div>
    </div>
  );
}
