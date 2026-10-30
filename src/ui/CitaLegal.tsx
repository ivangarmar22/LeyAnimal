import { ExternalLink } from 'lucide-preact';
import type { Traductor } from '@/i18n/traductor';
import { formatearFecha } from '@/lib/fechas';
import { nombreNorma } from '@/lib/datos/textos';
import type { Articulo, Norma } from '@/lib/datos/tipos';
import { cn } from '@/lib/cn';

/**
 * Cita literal de una norma. Nunca aparece sin norma, articulo, enlace
 * oficial y fecha de verificacion. Va en serif para separarla
 * de nuestra explicacion.
 */
export function CitaLegal({
  norma,
  articulo,
  cita,
  t,
  class: clase,
}: {
  norma: Norma;
  articulo: Articulo;
  /** Por defecto, el texto literal del articulo. */
  cita?: string;
  t: Traductor;
  class?: string;
}) {
  const texto = cita ?? articulo.textoLiteral;
  if (!texto) return null;

  return (
    <figure class={cn('cita', clase)}>
      <blockquote class="cita__texto">{texto}</blockquote>
      <figcaption class="cita__pie">
        <cite class="cita__norma not-italic">
          {nombreNorma(norma)}, {articulo.referencia}
        </cite>
        <a
          href={articulo.urlAncla ?? norma.urlOficial}
          target="_blank"
          rel="noreferrer noopener"
          class="cita__enlace"
        >
          {t('comun.fuenteOficial')}
          <ExternalLink aria-hidden />
          <span class="sr-only">{t('comun.abreEnPestana')}</span>
        </a>
        {norma.verificadaEn ? (
          <span class="cifras">
            {t('ley.verificada', {
              fecha: formatearFecha(norma.verificadaEn),
            })}
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}
