/**
 * Guias de dudas frecuentes (D60). No tienen requisito en el motor: van por
 * puntos, con las mismas reglas que situaciones.ts. Texto en temas.<clave>.*
 */
import type { Punto } from './situaciones';

export type GuiaTema = {
  clave: string;
  /** Articulos de la introduccion (definiciones). */
  intro?: readonly string[];
  puntos: readonly Punto[];
};

const L7 = 'ley-7-2023-bienestar-animal';
const RD287 = 'rd-287-2002-animales-potencialmente-peligrosos';
const CC = 'codigo-civil';
const LPH = 'ley-49-1960-propiedad-horizontal';

export const GUIAS_TEMA: readonly GuiaTema[] = [
  {
    clave: 'solo-en-casa',
    puntos: [
      { clave: 'tiempo', estado: 'obligatorio', ids: [`${L7}#art. 27.i`] },
      { clave: 'supervision', estado: 'recomendado', ids: [] },
      {
        clave: 'terraza',
        estado: 'obligatorio',
        animales: ['perro', 'gato'],
        ids: [`${L7}#art. 27.e`, `${L7}#art. 74.o`],
      },
      {
        clave: 'fuera',
        estado: 'obligatorio',
        ids: [`${L7}#art. 26.b`, `${L7}#art. 28.1`],
      },
      { clave: 'atado', estado: 'obligatorio', ids: [`${L7}#art. 25.l`] },
      {
        clave: 'coche',
        estado: 'obligatorio',
        ids: [`${L7}#art. 24.2.d`, `${L7}#art. 60.2`],
      },
      {
        clave: 'calle',
        estado: 'obligatorio',
        ids: [`${L7}#art. 27.d`],
        enlace: '/temas/paseos',
      },
      {
        clave: 'vacaciones',
        estado: 'recomendado',
        ids: [],
        enlace: '/situaciones/vacaciones',
      },
    ],
  },
  {
    clave: 'paseos',
    puntos: [
      { clave: 'presente', estado: 'obligatorio', ids: [`${L7}#art. 27.d`] },
      {
        clave: 'correa',
        estado: 'depende',
        ids: [`${L7}#art. 25.d`],
        enlace: '/comunidades',
      },
      {
        clave: 'ppp',
        estado: 'obligatorio',
        animales: ['perro'],
        ppp: true,
        ids: [`${RD287}#art. 8.2`, `${RD287}#art. 8.3`],
        enlace: '/perros-potencialmente-peligrosos',
      },
      {
        clave: 'excrementos',
        estado: 'obligatorio',
        ids: [`${L7}#art. 26.e`],
      },
      { clave: 'molestias', estado: 'obligatorio', ids: [`${L7}#art. 26.c`] },
      {
        clave: 'danos',
        estado: 'obligatorio',
        ids: [`${L7}#art. 24.3`, `${CC}#art. 1905`],
        enlace: '/seguros',
      },
      {
        clave: 'vehiculo',
        estado: 'obligatorio',
        ids: [`${L7}#art. 27.f`],
      },
      {
        clave: 'colonias',
        estado: 'obligatorio',
        animales: ['perro'],
        ids: [`${L7}#art. 41.2`],
      },
      {
        clave: 'espacios',
        estado: 'depende',
        ids: [`${L7}#art. 29.7`],
      },
    ],
  },
  {
    clave: 'cria',
    puntos: [
      {
        clave: 'registro',
        estado: 'obligatorio',
        ids: [`${L7}#art. 26.d`, `${L7}#art. 53.1`, `${L7}#art. 27.k`],
      },
      { clave: 'puntual', estado: 'obligatorio', ids: [`${L7}#art. 53.2`] },
      {
        clave: 'evitar',
        estado: 'obligatorio',
        ids: [`${L7}#art. 26.d`, `${L7}#art. 26.i`],
        enlace: '/temas/esterilizacion',
      },
      { clave: 'camada', estado: 'depende', ids: [`${L7}#art. 51.1`] },
      {
        clave: 'identificados',
        estado: 'obligatorio',
        ids: [`${L7}#art. 27.m`],
      },
      {
        clave: 'edad',
        estado: 'obligatorio',
        animales: ['perro', 'gato', 'huron'],
        ids: [`${L7}#art. 55.7`, `${L7}#art. 58.3`],
      },
      {
        clave: 'internet',
        estado: 'obligatorio',
        ids: [`${L7}#art. 57.1`, `${L7}#art. 57.2`],
      },
      {
        clave: 'multas',
        estado: 'obligatorio',
        ids: [`${L7}#art. 75.f`, `${L7}#art. 76.1`],
        enlace: '/multas',
      },
    ],
  },
  {
    clave: 'especies',
    puntos: [
      {
        clave: 'listado',
        estado: 'obligatorio_pendiente_reglamento',
        ids: [`${L7}#art. 52.1`],
      },
      {
        clave: 'prohibidas',
        estado: 'obligatorio',
        ids: [`${L7}#disp. trans. 2.ª`],
      },
      {
        clave: 'condiciones',
        estado: 'obligatorio',
        ids: [`${L7}#art. 26.g`],
      },
      {
        clave: 'identificacion',
        estado: 'obligatorio',
        ids: [`${L7}#art. 51.2`, `${L7}#art. 51.1`],
        enlace: '/temas/identificacion',
      },
      {
        clave: 'tiendas',
        estado: 'obligatorio',
        ids: [`${L7}#art. 27.l`],
        enlace: '/situaciones/comprar-o-adoptar',
      },
      {
        clave: 'soltar',
        estado: 'obligatorio',
        ids: [`${L7}#art. 27.g`, `${L7}#art. 74.k`],
      },
    ],
  },
  {
    clave: 'educacion',
    puntos: [
      {
        clave: 'metodos',
        estado: 'obligatorio',
        ids: [`${L7}#art. 24.2.b`, `${L7}#art. 74.c`],
      },
      { clave: 'collares', estado: 'obligatorio', ids: [`${L7}#art. 27.ñ`] },
      {
        clave: 'mutilaciones',
        estado: 'obligatorio',
        ids: [`${L7}#art. 27.b`, `${L7}#art. 74.e`],
      },
      {
        clave: 'profesional',
        estado: 'obligatorio',
        ids: [`${L7}#art. 24.2.h`],
      },
      {
        clave: 'peleas',
        estado: 'obligatorio',
        ids: [`${L7}#art. 27.c`, `${L7}#art. 75.c`],
      },
      {
        clave: 'curso',
        estado: 'obligatorio_pendiente_reglamento',
        animales: ['perro'],
        ids: [`${L7}#art. 30.1`],
        enlace: '/temas/curso',
      },
    ],
  },
  {
    clave: 'gatos-comunitarios',
    intro: [`${L7}#art. 3.u`],
    puntos: [
      {
        clave: 'ayuntamiento',
        estado: 'obligatorio',
        ids: [`${L7}#art. 38.2`],
      },
      { clave: 'alimentar', estado: 'depende', ids: [`${L7}#art. 39.1.a`] },
      { clave: 'respetar', estado: 'obligatorio', ids: [`${L7}#art. 41.1`] },
      {
        clave: 'abandonar',
        estado: 'obligatorio',
        ids: [`${L7}#art. 42.3`, `${L7}#art. 74.k`],
      },
      { clave: 'retirar', estado: 'obligatorio', ids: [`${L7}#art. 42.6`] },
      {
        clave: 'perros',
        estado: 'obligatorio',
        ids: [`${L7}#art. 41.2`],
      },
      {
        clave: 'tuGato',
        estado: 'obligatorio',
        ids: [`${L7}#art. 26.i`],
        enlace: '/temas/esterilizacion',
      },
      {
        clave: 'perdido',
        estado: 'depende',
        ids: [`${L7}#art. 22.1`],
        enlace: '/que-hacer-si#encontrado',
      },
    ],
  },
  {
    clave: 'vecinos',
    puntos: [
      {
        clave: 'comunidad',
        estado: 'depende',
        ids: [`${LPH}#art. 7.2`],
      },
      { clave: 'zonas', estado: 'depende', ids: [] },
      { clave: 'alquiler', estado: 'depende', ids: [] },
      {
        clave: 'ruido',
        estado: 'obligatorio',
        ids: [`${L7}#art. 26.c`, `${LPH}#art. 7.2`],
      },
      {
        clave: 'terraza',
        estado: 'obligatorio',
        animales: ['perro', 'gato'],
        ids: [`${L7}#art. 27.e`],
        enlace: '/temas/solo-en-casa',
      },
      {
        clave: 'excrementos',
        estado: 'obligatorio',
        ids: [`${L7}#art. 26.e`],
      },
      {
        clave: 'danos',
        estado: 'obligatorio',
        ids: [`${L7}#art. 24.3`, `${CC}#art. 1905`],
        enlace: '/seguros',
      },
      {
        clave: 'numero',
        estado: 'depende',
        ids: [],
        enlace: '/comunidades',
      },
    ],
  },
  {
    clave: 'familia',
    intro: [`${CC}#art. 333 bis.1`],
    puntos: [
      { clave: 'convenio', estado: 'obligatorio', ids: [`${CC}#art. 90.1`] },
      { clave: 'control', estado: 'obligatorio', ids: [`${CC}#art. 90.2`] },
      { clave: 'juez', estado: 'obligatorio', ids: [`${CC}#art. 94 bis`] },
      {
        clave: 'provisional',
        estado: 'obligatorio',
        ids: [`${CC}#art. 103`],
      },
      { clave: 'pareja', estado: 'depende', ids: [] },
      { clave: 'herencia', estado: 'obligatorio', ids: [`${CC}#art. 914 bis`] },
      {
        clave: 'testamento',
        estado: 'recomendado',
        ids: [`${CC}#art. 914 bis`],
      },
      {
        clave: 'registro',
        estado: 'obligatorio',
        ids: [`${L7}#art. 24.2.i`],
      },
    ],
  },
];

export const guiaTema = (clave: string) =>
  GUIAS_TEMA.find((g) => g.clave === clave);
