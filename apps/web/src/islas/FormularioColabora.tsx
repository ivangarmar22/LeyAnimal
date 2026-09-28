import { Info, Mail } from 'lucide-preact';
import { useEffect, useState } from 'preact/hooks';
import type { Idioma } from '@/i18n/idiomas';
import { crearTraductor, type Mensajes } from '@/i18n/traductor';

const TIPOS = [
  'falta_ordenanza',
  'dato_incorrecto',
  'enlace_roto',
  'sugerencia',
] as const;
type Tipo = (typeof TIPOS)[number];
const esTipo = (v: string | null): v is Tipo =>
  (TIPOS as readonly string[]).includes(v ?? '');

/**
 * El formulario no envia nada a ningun servidor: compone el correo y abre el
 * programa de correo de la persona (V1 sin base de datos, D39). Sin
 * JavaScript, el navegador hace lo mismo con action="mailto:".
 *
 * Puede llegar precargado desde una ficha: ?tipo=falta_ordenanza&municipio=...
 */
export default function FormularioColabora({
  idioma,
  textos,
  email,
  provisional,
}: {
  idioma: Idioma;
  textos: Mensajes;
  email: string;
  provisional: boolean;
}) {
  const t = crearTraductor(textos, idioma, 'colabora');
  const [tipo, setTipo] = useState<Tipo>('falta_ordenanza');
  const [municipio, setMunicipio] = useState('');
  const [error, setError] = useState(false);

  // La pagina es estatica: la precarga se lee de la URL al montar.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('tipo');
    if (esTipo(t)) setTipo(t);
    setMunicipio(params.get('municipio')?.slice(0, 80) ?? '');
  }, []);

  function enviar(evento: SubmitEvent) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget as HTMLFormElement);
    const texto = (clave: string) => String(datos.get(clave) ?? '').trim();
    if (!texto('mensaje')) {
      setError(true);
      return;
    }
    setError(false);
    const nombreTipo = t(`tipos.${tipo}`);
    const cuerpo = [
      `${t('cuerpoTipo')}: ${nombreTipo}`,
      texto('municipio')
        ? `${t('cuerpoMunicipio')}: ${texto('municipio')}`
        : null,
      texto('url') ? `${t('cuerpoUrl')}: ${texto('url')}` : null,
      '',
      `${t('cuerpoMensaje')}:`,
      texto('mensaje'),
    ]
      .filter((linea) => linea !== null)
      .join('\n');
    const asunto = t('asunto', { tipo: nombreTipo });
    window.location.assign(
      `mailto:${email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`,
    );
  }

  return (
    <form
      action={`mailto:${email}`}
      method="post"
      encType="text/plain"
      onSubmit={enviar}
      noValidate
      class="grid gap-7"
    >
      <fieldset>
        <legend class="etiqueta">{t('tipo')}</legend>
        <div class="flex flex-wrap gap-2">
          {TIPOS.map((valor) => (
            <label key={valor} class="opcion">
              <input
                type="radio"
                name="tipo"
                value={valor}
                checked={tipo === valor}
                onChange={() => setTipo(valor)}
              />
              {t(`tipos.${valor}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <div class="grid gap-5 md:grid-cols-2">
        <div>
          <label for="municipio" class="etiqueta">
            {t('municipio')}{' '}
            <span class="font-normal text-texto-3">{t('opcional')}</span>
          </label>
          <input
            id="municipio"
            name="municipio"
            type="text"
            maxLength={80}
            value={municipio}
            onInput={(e) => setMunicipio(e.currentTarget.value)}
            class="campo"
          />
        </div>
        <div>
          <label for="url" class="etiqueta">
            {t('url')}{' '}
            <span class="font-normal text-texto-3">{t('opcional')}</span>
          </label>
          <input
            id="url"
            name="url"
            type="url"
            inputMode="url"
            maxLength={300}
            aria-describedby="url-ayuda"
            class="campo"
          />
          <p id="url-ayuda" class="mt-2 text-sm text-texto-3">
            {t('urlAyuda')}
          </p>
        </div>
      </div>

      <div>
        <label for="mensaje" class="etiqueta">
          {t('mensaje')}
        </label>
        <textarea
          id="mensaje"
          name="mensaje"
          required
          maxLength={3000}
          aria-invalid={error || undefined}
          aria-describedby={error ? 'mensaje-error' : undefined}
          class="campo"
          rows={6}
        />
        {error ? (
          <p
            id="mensaje-error"
            class="mt-2 text-sm font-medium text-obligatorio-texto"
            role="alert"
          >
            {t('error')}
          </p>
        ) : null}
      </div>

      <div class="grid gap-4">
        <button type="submit" class="boton boton--principal justify-self-start">
          <Mail aria-hidden />
          {t('enviar')}
        </button>
        <p class="flex gap-2.5 text-sm text-texto-3">
          <Info class="mt-0.5 size-4 shrink-0" aria-hidden />
          {t('comoFunciona')}
        </p>
        {provisional ? (
          <p class="rounded-2xl border border-pendiente-borde bg-pendiente-fondo p-4 text-sm text-pendiente-texto">
            {t('provisional')}
          </p>
        ) : null}
      </div>
    </form>
  );
}
