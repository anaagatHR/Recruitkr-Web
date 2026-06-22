export default function FreeCost() {
  const benefits = [
    { title: "Learn Practical Skills", icon: "🎓" },
    { title: "Work On Live Projects", icon: "💻" },
    { title: "Get Mentored By Industry Experts", icon: "👨‍🏫" },
    { title: "Job-Ready & Future Ready", icon: "🤝" },
  ];

  const lineColor = "bg-slate-300";

  const BranchCard = ({ icon, title }: { icon: string; title: string }) => (
    <div className="flex w-full flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2 text-center shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#69a44f]/40 hover:shadow-md sm:p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-base sm:h-12 sm:w-12 sm:text-xl">
        {icon}
      </div>
      <h3 className="text-[10px] font-semibold uppercase leading-tight text-[#264a7f] sm:text-sm">
        {title}
      </h3>
    </div>
  );

  const RootCard = () => (
    <div className="rounded-2xl border border-[#264a7f]/15 bg-gradient-to-br from-[#264a7f] to-[#1d3a64] p-6 text-center text-white shadow-lg">
  
      <p className="text-xl font-light italic md:text-2xl">We believe in you,</p>
      
    </div>
  );

  return (
    <section className="bg-white py-8 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Root block at the top */}
        <div className="mx-auto w-full max-w-sm">
          <RootCard />
        </div>

        {/* Vertical line coming down from the root */}
        <div className="flex justify-center">
          <span className={`block h-10 w-px ${lineColor}`} />
        </div>

        {/* Branches: each card connects up to the trunk */}
        <div className="grid grid-cols-4 gap-2 sm:gap-6">
          {benefits.map((item, index) => {
            const isFirst = index === 0;
            const isLast = index === benefits.length - 1;
            return (
              <div key={item.title} className="relative flex flex-col items-center">
                {/* Horizontal bus line that links all branches together */}
                <span
                  className={`absolute top-0 h-px ${lineColor} ${
                    isFirst
                      ? "left-1/2 right-0"
                      : isLast
                      ? "left-0 right-1/2"
                      : "inset-x-0"
                  }`}
                />
                {/* Vertical drop into each card */}
                <span className={`block h-6 w-px sm:h-10 ${lineColor}`} />
                <BranchCard icon={item.icon} title={item.title} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
