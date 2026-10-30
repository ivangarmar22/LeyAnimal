import { CircleCheck, Info, Send } from 'lucide-preact';
import { useEffect, useState } from 'preact/hooks';
import { crearTraductor, type Mensajes } from '@/i18n/traductor';
import { WEB3FORMS } from '@/lib/sitio';

const TIPOS = [
  'falta_ordenanza',
  'dato_incorrecto',
  'enlace_roto',
  'sugerencia',
] as const;
type Tipo = (typeof TIPOS)[number];
const esTipo = (v: string | null): v is Tipo =>
  (TIPOS as readonly string[]).includes(v ?? '');

type Estado = 'listo' | 'enviando' | 'enviado' | 'fallo';
type CampoConError = 'mensaje' | 'email' | null;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Aviso de un error o de una ordenanza que falta. Se envia con Web3Forms, que
 * lo reenvia al correo del proyecto: la web no guarda nada (sin base de
 * datos, D50). Sin JavaScript, el formulario se envia igual por POST.
 *
 * Puede llegar precargado desde una ficha: ?tipo=falta_ordenanza&municipio=...
 */
export default function FormularioColabora({
  textos,
  email,
}: {
  textos: Mensajes;
  email: string;
}) {
  const t = crearTraductor(textos, 'colabora');
  const [tipo, setTipo] = useState<Tipo>('falta_ordenanza');
  const [municipio, setMunicipio] = useState('');
  const [error, setError] = useState<CampoConError>(null);
  const [estado, setEstado] = useState<Estado>('listo');

  // La pagina es estatica: la precarga se lee de la URL al montar.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('tipo');
    if (esTipo(t)) setTipo(t);
    setMunicipio(params.get('municipio')?.slice(0, 80) ?? '');
  }, []);

  async function enviar(evento: SubmitEvent) {
    evento.preventDefault();
    const formulario = evento.currentTarget as HTMLFormElement;
    const datos = new FormData(formulario);
    const texto = (clave: string) => String(datos.get(clave) ?? '').trim();
    if (!texto('mensaje')) return setError('mensaje');
    if (texto('email') && !EMAIL.test(texto('email'))) return setError('email');
    setError(null);
    setEstado('enviando');
    const nombreTipo = t(`tipos.${tipo}`);
    try {
      const respuesta = await fetch(WEB3FORMS.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          access_key: WEB3FORMS.clave,
          subject: t('asunto', { tipo: nombreTipo }),
          from_name: 'LeyAnimal',
          botcheck: datos.get('botcheck') ? true : '',
          tipo: nombreTipo,
          municipio: texto('municipio'),
          enlace: texto('url'),
          email: texto('email'),
          mensaje: texto('mensaje'),
        }),
      });
      const resultado = (await respuesta.json()) as { success?: boolean };
      if (!resultado.success) throw new Error('Web3Forms');
      formulario.reset();
      setMunicipio('');
      setEstado('enviado');
    } catch {
      setEstado('fallo');
    }
  }

  if (estado === 'enviado') {
    return (
      <div class="grid justify-items-start gap-4" role="status">
        <CircleCheck class="size-10 text-marca-600" aria-hidden />
        <h2 class="titulo-3">{t('enviadoTitulo')}</h2>
        <p>{t('enviadoTexto')}</p>
        <button
          type="button"
          class="boton boton--contorno"
          onClick={() => setEstado('listo')}
        >
          {t('otroAviso')}
        </button>
      </div>
    );
  }

  return (
    <form
      action={WEB3FORMS.url}
      method="post"
      onSubmit={enviar}
      noValidate
      class="grid gap-7"
    >
      <input type="hidden" name="access_key" value={WEB3FORMS.clave} />
      <input
        type="hidden"
        name="subject"
        value={t('asunto', { tipo: t(`tipos.${tipo}`) })}
      />
      {/* Trampa para bots: invisible para las personas */}
      <input
        type="checkbox"
        name="botcheck"
        class="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

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
          aria-invalid={error === 'mensaje' || undefined}
          aria-describedby={error === 'mensaje' ? 'mensaje-error' : undefined}
          class="campo"
          rows={6}
        />
        {error === 'mensaje' ? (
          <p
            id="mensaje-error"
            class="mt-2 text-sm font-medium text-obligatorio-texto"
            role="alert"
          >
            {t('error')}
          </p>
        ) : null}
      </div>

      <div class="md:max-w-[calc(50%-10px)]">
        <label for="email" class="etiqueta">
          {t('email')}{' '}
          <span class="font-normal text-texto-3">{t('opcional')}</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={120}
          aria-invalid={error === 'email' || undefined}
          aria-describedby={
            error === 'email' ? 'email-error email-ayuda' : 'email-ayuda'
          }
          class="campo"
        />
        <p id="email-ayuda" class="mt-2 text-sm text-texto-3">
          {t('emailAyuda')}
        </p>
        {error === 'email' ? (
          <p
            id="email-error"
            class="mt-2 text-sm font-medium text-obligatorio-texto"
            role="alert"
          >
            {t('emailError')}
          </p>
        ) : null}
      </div>

      <div class="grid gap-4">
        <button
          type="submit"
          class="boton boton--principal justify-self-start"
          disabled={estado === 'enviando'}
        >
          <Send aria-hidden />
          {estado === 'enviando' ? t('enviando') : t('enviar')}
        </button>
        {estado === 'fallo' ? (
          <p class="text-sm font-medium text-obligatorio-texto" role="alert">
            {t('fallo')}{' '}
            <a href={`mailto:${email}`} class="enlace-texto">
              {email}
            </a>
          </p>
        ) : null}
        <p class="flex gap-2.5 text-sm text-texto-3">
          <Info class="mt-0.5 size-4 shrink-0" aria-hidden />
          {t('comoFunciona')}
        </p>
      </div>
    </form>
  );
}
