/**
 * Une clases condicionales, sin fusionar utilidades: si dos clases chocan
 * (`hidden` e `inline-flex`), gana la que va despues en el CSS. Por eso los
 * componentes no reciben clases que choquen con las suyas.
 */
export function cn(...clases: (string | false | null | undefined)[]) {
  return clases.filter(Boolean).join(' ');
}
