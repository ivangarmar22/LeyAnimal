import { HelpCircle, ShieldAlert, ShieldQuestion } from 'lucide-preact';
import { useState } from 'preact/hooks';
import type { Idioma } from '@/i18n/idiomas';
import { crearTraductor, type Mensajes } from '@/i18n/traductor';

export type RazaVerificador = {
  slug: string;
  nombre: string;
  /** Por codigo de comunidad. null = no verificado. */
  porComunidad: Record<string, boolean | null>;
};

const OTRA = 'otra';

/**
 * Raza + comunidad -> si se considera PPP. "Otra raza" nunca se da por "no
 * es PPP" sin matices: tambien lo son los cruces, el anexo II y los perros
 * declarados por su conducta.
 */
export default function Verificador({
  idioma,
  textos,
  razas,
  comunidades,
}: {
  idioma: Idioma;
  textos: Mensajes;
  razas: RazaVerificador[];
  comunidades: { codigo: string; nombre: string }[];
}) {
  const t = crearTraductor(textos, idioma, 'ppp');
  const [raza, setRaza] = useState('');
  const [comunidad, setComunidad] = useState('');

  const elegida = razas.find((r) => r.slug === raza);
  const nombreComunidad = comunidades.find(
    (c) => c.codigo === comunidad,
  )?.nombre;
  const esPpp = elegida
    ? comunidad
      ? elegida.porComunidad[comunidad]
      : true
    : null;

  return (
    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
      <div class="grid gap-5">
        <div>
          <label for="ppp-raza" class="etiqueta">
            {t('raza')}
          </label>
          <select
            id="ppp-raza"
            value={raza}
            onChange={(e) => setRaza(e.currentTarget.value)}
            class="campo"
          >
            <option value="">{t('elegir')}</option>
            {razas.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.nombre}
              </option>
            ))}
            <option value={OTRA}>{t('razaOtra')}</option>
          </select>
        </div>
        <div>
          <label for="ppp-comunidad" class="etiqueta">
            {t('comunidad')}
          </label>
          <select
            id="ppp-comunidad"
            value={comunidad}
            onChange={(e) => setComunidad(e.currentTarget.value)}
            class="campo"
          >
            <option value="">{t('elegir')}</option>
            {comunidades.map((c) => (
              <option key={c.codigo} value={c.codigo}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div aria-live="polite">
        {!raza ? (
          <div class="flex min-h-40 items-center gap-4 rounded-3xl border border-dashed border-borde-fuerte p-6 text-texto-3">
            <HelpCircle class="size-6 shrink-0" aria-hidden />
            {t('pendienteElegir')}
          </div>
        ) : esPpp ? (
          <div class="grid gap-3 rounded-3xl border border-obligatorio-borde bg-obligatorio-fondo p-6 text-obligatorio-texto">
            <p class="flex items-center gap-3 font-display text-lg font-semibold">
              <ShieldAlert class="size-6 shrink-0" aria-hidden />
              {t('siTitulo', { raza: elegida?.nombre ?? '' })}
            </p>
            <p class="text-[0.9375rem]">{t('siTexto')}</p>
            {nombreComunidad ? (
              <p class="text-sm opacity-90">
                {t('autonomica', { comunidad: nombreComunidad })}
              </p>
            ) : null}
          </div>
        ) : (
          <div class="grid gap-3 rounded-3xl border border-sindatos-borde bg-sindatos-fondo p-6 text-sindatos-texto">
            <p class="flex items-center gap-3 font-display text-lg font-semibold">
              <ShieldQuestion class="size-6 shrink-0" aria-hidden />
              {t('noTitulo')}
            </p>
            <p class="text-[0.9375rem]">{t('noTexto')}</p>
            {nombreComunidad ? (
              <p class="text-sm opacity-90">
                {t('autonomica', { comunidad: nombreComunidad })}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
