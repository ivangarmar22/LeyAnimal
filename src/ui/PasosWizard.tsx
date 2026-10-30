import { Check } from 'lucide-preact';
import type { Traductor } from '@/i18n/traductor';
import { cn } from '@/lib/cn';

/**
 * Progreso segmentado del asistente. Se dice tambien con texto ("Paso 2 de
 * 4") y los pasos ya hechos son botones para volver a ellos.
 */
export function PasosWizard({
  paso,
  etiquetas,
  alcanzable,
  onIr,
  t,
}: {
  paso: number;
  etiquetas: readonly string[];
  /** Ultimo paso al que se puede ir con lo que hay respondido. */
  alcanzable: number;
  onIr: (paso: number) => void;
  t: Traductor;
}) {
  const total = etiquetas.length;
  return (
    <nav class="w-full" aria-label={t('progresoEtiqueta')}>
      <p class="rotulo cifras">{t('progreso', { paso, total })}</p>
      <ol class="mt-3 grid grid-cols-4 gap-2">
        {etiquetas.map((etiqueta, i) => {
          const n = i + 1;
          const hecho = n < paso;
          const actual = n === paso;
          const contenido = (
            <>
              <span
                class={cn(
                  'block h-1.5 rounded-full transition-colors',
                  hecho || actual ? 'bg-marca-500' : 'bg-borde-fuerte',
                )}
                aria-hidden
              />
              <span
                class={cn(
                  'mt-2.5 hidden items-center gap-1.5 text-sm sm:flex',
                  actual
                    ? 'font-semibold text-texto'
                    : hecho
                      ? 'text-texto-2'
                      : 'text-texto-3',
                )}
                aria-hidden
              >
                {hecho ? (
                  <Check class="size-3.5 text-marca-600" aria-hidden />
                ) : null}
                {etiqueta}
              </span>
              <span class="sr-only">
                {etiqueta}
                {hecho
                  ? ` (${t('completado')})`
                  : actual
                    ? ` (${t('actual')})`
                    : ''}
              </span>
            </>
          );
          return (
            <li key={etiqueta} aria-current={actual ? 'step' : undefined}>
              {hecho && n <= alcanzable ? (
                <button
                  type="button"
                  onClick={() => onIr(n)}
                  class="-my-2 block w-full rounded-md py-2 text-left hover:opacity-90"
                >
                  {contenido}
                </button>
              ) : (
                contenido
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
