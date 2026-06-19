import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, size = "md" }: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: "text-lg" },
    md: { icon: 32, text: "text-xl" },
    lg: { icon: 44, text: "text-3xl" },
  };

  const { icon, text } = sizes[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Icon mark — abstract "W" + upward arrow suggesting improvement */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="44" height="44" rx="10" fill="#059669" />
        {/* Document shape */}
        <rect x="10" y="8" width="18" height="24" rx="2" fill="white" opacity="0.2" />
        <rect x="10" y="8" width="18" height="24" rx="2" stroke="white" strokeWidth="1.5" fill="none" />
        {/* Lines on doc */}
        <line x1="14" y1="15" x2="24" y2="15" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="14" y1="19" x2="24" y2="19" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="14" y1="23" x2="20" y2="23" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        {/* Upward arrow (improvement / score) */}
        <circle cx="32" cy="30" r="8" fill="#34D399" />
        <path
          d="M32 34V27M29 30l3-3 3 3"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <span className={cn("font-bold tracking-tight text-gray-900", text)}>
        Resume<span className="text-emerald-600">Lens</span>
      </span>
    </div>
  );
}
