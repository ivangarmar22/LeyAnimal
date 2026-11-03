import { MapPin, ShieldAlert, ShieldQuestion } from 'lucide-preact';
import type { Traductor } from '@/i18n/traductor';
import { comunidad as buscarComunidad } from '@/lib/datos/geografia';
import { raza as buscarRaza } from '@/lib/datos/normativa';
import { fichaPppComunidad, veredictoPpp } from '@/lib/datos/ppp';
import { formatearEuros } from '@/lib/fechas';

const lista = new Intl.ListFormat('es', { type: 'conjunction' });

/**
 * Veredicto PPP de una raza en una comunidad. Lo comparten la guia, el
 * formulario y el resultado de la consulta. `t` es el espacio `ppp`.
 */
export function VeredictoPpp({
  raza: slugRaza,
  comunidad: codigoComunidad,
  t,
}: {
  raza: string | null | undefined;
  comunidad: string | null | undefined;
  t: Traductor;
}) {
  const v = veredictoPpp(slugRaza, codigoComunidad);
  const raza = slugRaza ? buscarRaza(slugRaza) : undefined;
  const c = codigoComunidad ? buscarComunidad(codigoComunidad) : undefined;
  const ficha = c ? fichaPppComunidad(c.codigoIne, raza?.slug) : null;
  const otras = lista.format(
    v.enComunidades
      .filter((x) => x !== c?.codigoIne)
      .map((x) => buscarComunidad(x)?.nombre ?? x),
  );

  const detalle =
    c && ficha ? (
      <div class="grid gap-1 text-sm opacity-90">
        <p>
          {ficha.razas.length
            ? t('listaPropia', {
                comunidad: c.nombre,
                razas: lista.format(ficha.razas),
              })
            : t('listaEstatal', { comunidad: c.nombre })}
        </p>
        {ficha.seguro ? (
          <p>
            {t('seguroComunidad', {
              comunidad: c.nombre,
              importe: formatearEuros(ficha.seguro),
            })}
          </p>
        ) : null}
      </div>
    ) : null;

  if (v.estado === 'si')
    return (
      <div class="flex gap-3 rounded-3xl border border-obligatorio-borde bg-obligatorio-fondo p-6 text-obligatorio-texto">
        <ShieldAlert class="mt-0.5 size-6 shrink-0" aria-hidden />
        <div class="grid gap-3">
          <p class="font-display text-lg font-semibold">
            {t('siTitulo', { raza: raza?.nombre ?? '' })}
          </p>
          <p class="text-[0.9375rem]">
            {v.lista === 'estatal' || !c
              ? t('siTexto')
              : t('siTextoAutonomico', {
                  norma: ficha?.norma ?? '',
                  comunidad: c.nombre,
                })}
          </p>
          {detalle}
        </div>
      </div>
    );

  if (v.estado === 'depende')
    return (
      <div class="flex gap-3 rounded-3xl border border-pendiente-borde bg-pendiente-fondo p-6 text-pendiente-texto">
        <MapPin class="mt-0.5 size-6 shrink-0" aria-hidden />
        <div class="grid gap-3">
          <p class="font-display text-lg font-semibold">{t('dependeTitulo')}</p>
          <p class="text-[0.9375rem]">
            {t('dependeTexto', { comunidades: otras })}
          </p>
        </div>
      </div>
    );

  return (
    <div class="flex gap-3 rounded-3xl border border-sindatos-borde bg-sindatos-fondo p-6 text-sindatos-texto">
      <ShieldQuestion class="mt-0.5 size-6 shrink-0" aria-hidden />
      <div class="grid gap-3">
        <p class="font-display text-lg font-semibold">
          {raza && c
            ? t('noTituloRaza', { raza: raza.nombre, comunidad: c.nombre })
            : t('noTitulo')}
        </p>
        <p class="text-[0.9375rem]">{t('noTexto')}</p>
        {otras ? (
          <p class="text-sm opacity-90">
            {t('otrasComunidades', { comunidades: otras })}
          </p>
        ) : null}
        {detalle}
      </div>
    </div>
  );
}
