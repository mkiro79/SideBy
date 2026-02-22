import { cn } from "@/shared/utils/cn.js";

interface SideByWordmarkProps {
  className?: string;
}

export const SideByWordmark = ({ className }: SideByWordmarkProps) => {
  return (
    <span className={cn("inline-flex whitespace-nowrap", className)} aria-label="SideBy">
      <span className="text-[#3b82f6]">Side</span>
      <span className="text-[#f97316]">By</span>
    </span>
  );
};
