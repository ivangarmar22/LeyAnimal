import { describe, expect, it } from 'vitest';
import { evaluarRequisito, evaluarRequisitos } from './resolver';
import type {
  Condicion,
  PerfilAnimal,
  ReglaRequisito,
  Requisito,
} from './tipos';

const SIEMPRE: Condicion = { all: [] };
const HOY = '2026-09-04';

const seguro: Requisito = { id: 'req-seguro', clave: 'seguro_rc' };
const censo: Requisito = {
  id: 'req-censo',
  clave: 'censo_municipal',
  exigeNormaTerritorial: true,
};

function regla(
  parcial: Partial<ReglaRequisito> & { id: string },
): ReglaRequisito {
  return {
    requisitoId: seguro.id,
    ambito: 'estatal',
    condiciones: SIEMPRE,
    estado: 'obligatorio',
    ...parcial,
  };
}

const enMalaga: PerfilAnimal = {
  especie: 'perro',
  comunidad: 'ccaa-01',
  provincia: 'prov-29',
  municipio: 'mun-29067',
};

describe('especificidad territorial', () => {
  it('municipal gana a provincial, autonomico y estatal', () => {
    const reglas = [
      regla({ id: 'e', ambito: 'estatal', estado: 'obligatorio' }),
      regla({
        id: 'a',
        ambito: 'autonomico',
        comunidad: 'ccaa-01',
        estado: 'recomendado',
      }),
      regla({
        id: 'p',
        ambito: 'provincial',
        provincia: 'prov-29',
        estado: 'no_aplica',
      }),
      regla({
        id: 'm',
        ambito: 'municipal',
        municipio: 'mun-29067',
        estado: 'recomendado',
      }),
    ];
    const r = evaluarRequisito(seguro, reglas, enMalaga, { fecha: HOY });
    expect(r.reglaGanadoraId).toBe('m');
    expect(r.estado).toBe('recomendado');
  });

  it('una regla municipal de otro municipio no se aplica', () => {
    const reglas = [
      regla({ id: 'e', ambito: 'estatal', estado: 'recomendado' }),
      regla({
        id: 'otro',
        ambito: 'municipal',
        municipio: 'mun-41091',
        estado: 'obligatorio',
      }),
    ];
    const r = evaluarRequisito(seguro, reglas, enMalaga, { fecha: HOY });
    expect(r.reglaGanadoraId).toBe('e');
    expect(r.traza.find((p) => p.reglaId === 'otro')?.motivo).toBe(
      'territorio_distinto',
    );
  });

  it('lo autonomico gana a lo estatal aunque sea menos restrictivo', () => {
    const reglas = [
      regla({ id: 'e', ambito: 'estatal', estado: 'obligatorio' }),
      regla({
        id: 'a',
        ambito: 'autonomico',
        comunidad: 'ccaa-01',
        estado: 'no_aplica',
      }),
    ];
    const r = evaluarRequisito(seguro, reglas, enMalaga, { fecha: HOY });
    expect(r.estado).toBe('no_aplica');
    expect(r.traza.find((p) => p.reglaId === 'e')?.motivo).toBe(
      'menos_especifica',
    );
  });
});

describe('la mas restrictiva a igual especificidad', () => {
  it('obligatorio gana a pendiente de reglamento, recomendado y no aplica', () => {
    const reglas = [
      regla({ id: 'r1', estado: 'no_aplica' }),
      regla({ id: 'r2', estado: 'recomendado' }),
      regla({ id: 'r3', estado: 'obligatorio_pendiente_reglamento' }),
      regla({ id: 'r4', estado: 'obligatorio' }),
    ];
    const r = evaluarRequisito(seguro, reglas, enMalaga, { fecha: HOY });
    expect(r.estado).toBe('obligatorio');
    expect(r.reglaGanadoraId).toBe('r4');
  });

  it('pendiente de reglamento gana a recomendado', () => {
    const reglas = [
      regla({ id: 'r1', estado: 'recomendado' }),
      regla({ id: 'r2', estado: 'obligatorio_pendiente_reglamento' }),
    ];
    expect(
      evaluarRequisito(seguro, reglas, enMalaga, { fecha: HOY }).estado,
    ).toBe('obligatorio_pendiente_reglamento');
  });
});

describe('desempates', () => {
  it('gana la de mayor prioridad', () => {
    const reglas = [
      regla({ id: 'baja', estado: 'obligatorio', prioridad: 1 }),
      regla({ id: 'alta', estado: 'obligatorio', prioridad: 9 }),
    ];
    const r = evaluarRequisito(seguro, reglas, enMalaga, { fecha: HOY });
    expect(r.reglaGanadoraId).toBe('alta');
    expect(r.traza.find((p) => p.reglaId === 'baja')?.motivo).toBe(
      'menor_prioridad',
    );
  });

  it('a igual prioridad gana la vigencia mas reciente', () => {
    const reglas = [
      regla({ id: 'vieja', estado: 'obligatorio', vigenteDesde: '2020-01-01' }),
      regla({ id: 'nueva', estado: 'obligatorio', vigenteDesde: '2026-01-01' }),
    ];
    expect(
      evaluarRequisito(seguro, reglas, enMalaga, { fecha: HOY })
        .reglaGanadoraId,
    ).toBe('nueva');
  });
});

