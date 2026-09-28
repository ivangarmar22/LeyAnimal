import type { Ambito } from '@leyanimal/reglas';
import type { Traductor } from '@/i18n/traductor';
import type { EstadoNorma } from '@/lib/datos/tipos';
import { AMBITOS, ESTADOS, type EstadoVisual } from '@/lib/dominio/estados';
import { cn } from '@/lib/cn';

const BASE =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[0.8125rem] leading-none font-medium';

/**
 * Chip de estado normativo. Siempre icono + etiqueta de texto: el estado no se
 * comunica nunca solo por color.
 */
export function ChipEstado({
  estado,
  t,
  class: clase,
}: {
  estado: EstadoVisual;
  t: Traductor;
  class?: string;
}) {
  const { Icono, chip } = ESTADOS[estado];
  return (
    <span class={cn(BASE, chip, clase)}>
      <Icono class="size-3.5" aria-hidden />
      {t(`estados.${estado}`)}
    </span>
  );
}

/** Chip de ambito territorial: discreto, solo borde y texto. */
export function ChipAmbito({
  ambito,
  t,
  class: clase,
}: {
  ambito: Ambito;
  t: Traductor;
  class?: string;
}) {
  return (
    <span class={cn(BASE, 'bg-transparent', AMBITOS[ambito], clase)}>
      {t(`ambitos.${ambito}`)}
    </span>
  );
}

const NORMA: Record<EstadoNorma, string> = {
  vigente: 'text-cumplido-texto bg-cumplido-fondo border-cumplido-borde',
  derogada: 'text-noaplica-texto bg-noaplica-fondo border-noaplica-borde',
  pendiente_desarrollo:
    'text-pendiente-texto bg-pendiente-fondo border-pendiente-borde',
  en_tramitacion:
    'text-recomendado-texto bg-recomendado-fondo border-recomendado-borde',
};

/** Estado de una norma (vigente, derogada...). */
export function ChipNorma({
  estado,
  t,
  class: clase,
}: {
  estado: EstadoNorma;
  t: Traductor;
  class?: string;
}) {
  return (
    <span class={cn(BASE, NORMA[estado], clase)}>
      <span class="size-1.5 rounded-full bg-current" aria-hidden />
      {t(`estadosNorma.${estado}`)}
    </span>
  );
}
