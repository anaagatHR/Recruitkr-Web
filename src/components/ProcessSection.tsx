"use client";
const steps = [
  { num: "01", title: "Understand Requirement" },
  { num: "02", title: "Source Talent" },
  { num: "03", title: "Screen & Interview" },
  { num: "04", title: "Place & Onboard" },
  { num: "05", title: "Retain & Replace" },
];

const ProcessSection = () => {
  return (
    <section id="process" className="border-y border-border py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-accent">
            How It Works
          </p>
          <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            Our Process
          </h2>
        </div>

        <div className="overflow-hidden">
          <div className="flex items-start justify-between gap-2 sm:gap-4 md:gap-0">
            {steps.map((step, i) => (
              <div key={step.num} className="flex min-w-0 flex-1 flex-col items-center text-center">
                <div className="relative mb-3 flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-xs font-extrabold text-primary sm:mb-4 sm:h-12 sm:w-12 sm:text-base md:h-16 md:w-16 md:text-2xl">
                  {step.num}
                  {i < steps.length - 1 && (
                    <div className="absolute left-full top-1/2 h-0.5 w-full -translate-y-1/2 bg-gradient-to-r from-primary/60 to-transparent" />
                  )}
                </div>
                <h3 className="text-[10px] font-bold leading-tight sm:text-xs md:text-sm">
                  {step.title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
