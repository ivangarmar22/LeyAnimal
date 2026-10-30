import { ArrowLeft, ArrowRight, Dog, ShieldAlert } from 'lucide-preact';
import { useState } from 'preact/hooks';
import { ruta } from '@/lib/rutas';
import type { Traductor } from '@/i18n/traductor';
import { buscarRazas, esPpp, raza as buscarRaza } from '@/lib/datos/normativa';
import {
  SEXOS,
  TRIESTADO,
  USOS,
  type EstadoConsulta,
} from '@/lib/validacion/consulta';
import { Combobox } from '@/ui/Combobox';

type RazaElegida = { slug: string; nombre: string; ppp: boolean | null };

function Opciones<T extends string>({
  nombre,
  etiqueta,
  ayuda,
  opciones,
  valor,
  t,
}: {
  nombre: string;
  etiqueta: string;
  ayuda?: string;
  opciones: readonly T[];
  valor?: T;
  t: Traductor;
}) {
  return (
    <fieldset>
      <legend class="etiqueta">{etiqueta}</legend>
      {ayuda ? <p class="ayuda">{ayuda}</p> : null}
      <div class="flex flex-wrap gap-2">
        {opciones.map((opcion) => (
          <label key={opcion} class="opcion">
            <input
              type="radio"
              name={nombre}
              value={opcion}
              defaultChecked={valor === opcion}
            />
            {t(`opciones.${opcion}`)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Paso 3. Solo se muestran los campos que aplican a la especie, y "No lo se"
 * es siempre una respuesta valida. Es un formulario de verdad: se envia con
 * Enter y el boton, y el resultado se calcula al instante.
 */
export function PasoAnimal({
  estado,
  comunidad,
  t: tg,
  onEnviar,
  onAtras,
}: {
  estado: EstadoConsulta;
  /** Codigo de la comunidad del municipio, para saber si la raza es PPP alli. */
  comunidad: string | undefined;
  t: Traductor;
  onEnviar: (cambios: Partial<EstadoConsulta>) => void;
  onAtras: () => void;
}) {
  const t = tg.en('consulta.animal');
  const ta = tg.en('consulta.acciones');
  const inicial = estado.raza ? buscarRaza(estado.raza) : undefined;
  const pppDe = (slug: string) =>
    comunidad
      ? esPpp(slug, comunidad)
      : (buscarRaza(slug)?.esPppEstatal ?? null);
  const [raza, setRaza] = useState<RazaElegida | null>(
    inicial
      ? { slug: inicial.slug, nombre: inicial.nombre, ppp: pppDe(inicial.slug) }
      : null,
  );

  const esPerro = estado.especie === 'perro';
  const esGato = estado.especie === 'gato';

  function enviar(evento: SubmitEvent) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget as HTMLFormElement);
    const valor = (clave: string) => {
      const v = String(datos.get(clave) ?? '').trim();
      return v === '' ? undefined : v;
    };
    const numero = (clave: string, max: number) => {
      const v = valor(clave);
      const n = Number(v);
      return v !== undefined && Number.isInteger(n) && n >= 0 && n <= max
        ? n
        : undefined;
    };
    onEnviar({
      paso: 4,
      nombre: valor('nombre')?.slice(0, 40),
      edadAnios: numero('edadAnios', 40),
      edadMeses: numero('edadMeses', 11),
      raza: raza?.slug,
      ppp: raza?.ppp ? 'si' : (valor('ppp') as EstadoConsulta['ppp']),
      sexo: valor('sexo') as EstadoConsulta['sexo'],
      esterilizado: valor('esterilizado') as EstadoConsulta['esterilizado'],
      microchip: valor('microchip') as EstadoConsulta['microchip'],
      exterior: esGato
        ? (valor('exterior') as EstadoConsulta['exterior'])
        : undefined,
      uso: esPerro ? (valor('uso') as EstadoConsulta['uso']) : undefined,
      animalesHogar: numero('animalesHogar', 99),
    });
  }

  return (
    <form onSubmit={enviar} noValidate>
      <h2 class="titulo-3">{t('titulo')}</h2>
      <p class="mt-2">{t('texto')}</p>

      <div class="mt-8 grid gap-8">
        <div>
          <label for="nombre" class="etiqueta">
            {t('nombre')}{' '}
            <span class="font-normal text-texto-3">{t('opcional')}</span>
          </label>
          <p id="nombre-ayuda" class="ayuda">
            {t('nombreAyuda')}
          </p>
          <input
            id="nombre"
            name="nombre"
            type="text"
            maxLength={40}
            autoComplete="off"
            defaultValue={estado.nombre ?? ''}
            placeholder={t('nombreMarcador')}
            aria-describedby="nombre-ayuda"
            class="campo sm:max-w-sm"
          />
        </div>

        <fieldset>
          <legend class="etiqueta">{t('edad')}</legend>
          <p class="ayuda">{t('edadAyuda')}</p>
          <div class="flex gap-3 sm:max-w-sm">
            {(['edadAnios', 'edadMeses'] as const).map((campo) => (
              <div key={campo} class="flex-1">
                <label for={campo} class="mb-1.5 block text-sm text-texto-2">
                  {t(campo === 'edadAnios' ? 'anios' : 'meses')}
                </label>
                <input
                  id={campo}
                  name={campo}
                  type="number"
                  min={0}
                  max={campo === 'edadAnios' ? 40 : 11}
                  inputMode="numeric"
                  defaultValue={
                    estado[campo] === undefined ? '' : String(estado[campo])
                  }
                  class="campo cifras"
                />
              </div>
            ))}
          </div>
        </fieldset>

        {esPerro ? (
          <div class="grid gap-4">
            <Combobox
              textoInicial={raza?.nombre}
              buscar={(termino) =>
                buscarRazas(termino).map((r) => ({
                  valor: r.slug,
                  principal: r.nombre,
                }))
              }
              etiqueta={t('raza')}
              descripcion={t('razaAyuda')}
              marcador={t('razaMarcador')}
              sinResultados={t('razaSinResultados')}
              Icono={Dog}
              onElegir={(r) =>
                setRaza({
                  slug: r.valor,
                  nombre: r.principal,
                  ppp: pppDe(r.valor),
                })
              }
              onBorrar={() => setRaza(null)}
            />
            {/* Aviso inmediato, antes del resultado */}
            {raza?.ppp ? (
              <div
                class="flex gap-3 rounded-2xl border border-obligatorio-borde bg-obligatorio-fondo p-4 text-obligatorio-texto"
                role="status"
              >
                <ShieldAlert class="mt-0.5 size-5 shrink-0" aria-hidden />
                <p class="text-[0.9375rem]">
                  {t('razaPpp')}{' '}
                  <a
                    href={ruta('/perros-potencialmente-peligrosos')}
                    class="font-semibold underline underline-offset-2"
                  >
                    {t('razaPppEnlace')}
                  </a>
                </p>
              </div>
            ) : (
              <Opciones
                nombre="ppp"
                etiqueta={t('ppp')}
                ayuda={t('pppAyuda')}
                opciones={TRIESTADO}
                valor={estado.ppp}
                t={t}
              />
            )}
          </div>
        ) : null}

        <Opciones
          nombre="sexo"
          etiqueta={t('sexo')}
          opciones={SEXOS}
          valor={estado.sexo}
          t={t}
        />
        <Opciones
          nombre="esterilizado"
          etiqueta={t('esterilizado')}
          opciones={TRIESTADO}
          valor={estado.esterilizado}
          t={t}
        />
        <Opciones
          nombre="microchip"
          etiqueta={t('microchip')}
          opciones={TRIESTADO}
          valor={estado.microchip}
          t={t}
        />
        {esGato ? (
          <Opciones
            nombre="exterior"
            etiqueta={t('exterior')}
            opciones={TRIESTADO}
            valor={estado.exterior}
            t={t}
          />
        ) : null}
        {esPerro ? (
          <Opciones
            nombre="uso"
            etiqueta={t('uso')}
            opciones={USOS}
            valor={estado.uso}
            t={t}
          />
        ) : null}

        <div>
          <label for="animalesHogar" class="etiqueta">
            {t('animalesHogar')}{' '}
            <span class="font-normal text-texto-3">{t('opcional')}</span>
          </label>
          <input
            id="animalesHogar"
            name="animalesHogar"
            type="number"
            min={1}
            max={99}
            inputMode="numeric"
            defaultValue={
              estado.animalesHogar === undefined
                ? ''
                : String(estado.animalesHogar)
            }
            class="campo cifras w-32"
          />
        </div>
      </div>

      <div class="barra-accion lg:mt-10">
        <div class="flex items-center gap-3">
          <button
            type="button"
            onClick={onAtras}
            class="boton boton--contorno shrink-0 max-[420px]:w-[52px] max-[420px]:px-0"
          >
            <ArrowLeft aria-hidden />
            <span class="max-[420px]:sr-only">{ta('atras')}</span>
          </button>
          <button
            type="submit"
            class="boton boton--principal min-w-0 flex-1 lg:flex-none"
          >
            {ta('verResultado')}
            <ArrowRight aria-hidden />
          </button>
        </div>
      </div>
    </form>
  );
}
