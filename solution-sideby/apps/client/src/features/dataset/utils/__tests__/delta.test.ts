/**
 * Tests para utilidad calculateDelta
 * 
 * Verifica:
 * - Cálculo de delta absoluto (A - B)
 * - Cálculo de delta porcentual ((A - B) / B * 100)
 * - Detección de tendencia (up/down/neutral)
 * - Casos extremos (división por cero, valores iguales)
 */

import { describe, it, expect } from 'vitest';
import { calculateDelta } from '../delta.js';

describe('calculateDelta', () => {
  describe('Delta absoluto', () => {
    it('debe calcular delta positivo cuando A > B', () => {
      const result = calculateDelta(150, 100);
      
      expect(result.deltaAbs).toBe(50);
    });

    it('debe calcular delta negativo cuando A < B', () => {
      const result = calculateDelta(100, 150);
      
      expect(result.deltaAbs).toBe(-50);
    });

    it('debe calcular delta cero cuando A === B', () => {
      const result = calculateDelta(100, 100);
      
      expect(result.deltaAbs).toBe(0);
    });
  });

  describe('Delta porcentual', () => {
    it('debe calcular porcentaje positivo cuando A > B', () => {
      const result = calculateDelta(150, 100);
      
      // (150 - 100) / 100 * 100 = 50%
      expect(result.deltaPercent).toBe(50);
    });

    it('debe calcular porcentaje negativo cuando A < B', () => {
      const result = calculateDelta(50, 100);
      
      // (50 - 100) / 100 * 100 = -50%
      expect(result.deltaPercent).toBe(-50);
    });

    it('debe calcular porcentaje cero cuando A === B', () => {
      const result = calculateDelta(100, 100);
      
      expect(result.deltaPercent).toBe(0);
    });

    it('debe calcular porcentajes decimales correctamente', () => {
      const result = calculateDelta(105, 100);
      
      // (105 - 100) / 100 * 100 = 5%
      expect(result.deltaPercent).toBe(5);
    });
  });

  describe('Tendencia', () => {
    it('debe retornar "up" cuando delta porcentual es >= 1%', () => {
      const result = calculateDelta(101, 100);
      
      expect(result.trend).toBe('up');
    });

    it('debe retornar "down" cuando delta porcentual es <= -1%', () => {
      const result = calculateDelta(99, 100);
      
      expect(result.trend).toBe('down');
    });

    it('debe retornar "neutral" cuando delta porcentual está entre -1% y 1%', () => {
      const result = calculateDelta(100.5, 100);
      
      // 0.5% está dentro del rango neutral
      expect(result.trend).toBe('neutral');
    });

    it('debe retornar "neutral" cuando ambos valores son 0', () => {
      const result = calculateDelta(0, 0);
      
      expect(result.trend).toBe('neutral');
    });
  });

  describe('División por cero', () => {
    it('debe retornar Infinity cuando referencia es 0 y actual es positivo', () => {
      const result = calculateDelta(100, 0);
      
      expect(result.deltaAbs).toBe(100);
      expect(result.deltaPercent).toBe(Infinity);
      expect(result.trend).toBe('neutral');
    });

    it('debe retornar Infinity cuando referencia es 0 y actual es negativo', () => {
      const result = calculateDelta(-100, 0);
      
      expect(result.deltaAbs).toBe(-100);
      expect(result.deltaPercent).toBe(Infinity);
      expect(result.trend).toBe('neutral');
    });

    it('debe retornar 0% cuando ambos valores son 0', () => {
      const result = calculateDelta(0, 0);
      
      expect(result.deltaAbs).toBe(0);
      expect(result.deltaPercent).toBe(0);
      expect(result.trend).toBe('neutral');
    });
  });

  describe('Valores negativos', () => {
    it('debe manejar valores negativos en actual correctamente', () => {
      const result = calculateDelta(-50, 100);
      
      expect(result.deltaAbs).toBe(-150);
      // (-50 - 100) / 100 * 100 = -150%
      expect(result.deltaPercent).toBe(-150);
      expect(result.trend).toBe('down');
    });

    it('debe manejar valores negativos en referencia correctamente', () => {
      const result = calculateDelta(100, -50);
      
      expect(result.deltaAbs).toBe(150);
      // (100 - (-50)) / (-50) * 100 = -300%
      expect(result.deltaPercent).toBe(-300);
      expect(result.trend).toBe('down');
    });

    it('debe manejar ambos valores negativos correctamente', () => {
      const result = calculateDelta(-100, -150);
      
      expect(result.deltaAbs).toBe(50);
      // (-100 - (-150)) / (-150) * 100 = -33.33...%
      expect(result.deltaPercent).toBeCloseTo(-33.33, 1);
      expect(result.trend).toBe('down');
    });
  });
});
