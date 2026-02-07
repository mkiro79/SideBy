/**
 * Step Indicator Component
 * 
 * Indicador visual de progreso del wizard con 3 pasos
 */

import { Check } from 'lucide-react';
import type { StepStatus } from '../../types/wizard.types.js';

interface StepIndicatorProps {
  steps: StepStatus[];
  currentStep: number;
}

export function StepIndicator({ steps }: StepIndicatorProps) {
  return (
    <nav aria-label="Progreso del wizard">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isComplete = step.status === 'complete';
          const isCurrent = step.status === 'current';
          const isLast = index === steps.length - 1;
          
          return (
            <li key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    relative flex items-center justify-center w-10 h-10 rounded-full
                    transition-all duration-200 ease-in-out
                    ${
                      isComplete
                        ? 'bg-data-success text-white'
                        : isCurrent
                        ? 'bg-primary text-white ring-4 ring-primary/20'
                        : 'bg-muted text-muted-foreground'
                    }
                  `}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isComplete ? (
                    <Check className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </div>
                
                {/* Step Label */}
                <span
                  className={`
                    mt-2 text-xs font-medium text-center max-w-[120px]
                    ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}
                  `}
                >
                  {step.name}
                </span>
              </div>
              
              {/* Connector Line */}
              {!isLast && (
                <div
                  className={`
                    flex-1 h-0.5 mx-4 transition-colors duration-200
                    ${isComplete ? 'bg-data-success' : 'bg-border'}
                  `}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
