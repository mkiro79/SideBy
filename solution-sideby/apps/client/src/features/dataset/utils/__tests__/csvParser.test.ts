/**
 * Tests para CSV Parser Utility
 * 
 * Valida que unifyDatasets realice join correcto por dimensionField
 * en lugar de asumir alineación por índice
 */

import { describe, it, expect } from 'vitest';
import { unifyDatasets } from '../csvParser.js';
import type { ParsedFileData } from '../../types/wizard.types.js';

describe('csvParser - unifyDatasets', () => {
  it('debe unificar datasets con mismo orden por dimensionField', () => {
    const dataA: ParsedFileData = {
      headers: ['region', 'ventas', 'clientes'],
      rows: [
        { region: 'Norte', ventas: 1000, clientes: 50 },
        { region: 'Sur', ventas: 800, clientes: 40 },
        { region: 'Este', ventas: 1200, clientes: 60 },
      ],
      rowCount: 3,
    };

    const dataB: ParsedFileData = {
      headers: ['region', 'ventas', 'clientes'],
      rows: [
        { region: 'Norte', ventas: 900, clientes: 45 },
        { region: 'Sur', ventas: 750, clientes: 38 },
        { region: 'Este', ventas: 1100, clientes: 55 },
      ],
      rowCount: 3,
    };

    const result = unifyDatasets(dataA, dataB, 'region');

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      region: 'Norte',
      ventas_current: 1000,
      clientes_current: 50,
      ventas_comparative: 900,
      clientes_comparative: 45,
    });
    expect(result[1]).toEqual({
      region: 'Sur',
      ventas_current: 800,
      clientes_current: 40,
      ventas_comparative: 750,
      clientes_comparative: 38,
    });
  });

  it('debe unificar datasets con diferente orden (join por dimensionField)', () => {
    const dataA: ParsedFileData = {
      headers: ['region', 'ventas'],
      rows: [
        { region: 'Norte', ventas: 1000 },
        { region: 'Sur', ventas: 800 },
        { region: 'Este', ventas: 1200 },
      ],
      rowCount: 3,
    };

    // Dataset B tiene orden diferente
    const dataB: ParsedFileData = {
      headers: ['region', 'ventas'],
      rows: [
        { region: 'Este', ventas: 1100 },  // Invertido
        { region: 'Norte', ventas: 900 },  // Invertido
        { region: 'Sur', ventas: 750 },
      ],
      rowCount: 3,
    };

    const result = unifyDatasets(dataA, dataB, 'region');

    expect(result).toHaveLength(3);
    
    // Verifica que el join se hizo correctamente por región, no por índice
    expect(result[0]).toEqual({
      region: 'Norte',
      ventas_current: 1000,
      ventas_comparative: 900,  // Debe matchear Norte de B, no Este
    });
    
    expect(result[1]).toEqual({
      region: 'Sur',
      ventas_current: 800,
      ventas_comparative: 750,
    });
    
    expect(result[2]).toEqual({
      region: 'Este',
      ventas_current: 1200,
      ventas_comparative: 1100,  // Debe matchear Este de B
    });
  });

  it('debe manejar filas faltantes en dataset B', () => {
    const dataA: ParsedFileData = {
      headers: ['region', 'ventas'],
      rows: [
        { region: 'Norte', ventas: 1000 },
        { region: 'Sur', ventas: 800 },
        { region: 'Este', ventas: 1200 },
        { region: 'Oeste', ventas: 900 },
      ],
      rowCount: 4,
    };

    // Dataset B no tiene 'Oeste'
    const dataB: ParsedFileData = {
      headers: ['region', 'ventas'],
      rows: [
        { region: 'Norte', ventas: 900 },
        { region: 'Sur', ventas: 750 },
        { region: 'Este', ventas: 1100 },
      ],
      rowCount: 3,
    };

    const result = unifyDatasets(dataA, dataB, 'region');

    expect(result).toHaveLength(4);
    
    // Verifica que 'Oeste' no tenga datos comparativos
    const oesteRow = result.find(r => r.region === 'Oeste');
    expect(oesteRow).toEqual({
      region: 'Oeste',
      ventas_current: 900,
      // No debe tener ventas_comparative
    });
    expect(oesteRow).not.toHaveProperty('ventas_comparative');
  });

  it('debe manejar filas extra en dataset B (no presentes en A)', () => {
    const dataA: ParsedFileData = {
      headers: ['region', 'ventas'],
      rows: [
        { region: 'Norte', ventas: 1000 },
        { region: 'Sur', ventas: 800 },
      ],
      rowCount: 2,
    };

    // Dataset B tiene 'Este' que no está en A
    const dataB: ParsedFileData = {
      headers: ['region', 'ventas'],
      rows: [
        { region: 'Norte', ventas: 900 },
        { region: 'Sur', ventas: 750 },
        { region: 'Este', ventas: 1100 },  // Extra
      ],
      rowCount: 3,
    };

    const result = unifyDatasets(dataA, dataB, 'region');

    // Solo debe incluir filas de A
    expect(result).toHaveLength(2);
    expect(result.find(r => r.region === 'Este')).toBeUndefined();
  });

  it('debe manejar valores null/undefined en dimensionField', () => {
    const dataA: ParsedFileData = {
      headers: ['region', 'ventas'],
      rows: [
        { region: 'Norte', ventas: 1000 },
        { region: null, ventas: 800 },
        { region: 'Sur', ventas: 1200 },
      ],
      rowCount: 3,
    };

    const dataB: ParsedFileData = {
      headers: ['region', 'ventas'],
      rows: [
        { region: 'Norte', ventas: 900 },
        { region: 'Sur', ventas: 750 },
        { region: null, ventas: 700 },
      ],
      rowCount: 3,
    };

    const result = unifyDatasets(dataA, dataB, 'region');

    expect(result).toHaveLength(3);
    
    // Fila con null en dimensionField debe existir en resultado
    const nullRow = result.find(r => r.region === null);
    expect(nullRow).toBeDefined();
    expect(nullRow).toEqual({
      region: null,
      ventas_current: 800,
      // No debe matchear con la fila null de B porque nulls no se matchean en Map
    });
  });

  it('debe preservar todos los campos excepto dimensionField con sufijos correctos', () => {
    const dataA: ParsedFileData = {
      headers: ['producto', 'ventas', 'stock', 'precio'],
      rows: [
        { producto: 'A', ventas: 100, stock: 50, precio: 10.5 },
      ],
      rowCount: 1,
    };

    const dataB: ParsedFileData = {
      headers: ['producto', 'ventas', 'stock', 'precio'],
      rows: [
        { producto: 'A', ventas: 90, stock: 45, precio: 10.0 },
      ],
      rowCount: 1,
    };

    const result = unifyDatasets(dataA, dataB, 'producto');

    expect(result[0]).toEqual({
      producto: 'A',
      ventas_current: 100,
      stock_current: 50,
      precio_current: 10.5,
      ventas_comparative: 90,
      stock_comparative: 45,
      precio_comparative: 10.0,
    });
  });

  it('debe funcionar con diferentes tipos de valores en dimensionField', () => {
    const dataA: ParsedFileData = {
      headers: ['id', 'valor'],
      rows: [
        { id: 1, valor: 100 },
        { id: 2, valor: 200 },
        { id: 'tres', valor: 300 },
      ],
      rowCount: 3,
    };

    const dataB: ParsedFileData = {
      headers: ['id', 'valor'],
      rows: [
        { id: 2, valor: 250 },
        { id: 'tres', valor: 350 },
        { id: 1, valor: 150 },
      ],
      rowCount: 3,
    };

    const result = unifyDatasets(dataA, dataB, 'id');

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe(1);
    expect(result[0].valor_comparative).toBe(150);
    expect(result[2].id).toBe('tres');
    expect(result[2].valor_comparative).toBe(350);
  });
});
