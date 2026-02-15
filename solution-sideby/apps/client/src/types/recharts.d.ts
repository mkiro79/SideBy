/**
 * Type declarations for Recharts with React 19 compatibility
 * Temporary fix until Recharts officially supports React 19
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "recharts" {
  import * as React from "react";

  export interface LineChartProps {
    data?: any[];
    width?: number;
    height?: number;
    margin?: {
      top?: number;
      right?: number;
      left?: number;
      bottom?: number;
    };
    children?: React.ReactNode;
  }

  export interface LineProps {
    type?:
      | "basis"
      | "basisClosed"
      | "basisOpen"
      | "linear"
      | "linearClosed"
      | "natural"
      | "monotoneX"
      | "monotoneY"
      | "monotone"
      | "step"
      | "stepBefore"
      | "stepAfter";
    dataKey?: string | number | ((obj: any) => any);
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
    name?: string;
    dot?: boolean | any;
    activeDot?: boolean | any;
    label?: boolean | any;
    isAnimationActive?: boolean;
    animationDuration?: number;
    animationEasing?: string;
  }

  export interface XAxisProps {
    dataKey?: string | number;
    stroke?: string;
    fontSize?: number;
    tickLine?: boolean;
    axisLine?: boolean;
    tick?: boolean | any;
    tickFormatter?: (value: any) => string;
  }

  export interface YAxisProps {
    stroke?: string;
    fontSize?: number;
    tickLine?: boolean;
    axisLine?: boolean;
    tick?: boolean | any;
    tickFormatter?: (value: any) => string;
    domain?: [number | string, number | string];
  }

  export interface CartesianGridProps {
    strokeDasharray?: string;
    stroke?: string;
  }

  export interface TooltipProps {
    contentStyle?: React.CSSProperties;
    labelStyle?: React.CSSProperties;
    formatter?: (
      value: any,
      name: any,
      props: any,
    ) => [React.ReactNode, React.ReactNode];
    labelFormatter?: (label: any) => React.ReactNode;
    active?: boolean;
    payload?: any[];
    label?: any;
  }

  export interface ResponsiveContainerProps {
    width?: number | string;
    height?: number | string;
    children?: React.ReactNode;
  }

  export const LineChart: React.FC<LineChartProps>;
  export const Line: React.FC<LineProps>;
  export const XAxis: React.FC<XAxisProps>;
  export const YAxis: React.FC<YAxisProps>;
  export const CartesianGrid: React.FC<CartesianGridProps>;
  export const Tooltip: React.FC<TooltipProps>;
  export const ResponsiveContainer: React.FC<ResponsiveContainerProps>;
}