describe('vigencia', () => {
  it('descarta una regla que aun no ha entrado en vigor', () => {
    const reglas = [regla({ id: 'futura', vigenteDesde: '2027-01-01' })];
    const r = evaluarRequisito(seguro, reglas, enMalaga, { fecha: HOY });
    expect(r.estado).toBe('sin_datos');
    expect(r.traza[0]?.motivo).toBe('fuera_de_vigencia');
  });

  it('descarta una regla derogada', () => {
    const reglas = [regla({ id: 'derogada', vigenteHasta: '2023-12-31' })];
    expect(
      evaluarRequisito(seguro, reglas, enMalaga, { fecha: HOY }).estado,
    ).toBe('sin_datos');
  });

  it('la fecha de consulta manda: la misma regla cambia con el tiempo', () => {
    const reglas = [
      regla({ id: 'antes', estado: 'recomendado', vigenteHasta: '2026-02-28' }),
      regla({
        id: 'despues',
        estado: 'obligatorio',
        vigenteDesde: '2026-03-01',
      }),
    ];
    expect(
      evaluarRequisito(seguro, reglas, enMalaga, { fecha: '2026-01-15' })
        .estado,
    ).toBe('recomendado');
    expect(
      evaluarRequisito(seguro, reglas, enMalaga, { fecha: '2026-06-15' })
        .estado,
    ).toBe('obligatorio');
  });
});

describe('sin_datos', () => {
  it('sin reglas aplicables no dice "no aplica", dice que no lo sabe', () => {
    const r = evaluarRequisito(seguro, [], enMalaga, { fecha: HOY });
    expect(r.estado).toBe('sin_datos');
    expect(r.reglaGanadoraId).toBeNull();
  });

  it('un requisito que depende del municipio sin ordenanza cargada es sin_datos', () => {
    const reglas = [
      regla({
        id: 'e',
        requisitoId: censo.id,
        ambito: 'estatal',
        estado: 'obligatorio',
      }),
    ];
    const r = evaluarRequisito(censo, reglas, enMalaga, { fecha: HOY });
    expect(r.estado).toBe('sin_datos');
    expect(r.traza.at(-1)?.explicacion).toContain('ayuntamiento');
  });

  it('el mismo requisito si resuelve cuando hay ordenanza municipal', () => {
    const reglas = [
      regla({
        id: 'e',
        requisitoId: censo.id,
        ambito: 'estatal',
        estado: 'obligatorio',
      }),
      regla({
        id: 'm',
        requisitoId: censo.id,
        ambito: 'municipal',
        municipio: 'mun-29067',
        estado: 'obligatorio',
      }),
    ];
    const r = evaluarRequisito(censo, reglas, enMalaga, { fecha: HOY });
    expect(r.estado).toBe('obligatorio');
    expect(r.reglaGanadoraId).toBe('m');
  });
});

describe('datos que el usuario desconoce', () => {
  const sinSaberSiEstaEsterilizado: PerfilAnimal = {
    ...enMalaga,
    esterilizado: null,
  };

  it('una regla indeterminada que habria ganado deja el resultado en sin_datos', () => {
    const reglas = [
      regla({ id: 'e', ambito: 'estatal', estado: 'no_aplica' }),
      regla({
        id: 'm',
        ambito: 'municipal',
        municipio: 'mun-29067',
        estado: 'obligatorio',
        condiciones: { campo: 'esterilizado', op: 'eq', valor: false },
      }),
    ];
    const r = evaluarRequisito(seguro, reglas, sinSaberSiEstaEsterilizado, {
      fecha: HOY,
    });
    expect(r.estado).toBe('sin_datos');
    expect(r.faltanDatosDelUsuario).toBe(true);
  });

  it('una regla indeterminada que NO habria ganado no estropea el resultado', () => {
    const reglas = [
      regla({
        id: 'm',
        ambito: 'municipal',
        municipio: 'mun-29067',
        estado: 'obligatorio',
      }),
      regla({
        id: 'e',
        ambito: 'estatal',
        estado: 'recomendado',
        condiciones: { campo: 'esterilizado', op: 'eq', valor: false },
      }),
    ];
    const r = evaluarRequisito(seguro, reglas, sinSaberSiEstaEsterilizado, {
      fecha: HOY,
    });
    expect(r.estado).toBe('obligatorio');
    expect(r.reglaGanadoraId).toBe('m');
    // Se sigue avisando de que hay datos sin rellenar.
    expect(r.faltanDatosDelUsuario).toBe(true);
  });

  it('no saber donde vives no permite afirmar que una norma local no te afecta', () => {
    const sinMunicipio: PerfilAnimal = { especie: 'perro' };
    const reglas = [
      regla({ id: 'e', ambito: 'estatal', estado: 'no_aplica' }),
      regla({
        id: 'm',
        ambito: 'municipal',
        municipio: 'mun-29067',
        estado: 'obligatorio',
      }),
    ];
    const r = evaluarRequisito(seguro, reglas, sinMunicipio, { fecha: HOY });
    expect(r.estado).toBe('sin_datos');
  });

  it('una norma local de otra comunidad no aplica aunque no se sepa el municipio', () => {
    const enOtraComunidad: PerfilAnimal = { especie: 'perro', comunidad: '04' };
    const reglas = [
      regla({ id: 'e', ambito: 'estatal', estado: 'no_aplica' }),
      regla({
        id: 'm',
        ambito: 'municipal',
        comunidad: '18',
        provincia: '51',
        municipio: '51001',
        estado: 'obligatorio',
      }),
    ];
    const r = evaluarRequisito(seguro, reglas, enOtraComunidad, { fecha: HOY });
    expect(r.estado).toBe('no_aplica');
  });
});

