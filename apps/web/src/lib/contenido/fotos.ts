import gatoVentana from '@/assets/fotos/gato-ventana.jpg';
import paseoCorrea from '@/assets/fotos/paseo-correa.jpg';
import perroSofa from '@/assets/fotos/perro-sofa.jpg';

/**
 * Fotografias de Unsplash (licencia Unsplash) y su autoria. Ver
 * src/assets/fotos/CREDITOS.md: ninguna es Unsplash+ de pago.
 */
export const FOTOS = {
  gatoVentana: {
    imagen: gatoVentana,
    autor: 'Sarah Windeler',
    url: 'https://unsplash.com/photos/7wNZYV2nHgc',
  },
  paseoCorrea: {
    imagen: paseoCorrea,
    autor: 'Megan Dujardin',
    url: 'https://unsplash.com/photos/o7TEuTMnLVI',
  },
  perroSofa: {
    imagen: perroSofa,
    autor: 'Robert Larsson',
    url: 'https://unsplash.com/photos/TkwzP_frzl4',
  },
} as const;
