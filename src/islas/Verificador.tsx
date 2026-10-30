import { HelpCircle, MapPin, ShieldAlert, ShieldQuestion } from 'lucide-preact';
import { useState } from 'preact/hooks';
import { crearTraductor, type Mensajes } from '@/i18n/traductor';

export type RazaVerificador = {
  slug: string;
  nombre: string;
  /** Si figura en el anexo I del RD 287/2002. */
  estatal: boolean;
  /** Por codigo de comunidad. null = no verificado. */
  porComunidad: Record<string, boolean | null>;
};

export type ComunidadVerificador = {
  codigo: string;
  nombre: string;
  /** Razas que añade su normativa, ya en texto; null si no añade. */
  razas: string | null;
  /** Norma de su lista propia, para citarla por su nombre. */
  norma: string | null;
  /** Seguro minimo si es mayor que el estatal, ya formateado. */
  seguro: string | null;
};

const OTRA = 'otra';

/**
 * Raza + comunidad -> si se considera PPP. "Otra raza" nunca se da por "no
 * es PPP" sin matices: tambien lo son los cruces, el anexo II y los perros
 * declarados por su conducta.
 */
export default function Verificador({
  textos,
  razas,
  comunidades,
}: {
  textos: Mensajes;
  razas: RazaVerificador[];
  comunidades: ComunidadVerificador[];
}) {
  const t = crearTraductor(textos, 'ppp');
  const [raza, setRaza] = useState('');
  const [comunidad, setComunidad] = useState('');

  const elegida = razas.find((r) => r.slug === raza);
  const c = comunidades.find((x) => x.codigo === comunidad);
  const lista = new Intl.ListFormat('es', { type: 'conjunction' });
  const dondeLoEs = elegida
    ? lista.format(
        comunidades
          .filter((x) => elegida.porComunidad[x.codigo])
          .map((x) => x.nombre),
      )
    : '';
  const estado: 'elegir' | 'si' | 'depende' | 'no' = !raza
    ? 'elegir'
    : !elegida
      ? 'no'
      : c
        ? elegida.porComunidad[c.codigo]
          ? 'si'
          : 'no'
        : elegida.estatal
          ? 'si'
          : 'depende';

  const detalle = c ? (
    <div class="grid gap-1 text-sm opacity-90">
      <p>
        {c.razas
          ? t('listaPropia', { comunidad: c.nombre, razas: c.razas })
          : t('listaEstatal', { comunidad: c.nombre })}
      </p>
      {c.seguro ? (
        <p>
          {t('seguroComunidad', { comunidad: c.nombre, importe: c.seguro })}
        </p>
      ) : null}
    </div>
  ) : null;

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
            {comunidades.map((x) => (
              <option key={x.codigo} value={x.codigo}>
                {x.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div aria-live="polite">
        {estado === 'elegir' ? (
          <div class="flex min-h-40 items-center gap-4 rounded-3xl border border-dashed border-borde-fuerte p-6 text-texto-3">
            <HelpCircle class="size-6 shrink-0" aria-hidden />
            {t('pendienteElegir')}
          </div>
        ) : estado === 'si' ? (
          <div class="flex gap-3 rounded-3xl border border-obligatorio-borde bg-obligatorio-fondo p-6 text-obligatorio-texto">
            <ShieldAlert class="mt-0.5 size-6 shrink-0" aria-hidden />
            <div class="grid gap-3">
              <p class="font-display text-lg font-semibold">
                {t('siTitulo', { raza: elegida?.nombre ?? '' })}
              </p>
              <p class="text-[0.9375rem]">
                {elegida?.estatal || !c
                  ? t('siTexto')
                  : t('siTextoAutonomico', {
                      norma: c.norma ?? '',
                      comunidad: c.nombre,
                    })}
              </p>
              {detalle}
            </div>
          </div>
        ) : estado === 'depende' ? (
          <div class="flex gap-3 rounded-3xl border border-pendiente-borde bg-pendiente-fondo p-6 text-pendiente-texto">
            <MapPin class="mt-0.5 size-6 shrink-0" aria-hidden />
            <div class="grid gap-3">
              <p class="font-display text-lg font-semibold">
                {t('dependeTitulo')}
              </p>
              <p class="text-[0.9375rem]">
                {t('dependeTexto', { comunidades: dondeLoEs })}
              </p>
            </div>
          </div>
        ) : (
          <div class="flex gap-3 rounded-3xl border border-sindatos-borde bg-sindatos-fondo p-6 text-sindatos-texto">
            <ShieldQuestion class="mt-0.5 size-6 shrink-0" aria-hidden />
            <div class="grid gap-3">
              <p class="font-display text-lg font-semibold">{t('noTitulo')}</p>
              <p class="text-[0.9375rem]">{t('noTexto')}</p>
              {elegida && dondeLoEs ? (
                <p class="text-sm opacity-90">
                  {t('otrasComunidades', { comunidades: dondeLoEs })}
                </p>
              ) : null}
              {detalle}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
