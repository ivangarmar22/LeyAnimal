import { HelpCircle } from 'lucide-preact';
import { useState } from 'preact/hooks';
import { crearTraductor, type Mensajes } from '@/i18n/traductor';
import { VeredictoPpp } from '@/ui/VeredictoPpp';

export type OpcionVerificador = { valor: string; nombre: string };

const OTRA = 'otra';

/** Raza + comunidad -> si se considera PPP. */
export default function Verificador({
  textos,
  razas,
  comunidades,
}: {
  textos: Mensajes;
  razas: OpcionVerificador[];
  comunidades: OpcionVerificador[];
}) {
  const t = crearTraductor(textos, 'ppp');
  const [raza, setRaza] = useState('');
  const [comunidad, setComunidad] = useState('');

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
              <option key={r.valor} value={r.valor}>
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
              <option key={x.valor} value={x.valor}>
                {x.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div aria-live="polite">
        {raza ? (
          <VeredictoPpp
            raza={raza === OTRA ? null : raza}
            comunidad={comunidad || null}
            t={t}
          />
        ) : (
          <div class="flex min-h-40 items-center gap-4 rounded-3xl border border-dashed border-borde-fuerte p-6 text-texto-3">
            <HelpCircle class="size-6 shrink-0" aria-hidden />
            {t('pendienteElegir')}
          </div>
        )}
      </div>
    </div>
  );
}
