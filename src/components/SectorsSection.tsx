"use client";
import {
  BadgeDollarSign,
  Bolt,
  Briefcase,
  Building2,
  Factory,
  Headphones,
  HeartPulse,
  Package,
  Shield,
  ShoppingBag,
  Stethoscope,
} from "lucide-react";

const sectors = [
  { name: "Power", icon: Bolt, image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=640&q=70" },
  { name: "BPO", icon: Headphones, image: "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?auto=format&fit=crop&w=640&q=70" },
  { name: "Retail", icon: ShoppingBag, image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=640&q=70" },
  { name: "Hospitality", icon: Building2, image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=640&q=70" },
  { name: "Insurance", icon: Shield, image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=640&q=70" },
  { name: "Banking", icon: BadgeDollarSign, image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=640&q=70" },
  { name: "IT", icon: Briefcase, image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=640&q=70" },
  { name: "Manufacturing", icon: Factory, image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=640&q=70" },
  { name: "Logistics", icon: Package, image: "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=640&q=70" },
  { name: "Healthcare", icon: Stethoscope, image: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=640&q=70" },
  { name: "FMCG", icon: HeartPulse, image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=640&q=70" },
];

const SectorsSection = () => {
  const doubled = [...sectors, ...sectors];

  return (
    <section id="sectors" className="overflow-hidden border-y border-border py-16">
      <div className="container mx-auto mb-10 px-4 text-center">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-accent">
          Industries
        </p>
        <h2 className="bg-[linear-gradient(90deg,rgba(36,70,121,1)_0%,rgba(105,164,79,1)_100%)] bg-clip-text text-4xl font-extrabold tracking-tight text-transparent md:text-5xl">
          Sectors We Serve
        </h2>
      </div>

      {/* Name ticker */}
      <div className="relative overflow-hidden">
        <div className="flex animate-sectors-ticker gap-4 will-change-transform">
          {doubled.map((sector, i) => {
            const Icon = sector.icon;
            return (
              <span
                key={`${sector.name}-${i}`}
                className="inline-flex shrink-0 items-center gap-2 px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:text-primary"
              >
                <Icon size={16} className="text-primary" />
                {sector.name}
              </span>
            );
          })}
        </div>
      </div>

      {/* Sector image grid */}
      <div className="container mx-auto mt-10 px-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {sectors.map((sector) => {
            const Icon = sector.icon;
            return (
              <div
                key={sector.name}
                className="group relative h-36 overflow-hidden rounded-2xl border border-border sm:h-44"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sector.image}
                  alt={sector.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white">
                  <Icon size={16} />
                  <span className="text-sm font-semibold drop-shadow">{sector.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SectorsSection;
