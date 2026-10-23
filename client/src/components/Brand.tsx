import { ArrowUpRight } from "lucide-react";

export const LOGO_URL = "/manus-storage/photo_2026-10-23_20-24-03_eb83a783.jpg";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <a
      href="/"
      className="group flex items-center gap-3"
      aria-label="Ravishka Kalinga Commerce LMS home"
    >
      <div className={`brand-logo ${compact ? "h-10 w-10" : "h-12 w-12"}`}>
        <img
          src={LOGO_URL}
          alt="Ravishka Kalinga Commerce logo"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="leading-none">
        <div className="font-display text-[15px] font-black uppercase tracking-[0.16em] text-white">
          Ravishka Kalinga
        </div>
        <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
          Commerce classroom{" "}
          <ArrowUpRight className="h-3 w-3 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>
      </div>
    </a>
  );
}

export function Wordmark() {
  return (
    <div className="space-y-3">
      <div className="eyebrow">
        <span className="eyebrow-line" /> RAVISHKA KALINGA / COMMERCE
      </div>
      <h1 className="font-display text-5xl font-black uppercase leading-[0.9] tracking-[-0.05em] text-white sm:text-7xl lg:text-[6.5rem]">
        Learn sharp.
        <br />
        <span className="text-primary">Build ahead.</span>
      </h1>
    </div>
  );
}