describe('razas potencialmente peligrosas por comunidad', () => {
  // Datos inventados a proposito para probar el mecanismo: lo que se comprueba
  // es que la MISMA raza pueda tener distinta consideracion segun la comunidad.
  const licencia: Requisito = { id: 'req-licencia', clave: 'licencia_ppp' };

  const reglas: ReglaRequisito[] = [
    {
      id: 'ccaa-a',
      requisitoId: licencia.id,
      ambito: 'autonomico',
      comunidad: 'ccaa-A',
      condiciones: { campo: 'raza', op: 'in', valor: ['raza-x'] },
      estado: 'obligatorio',
      parametros: { cobertura_minima_eur: 120000 },
    },
    {
      id: 'ccaa-b',
      requisitoId: licencia.id,
      ambito: 'autonomico',
      comunidad: 'ccaa-B',
      condiciones: { campo: 'raza', op: 'in', valor: ['raza-y'] },
      estado: 'obligatorio',
    },
  ];

  it('la misma raza obliga en una comunidad y no en otra', () => {
    const enA: PerfilAnimal = {
      especie: 'perro',
      raza: 'raza-x',
      comunidad: 'ccaa-A',
    };
    const enB: PerfilAnimal = {
      especie: 'perro',
      raza: 'raza-x',
      comunidad: 'ccaa-B',
    };

    expect(evaluarRequisito(licencia, reglas, enA, { fecha: HOY }).estado).toBe(
      'obligatorio',
    );
    // En B hay regla verificada y esa raza no esta en su lista: se ha podido
    // evaluar y ha dicho que no, asi que si lo sabemos.
    expect(evaluarRequisito(licencia, reglas, enB, { fecha: HOY }).estado).toBe(
      'no_aplica',
    );
  });

  it('la regla ganadora arrastra sus parametros', () => {
    const enA: PerfilAnimal = {
      especie: 'perro',
      raza: 'raza-x',
      comunidad: 'ccaa-A',
    };
    const r = evaluarRequisito(licencia, reglas, enA, { fecha: HOY });
    expect(r.parametros).toEqual({ cobertura_minima_eur: 120000 });
  });
});

