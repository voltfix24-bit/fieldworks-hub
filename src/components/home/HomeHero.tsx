import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const slides = [
  {
    eyebrow: 'Uitgelicht project',
    headline: 'TenneT en AardingRapport tekenen contract voor project Boxmeer',
    subtitle: 'Een nieuwe stap in de versterking van de energie-infrastructuur in Nederland.',
    cta: 'Lees meer',
  },
  {
    eyebrow: 'Innovatie',
    headline: 'Slimme aardingsmetingen met real-time rapportage',
    subtitle: 'Volledig digitaal meten en direct rapporteren vanuit het veld.',
    cta: 'Ontdek meer',
  },
  {
    eyebrow: 'Duurzaamheid',
    headline: 'Samen bouwen aan een toekomstbestendige infrastructuur',
    subtitle: 'Efficiënte oplossingen voor de energietransitie van morgen.',
    cta: 'Meer weten',
  },
];

export function HomeHero() {
  const [active, setActive] = useState(0);
  const slide = slides[active];

  return (
    <section className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A1929] via-[#0D2240] to-[#132F52] min-h-[420px] lg:min-h-[520px]">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -right-20 h-[500px] w-[500px] rounded-full bg-[#F5C518]/8 blur-[120px]" />
        <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-[#1E6BFF]/6 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-[#F5C518]/4 blur-[80px]" />
      </div>

      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Content */}
      <div className="relative flex h-full min-h-[420px] lg:min-h-[520px] items-end p-6 sm:p-10 lg:p-14">
        {/* Floating glass card */}
        <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.06] p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <span className="mb-3 inline-block rounded-full bg-[#F5C518]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[2px] text-[#F5C518]">
            {slide.eyebrow}
          </span>

          <h1 className="mb-3 text-2xl font-black leading-tight text-white sm:text-3xl lg:text-[2.4rem] lg:leading-[1.15]">
            {slide.headline}
          </h1>

          <p className="mb-6 max-w-md text-[14px] leading-relaxed text-white/55 font-medium">
            {slide.subtitle}
          </p>

          <button className="group inline-flex items-center gap-2 rounded-xl bg-[#F5C518] px-6 py-3 text-[13px] font-bold text-[#0A1929] shadow-lg shadow-[#F5C518]/20 transition-all hover:shadow-xl hover:shadow-[#F5C518]/30 hover:scale-[1.02] active:scale-[0.98]">
            {slide.cta}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* Dots + arrows */}
          <div className="mt-8 flex items-center gap-4">
            <div className="flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === active
                      ? 'w-8 bg-[#F5C518]'
                      : 'w-1.5 bg-white/20 hover:bg-white/35'
                  }`}
                />
              ))}
            </div>

            <div className="ml-auto flex gap-1.5">
              <button
                onClick={() => setActive((active - 1 + slides.length) % slides.length)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 transition hover:bg-white/10 hover:text-white/70"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setActive((active + 1) % slides.length)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 transition hover:bg-white/10 hover:text-white/70"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
