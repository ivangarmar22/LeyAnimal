/**
 * Interacciones globales. Todo es mejora progresiva. Sin JavaScript el contenido se ve completo; solo se
 * pierden las animaciones. La clase .js la pone un script en linea del head.
 */
const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- Al imprimir, todo desplegado: las citas plegadas no saldrian en papel -
window.addEventListener('beforeprint', () => {
  for (const d of document.querySelectorAll('details')) d.open = true;
});
const punteroFino = window.matchMedia('(pointer: fine)').matches;

// --- Cabecera: fondo de cristal al hacer scroll ------------------------------
const cabecera = document.querySelector<HTMLElement>('.cabecera');
const alHacerScroll = () =>
  cabecera?.classList.toggle('con-scroll', window.scrollY > 8);
alHacerScroll();
window.addEventListener('scroll', alHacerScroll, { passive: true });

// --- Apariciones escalonadas al entrar en pantalla ----------------------------
document.querySelectorAll<HTMLElement>('[data-escalonado]').forEach((grupo) => {
  [...grupo.children].forEach((hijo, i) => {
    if (!(hijo instanceof HTMLElement)) return;
    if (!hijo.hasAttribute('data-aparece'))
      hijo.setAttribute('data-aparece', grupo.dataset.escalonado ?? '');
    hijo.style.setProperty('--i', String(i));
  });
});

const aparecen = document.querySelectorAll<HTMLElement>('[data-aparece]');
if ('IntersectionObserver' in window && !reducir) {
  const observador = new IntersectionObserver(
    (entradas) => {
      for (const entrada of entradas) {
        if (!entrada.isIntersecting) continue;
        entrada.target.classList.add('visible');
        observador.unobserve(entrada.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  aparecen.forEach((el) => observador.observe(el));
} else {
  aparecen.forEach((el) => el.classList.add('visible'));
}

// --- Foco de luz que sigue al cursor en tarjetas -----------------------------
if (punteroFino) {
  document.querySelectorAll<HTMLElement>('.foco-luz').forEach((tarjeta) => {
    tarjeta.addEventListener('pointermove', (e) => {
      const r = tarjeta.getBoundingClientRect();
      tarjeta.style.setProperty('--sx', `${e.clientX - r.left}px`);
      tarjeta.style.setProperty('--sy', `${e.clientY - r.top}px`);
    });
  });
}

// --- Maqueta del hero: las tarjetas flotantes siguen al raton --------------
// La ventana no se inclina: una transformacion 3D emborrona su texto.
const maqueta = document.querySelector<HTMLElement>('[data-inclina]');
if (maqueta && punteroFino && !reducir) {
  const zona = maqueta.closest('section') ?? maqueta;
  let fotograma = 0;
  let x = 0;
  let y = 0;
  const aplicar = () => {
    fotograma = 0;
    maqueta.style.setProperty('--mx', x.toFixed(3));
    maqueta.style.setProperty('--my', y.toFixed(3));
  };
  zona.addEventListener('pointermove', (e) => {
    const r = zona.getBoundingClientRect();
    x = (e.clientX - r.left) / r.width - 0.5;
    y = (e.clientY - r.top) / r.height - 0.5;
    if (!fotograma) fotograma = requestAnimationFrame(aplicar);
  });
  zona.addEventListener('pointerleave', () => {
    x = 0;
    y = 0;
    if (!fotograma) fotograma = requestAnimationFrame(aplicar);
  });
}

// --- Contadores con separador de miles ------------------------------------
const formatear = (n: number) =>
  Math.round(n).toLocaleString('es-ES', { useGrouping: 'always' });
document.querySelectorAll<HTMLElement>('[data-cuenta]').forEach((el) => {
  const objetivo = Number(el.dataset.cuenta);
  if (!Number.isFinite(objetivo) || reducir) return;
  let inicio: number | null = null;
  const tic = (t: number) => {
    inicio ??= t;
    const p = Math.min(1, Math.max(0, (t - inicio - 400) / 1500));
    el.textContent = formatear(objetivo * (1 - Math.pow(1 - p, 4)));
    if (p < 1) requestAnimationFrame(tic);
  };
  requestAnimationFrame(tic);
});