describe('condiciones de edad y de acceso al exterior', () => {
  const esterilizacion: Requisito = {
    id: 'req-esteril',
    clave: 'esterilizacion',
  };

  it('la edad discrimina correctamente', () => {
    const reglas = [
      regla({
        id: 'adulto',
        requisitoId: esterilizacion.id,
        ambito: 'autonomico',
        comunidad: 'ccaa-01',
        condiciones: { campo: 'edad_meses', op: 'gte', valor: 6 },
        estado: 'obligatorio',
      }),
    ];
    const cachorro: PerfilAnimal = { ...enMalaga, edad_meses: 3 };
    const adulto: PerfilAnimal = { ...enMalaga, edad_meses: 24 };

    expect(
      evaluarRequisito(esterilizacion, reglas, cachorro, { fecha: HOY }).estado,
    ).toBe('no_aplica');
    expect(
      evaluarRequisito(esterilizacion, reglas, adulto, { fecha: HOY }).estado,
    ).toBe('obligatorio');
  });

  it('el gato con acceso al exterior recibe una regla distinta', () => {
    const reglas = [
      regla({
        id: 'gato-exterior',
        requisitoId: esterilizacion.id,
        ambito: 'autonomico',
        comunidad: 'ccaa-01',
        condiciones: {
          all: [
            { campo: 'especie', op: 'eq', valor: 'gato' },
            { campo: 'acceso_exterior', op: 'eq', valor: true },
          ],
        },
        estado: 'obligatorio',
      }),
    ];

    const gatoFuera: PerfilAnimal = {
      ...enMalaga,
      especie: 'gato',
      acceso_exterior: true,
    };
    const gatoDentro: PerfilAnimal = {
      ...enMalaga,
      especie: 'gato',
      acceso_exterior: false,
    };
    const gatoNoSeSabe: PerfilAnimal = {
      ...enMalaga,
      especie: 'gato',
      acceso_exterior: null,
    };

    expect(
      evaluarRequisito(esterilizacion, reglas, gatoFuera, { fecha: HOY })
        .estado,
    ).toBe('obligatorio');
    expect(
      evaluarRequisito(esterilizacion, reglas, gatoDentro, { fecha: HOY })
        .estado,
    ).toBe('no_aplica');

    const dudoso = evaluarRequisito(esterilizacion, reglas, gatoNoSeSabe, {
      fecha: HOY,
    });
    expect(dudoso.estado).toBe('sin_datos');
    expect(dudoso.faltanDatosDelUsuario).toBe(true);
  });
});

describe('traza', () => {
  it('deja constancia de todas las reglas evaluadas y de la ganadora', () => {
    const reglas = [
      regla({ id: 'e', ambito: 'estatal', estado: 'obligatorio' }),
      regla({
        id: 'a',
        ambito: 'autonomico',
        comunidad: 'ccaa-01',
        estado: 'recomendado',
      }),
      regla({
        id: 'fuera',
        ambito: 'municipal',
        municipio: 'otro',
        estado: 'obligatorio',
      }),
    ];
    const r = evaluarRequisito(seguro, reglas, enMalaga, { fecha: HOY });

    expect(r.traza).toHaveLength(3);
    expect(r.traza.filter((p) => p.resultado === 'ganadora')).toHaveLength(1);
    expect(r.traza.every((p) => p.explicacion.length > 0)).toBe(true);
  });
});

describe('evaluarRequisitos', () => {
  it('conserva el orden de entrada', () => {
    const resultados = evaluarRequisitos([seguro, censo], [], enMalaga, {
      fecha: HOY,
    });
    expect(resultados.map((r) => r.requisitoId)).toEqual([seguro.id, censo.id]);
  });
});

describe('"no aplica" frente a "no lo sabemos"', () => {
  const gatos: Requisito = { id: 'req-gatos', clave: 'microchip_gatos' };
  const reglaDeGatos = regla({
    id: 'gatos',
    requisitoId: gatos.id,
    ambito: 'estatal',
    condiciones: { campo: 'especie', op: 'eq', valor: 'gato' },
    estado: 'obligatorio',
  });

  it('a un perro no se le dice "no lo sabemos" sobre una obligacion de gatos', () => {
    const perro: PerfilAnimal = { ...enMalaga, especie: 'perro' };
    const r = evaluarRequisito(gatos, [reglaDeGatos], perro, { fecha: HOY });
    expect(r.estado).toBe('no_aplica');
    expect(r.faltanDatosDelUsuario).toBe(false);
  });

  it('pero sin ninguna regla cargada si es "no lo sabemos"', () => {
    const perro: PerfilAnimal = { ...enMalaga, especie: 'perro' };
    expect(evaluarRequisito(gatos, [], perro, { fecha: HOY }).estado).toBe(
      'sin_datos',
    );
  });

  it('y con una duda pendiente vuelve a ser "no lo sabemos"', () => {
    const conDuda = regla({
      id: 'con-duda',
      requisitoId: gatos.id,
      ambito: 'estatal',
      condiciones: { campo: 'esterilizado', op: 'eq', valor: false },
      estado: 'obligatorio',
    });
    const perroSinSaber: PerfilAnimal = {
      ...enMalaga,
      especie: 'perro',
      esterilizado: null,
    };
    const r = evaluarRequisito(gatos, [reglaDeGatos, conDuda], perroSinSaber, {
      fecha: HOY,
    });
    expect(r.estado).toBe('sin_datos');
    expect(r.faltanDatosDelUsuario).toBe(true);
  });

  it('una regla descartada solo por territorio no permite afirmar "no aplica"', () => {
    const soloDeOtroSitio = regla({
      id: 'otro-municipio',
      requisitoId: gatos.id,
      ambito: 'municipal',
      municipio: 'mun-41091',
      estado: 'obligatorio',
    });
    const r = evaluarRequisito(gatos, [soloDeOtroSitio], enMalaga, {
      fecha: HOY,
    });
    expect(r.estado).toBe('sin_datos');
  });
});
