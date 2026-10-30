import type { LucideIcon } from 'lucide-preact';
import type { Ambito, EstadoRequisito } from '@/lib/reglas';
import type { Traductor } from '@/i18n/traductor';
import type { EstadoNorma } from '@/lib/datos/tipos';
import { AMBITOS, ESTADOS } from '@/lib/dominio/estados';
import { cn } from '@/lib/cn';

/**
 * Chip de estado normativo. Siempre icono + etiqueta de texto: el estado no se
 * comunica nunca solo por color.
 */
export function ChipEstado({
  estado,
  t,
  class: clase,
}: {
  estado: EstadoRequisito;
  t: Traductor;
  class?: string;
}) {
  const { Icono, chip } = ESTADOS[estado];
  return (
    <span class={cn('chip', chip, clase)}>
      <Icono aria-hidden />
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
    <span class={cn('chip', AMBITOS[ambito], clase)}>
      {t(`ambitos.${ambito}`)}
    </span>
  );
}

/** Chip neutro con icono: lo que no es un estado legal ("Depende del lugar"). */
export function ChipNeutro({
  Icono,
  texto,
  class: clase,
}: {
  Icono: LucideIcon;
  texto: string;
  class?: string;
}) {
  return (
    <span
      class={cn('chip border-borde-fuerte bg-superficie-2 text-texto-2', clase)}
    >
      <Icono aria-hidden />
      {texto}
    </span>
  );
}

const NORMA: Record<EstadoNorma, string> = {
  vigente: 'text-vigente-texto bg-vigente-fondo border-vigente-borde',
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
    <span class={cn('chip', NORMA[estado], clase)}>
      <span class="size-1.5 rounded-full bg-current" aria-hidden />
      {t(`estadosNorma.${estado}`)}
    </span>
  );
}
