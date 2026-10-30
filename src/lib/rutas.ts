/** Subcarpeta de publicacion sin barra final: '' o '/LeyAnimal' (GitHub Pages). */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Ruta publica de una pagina o fichero: '/consulta' -> '/LeyAnimal/consulta'. */
export const ruta = (href: string) => `${BASE}${href}`;
