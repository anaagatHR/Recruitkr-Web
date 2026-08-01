"use client";
import { Building2, GraduationCap, Heart } from "lucide-react";

const panels = [
  {
    icon: Building2,
    title: "Employers",
    description: "Startups, SMBs, and corporates looking for the right talent — fast.",
    accent: "border-primary text-primary bg-primary/10",
  },
  {
    icon: GraduationCap,
    title: "Job Seekers & Students",
    description: "Career counselling, placement support, and resume building for aspirants.",
    accent: "border-accent text-accent bg-accent/10",
  },
  {
    icon: Heart,
    title: "Institutions & NGOs",
    description: "Skill development centers, livelihood NGOs, and placement drives for batches.",
    accent: "border-teal text-teal bg-teal/10",
  },
];

const WhoWeHelpSection = () => {
  return (
    <section className="py-12 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center sm:mb-16">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
            Our Audience
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Who We Help
          </h2>
        </div>

        {/* Row per panel on a phone (icon left, text right, left-aligned), the
            original centred cards from `md` up. At p-8 with a 40px icon and a
            2xl heading these ran nearly a full viewport each. */}
        <div className="grid gap-3 md:grid-cols-3 md:gap-6">
          {panels.map((panel) => (
            <div
              key={panel.title}
              className={`card-hover flex items-center gap-3 rounded-xl border-2 ${panel.accent} p-3 text-left md:block md:p-8 md:text-center`}
            >
              <div className="inline-flex shrink-0 rounded-full md:mx-auto md:mb-5 md:p-4">
                <panel.icon className="h-7 w-7 md:h-10 md:w-10" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[15px] font-bold leading-tight text-foreground md:mb-3 md:text-2xl">
                  {panel.title}
                </h3>
                <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-[1.45] text-muted-foreground md:mt-0 md:line-clamp-none md:text-sm md:leading-relaxed">
                  {panel.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhoWeHelpSection;
