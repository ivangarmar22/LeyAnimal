/**
 * Resultados legales con los datos reales de src/datos/. Si uno cambia, ha
 * cambiado lo que la web le dice a alguien: que sea a conciencia.
 */
import { describe, expect, it } from 'vitest';
import type { PerfilAnimal } from '@/lib/reglas';
import { evaluar } from './evaluacion';

const HOY = '2026-09-29';

/** Municipio, provincia y comunidad en codigos INE. */
const LUGARES = {
  madrid: { municipio: '28079', provincia: '28', comunidad: '13' },
  palma: { municipio: '07040', provincia: '07', comunidad: '04' },
  sevilla: { municipio: '41091', provincia: '41', comunidad: '01' },
  bilbao: { municipio: '48020', provincia: '48', comunidad: '16' },
  logrono: { municipio: '26089', provincia: '26', comunidad: '17' },
  valencia: { municipio: '46250', provincia: '46', comunidad: '10' },
  barcelona: { municipio: '08019', provincia: '08', comunidad: '09' },
  santiago: { municipio: '15078', provincia: '15', comunidad: '12' },
  valladolid: { municipio: '47186', provincia: '47', comunidad: '07' },
  ceuta: { municipio: '51001', provincia: '51', comunidad: '18' },
  melilla: { municipio: '52001', provincia: '52', comunidad: '19' },
} as const;

function resultado(
  lugar: keyof typeof LUGARES,
  clave: string,
  animal: Partial<PerfilAnimal> = {},
) {
  const perfil: PerfilAnimal = {
    especie: 'perro',
    edad_meses: 36,
    es_ppp: false,
    ...LUGARES[lugar],
    ...animal,
  };
  const o = evaluar(perfil, HOY).find((x) => x.requisito.clave === clave);
  if (!o) throw new Error(`No existe el requisito ${clave}`);
  return o;
}

const articulos = (o: ReturnType<typeof resultado>) =>
  o.fuentes.map((f) => f.articulo.id);

describe('Madrid tras la Ley 7/2024 (D54)', () => {
  it('el seguro es el estatal, pendiente de reglamento', () => {
    const o = resultado('madrid', 'seguro_rc_perros');
    expect(o.resultado.estado).toBe('obligatorio_pendiente_reglamento');
    expect(o.ambito).toBe('estatal');
  });

  it('la identificacion la exige la Ley 7/2023', () => {
    const o = resultado('madrid', 'identificacion_animales');
    expect(o.resultado.estado).toBe('obligatorio');
    expect(articulos(o)).toEqual(['ley-7-2023-bienestar-animal#art. 51.2']);
  });
});

describe('Identificacion estatal y autonomica (D52)', () => {
  it('en Baleares se citan la ley balear y la Ley 7/2023', () => {
    const o = resultado('palma', 'identificacion_animales');
    expect(o.resultado.estado).toBe('obligatorio');
    expect(o.ambito).toBe('autonomico');
    expect(articulos(o)).toEqual([
      'ley-animales-illes-balears#Artículo 14',
      'ley-7-2023-bienestar-animal#art. 51.2',
    ]);
  });

  it('un ave en Galicia tiene que estar anillada por la ley estatal', () => {
    const o = resultado('santiago', 'identificacion_animales', {
      especie: 'ave',
    });
    expect(o.resultado.estado).toBe('obligatorio');
    expect(o.ambito).toBe('estatal');
  });

  it('para un pez depende de un reglamento pendiente', () => {
    const o = resultado('madrid', 'identificacion_animales', {
      especie: 'pez',
    });
    expect(o.resultado.estado).toBe('obligatorio_pendiente_reglamento');
  });
});

describe('Censo municipal', () => {
  it('Baleares, Castilla y Leon y la Comunitat Valenciana lo exigen', () => {
    expect(resultado('palma', 'censo_municipal').resultado.estado).toBe(
      'obligatorio',
    );
    expect(resultado('valladolid', 'censo_municipal').resultado.estado).toBe(
      'obligatorio',
    );
    expect(
      resultado('valencia', 'censo_municipal', { especie: 'gato' }).resultado
        .estado,
    ).toBe('obligatorio');
  });

  it('en La Rioja no hay norma territorial: sin datos, nunca no aplica', () => {
    expect(resultado('logrono', 'censo_municipal').resultado.estado).toBe(
      'sin_datos',
    );
  });
});

