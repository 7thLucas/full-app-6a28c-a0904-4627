import { cn } from "~/lib/utils";

interface CoachAvatarProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-14 h-14 text-xl",
};

export function CoachAvatar({ size = "md", className }: CoachAvatarProps) {
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center flex-shrink-0 shadow-md font-bold font-serif",
        sizeMap[size],
        className
      )}
      style={{
        backgroundColor: "var(--accent)",
        color: "var(--primary)",
        fontFamily: "'Playfair Display', Georgia, serif",
      }}
      aria-label="Coach avatar"
    >
      IC
    </div>
  );
}
