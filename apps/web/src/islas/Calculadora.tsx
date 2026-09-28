import { Gavel } from 'lucide-preact';
import { useState } from 'preact/hooks';
import type { Idioma } from '@/i18n/idiomas';
import { crearTraductor, type Mensajes } from '@/i18n/traductor';
import type { Articulo, Norma } from '@/lib/datos/tipos';
import { cn } from '@/lib/cn';
import { CitaLegal } from '@/ui/CitaLegal';

export type Regimen = 'general' | 'especial';
export type Gravedad = 'leve' | 'grave' | 'muyGrave';
type Fuente = { norma: Norma; articulo: Articulo };
export type Infraccion = {
  clave: string;
  regimen: Regimen;
  gravedad: Gravedad;
  fuente: Fuente;
};

/** Clave del catalogo con el tramo literal de cada ley y gravedad. */
const TRAMO: Record<Regimen, Record<Gravedad, string>> = {
  general: { leve: 't7leve', grave: 't7grave', muyGrave: 't7muyGrave' },
  especial: { leve: 't50leve', grave: 't50grave', muyGrave: 't50muyGrave' },
};

const COLOR: Record<Gravedad, string> = {
  leve: 'border-pendiente-borde bg-pendiente-fondo text-pendiente-texto',
  grave: 'border-obligatorio-borde bg-obligatorio-fondo text-obligatorio-texto',
  muyGrave:
    'border-obligatorio-texto bg-obligatorio-fondo text-obligatorio-texto',
};

/**
 * Infraccion -> clasificacion + tramo. El tramo que se muestra resume el
 * articulo de sanciones, y debajo va el texto literal de los dos articulos:
 * el que clasifica la conducta y el que fija la cuantia.
 */
export default function Calculadora({
  idioma,
  textos,
  infracciones,
  tramos,
}: {
  idioma: Idioma;
  textos: Mensajes;
  infracciones: Infraccion[];
  tramos: Record<Regimen, Fuente>;
}) {
  const tg = crearTraductor(textos, idioma);
  const t = tg.en('multas');
  const [regimen, setRegimen] = useState<Regimen>('general');
  const [clave, setClave] = useState('');
  const disponibles = infracciones.filter((i) => i.regimen === regimen);
  const elegida = disponibles.find((i) => i.clave === clave);

  return (
    <div class="grid gap-8">
      <fieldset>
        <legend class="etiqueta">{t('regimen')}</legend>
        <div class="flex flex-wrap gap-2">
          {(['general', 'especial'] as const).map((r) => (
            <label key={r} class="opcion">
              <input
                type="radio"
                name="regimen"
                value={r}
                checked={regimen === r}
                onChange={() => {
                  setRegimen(r);
                  setClave('');
                }}
              />
              {t(r)}
            </label>
          ))}
        </div>
      </fieldset>

      <div class="max-w-xl">
        <label for="infraccion" class="etiqueta">
          {t('infraccion')}
        </label>
        <select
          id="infraccion"
          value={clave}
          onChange={(e) => setClave(e.currentTarget.value)}
          class="campo"
        >
          <option value="">{t('elegir')}</option>
          {disponibles.map((i) => (
            <option key={i.clave} value={i.clave}>
              {t(`i.${i.clave}`)}
            </option>
          ))}
        </select>
      </div>

      <div aria-live="polite">
        {!elegida ? (
          <p class="flex items-center gap-3 rounded-2xl border border-dashed border-borde-fuerte p-6 text-texto-3">
            <Gavel class="size-6 shrink-0" aria-hidden />
            {t('vacio')}
          </p>
        ) : (
          <div class="grid gap-8">
            <div class="grid gap-4 sm:grid-cols-2">
              <div
                class={cn('rounded-2xl border p-5', COLOR[elegida.gravedad])}
              >
                <p class="text-[0.8125rem] font-semibold opacity-90">
                  {t('clasificacion')}
                </p>
                <p class="mt-2 font-display text-2xl font-semibold">
                  {t(elegida.gravedad)}
                </p>
              </div>
              <div class="rounded-2xl border border-marca-100 bg-marca-50 p-5">
                <p class="rotulo">{t('tramo')}</p>
                <p class="cifras mt-2 font-display text-2xl font-semibold text-marca-700">
                  {t(TRAMO[elegida.regimen][elegida.gravedad])}
                </p>
              </div>
            </div>
            <div class="grid gap-3">
              <p class="rotulo">{t('porQue')}</p>
              <CitaLegal
                norma={elegida.fuente.norma}
                articulo={elegida.fuente.articulo}
                t={tg}
              />
            </div>
            <div class="grid gap-3">
              <p class="rotulo">{t('cuanto')}</p>
              <CitaLegal
                norma={tramos[elegida.regimen].norma}
                articulo={tramos[elegida.regimen].articulo}
                t={tg}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