describe('Perros de caza, pastoreo y trabajo (D55)', () => {
  it('no tienen el seguro ni el curso de la Ley 7/2023', () => {
    const caza = { uso: 'caza' };
    expect(resultado('madrid', 'seguro_rc_perros', caza).resultado.estado).toBe(
      'no_aplica',
    );
    expect(
      resultado('madrid', 'curso_tenencia_perros', caza).resultado.estado,
    ).toBe('no_aplica');
  });

  it('su identificacion no se da por no exigida', () => {
    const caza = { uso: 'caza' };
    expect(
      resultado('madrid', 'identificacion_animales', caza).resultado.estado,
    ).toBe('sin_datos');
    expect(
      resultado('sevilla', 'identificacion_animales', caza).resultado.estado,
    ).toBe('obligatorio');
  });

  it('el Pais Vasco exige seguro tambien a un perro de caza', () => {
    expect(
      resultado('bilbao', 'seguro_rc_perros', { uso: 'caza' }).resultado.estado,
    ).toBe('obligatorio');
  });

  it('un perro sin uso declarado es de compania', () => {
    expect(resultado('madrid', 'curso_tenencia_perros').resultado.estado).toBe(
      'obligatorio_pendiente_reglamento',
    );
  });
});

describe('Ceuta y Melilla: reglamentos de la ciudad (D34, D56)', () => {
  it('Ceuta exige microchip y censo a perros, gatos y hurones', () => {
    for (const clave of ['identificacion_animales', 'censo_municipal']) {
      const o = resultado('ceuta', clave, { especie: 'gato' });
      expect(o.resultado.estado).toBe('obligatorio');
      expect(o.ambito).toBe('municipal');
    }
  });

  it('Melilla exige microchip; el censo lo forman los veterinarios', () => {
    expect(
      resultado('melilla', 'identificacion_animales').resultado.estado,
    ).toBe('obligatorio');
    expect(resultado('melilla', 'censo_municipal').resultado.estado).toBe(
      'sin_datos',
    );
  });
});

describe('Perros potencialmente peligrosos por comunidad (D56)', () => {
  it('Andalucia: el doberman es PPP y el seguro es de 175.000 euros', () => {
    const o = resultado('sevilla', 'licencia_ppp', {
      raza: 'doberman',
      es_ppp: true,
    });
    expect(o.resultado.estado).toBe('obligatorio');
    expect(o.resultado.parametros.cobertura_minima_eur).toBe(175000);
    expect(articulos(o).slice(0, 2)).toEqual([
      'decreto-42-2008-perros-peligrosos-andalucia#Anexo',
      'decreto-42-2008-perros-peligrosos-andalucia#Artículo 4.2.f',
    ]);
  });

  it('Cataluña: 150.253,03 euros', () => {
    const o = resultado('barcelona', 'licencia_ppp', {
      raza: 'rottweiler',
      es_ppp: true,
    });
    expect(o.resultado.parametros.cobertura_minima_eur).toBe(150253.03);
  });

  it('Castilla y Leon: su seguro solo alcanza a las razas de su anexo', () => {
    const anexo = resultado('valladolid', 'licencia_ppp', {
      raza: 'dogo-del-tibet',
      es_ppp: true,
    });
    const akita = resultado('valladolid', 'licencia_ppp', {
      raza: 'akita-inu',
      es_ppp: true,
    });
    expect(anexo.resultado.parametros.cobertura_minima_eur).toBe(180303.63);
    expect(akita.resultado.parametros.cobertura_minima_eur).toBe(120000);
  });

  it('Madrid aplica la cuantia estatal', () => {
    const o = resultado('madrid', 'licencia_ppp', {
      raza: 'rottweiler',
      es_ppp: true,
    });
    expect(o.resultado.parametros.cobertura_minima_eur).toBe(120000);
  });
});
