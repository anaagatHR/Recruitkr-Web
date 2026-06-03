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
  { name: "Power", icon: Bolt },
  { name: "BPO", icon: Headphones },
  { name: "Retail", icon: ShoppingBag },
  { name: "Hospitality", icon: Building2 },
  { name: "Insurance", icon: Shield },
  { name: "Banking", icon: BadgeDollarSign },
  { name: "IT", icon: Briefcase },
  { name: "Manufacturing", icon: Factory },
  { name: "Logistics", icon: Package },
  { name: "Healthcare", icon: Stethoscope },
  { name: "FMCG", icon: HeartPulse },
];

const SectorsSection = () => {
  const doubled = [...sectors, ...sectors];

  return (
    <section id="sectors" className="content-auto overflow-hidden border-y border-border py-16">
      <div className="container mx-auto mb-10 px-4 text-center">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-accent">
          Industries
        </p>
        <h2 className="bg-[linear-gradient(90deg,rgba(36,70,121,1)_0%,rgba(105,164,79,1)_100%)] bg-clip-text text-4xl font-extrabold tracking-tight text-transparent md:text-5xl">
          Sectors We Serve
        </h2>
      </div>

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
    </section>
  );
};

export default SectorsSection;
