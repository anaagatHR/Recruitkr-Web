import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Star } from "lucide-react";
import { useMemo, useState } from "react";

const certificateUrl =
  "https://ik.imagekit.io/qrpbxmqo6/internship%20/WhatsApp%20Image%202026-06-04%20at%209.11.10%20PM.jpeg";

type Candidate = {
  id: string;
  name: string;
  college: string;
  role: string;
  rating: number;
  summary: string;
  strength: string;
  duration: string;
  location: string;
  initials: string;
};

const candidates: Candidate[] = [
  {
    id: "naresh-yadav",
    name: "Naresh Yadav",
    college: "Government College Chaksu",
    role: "Intern - Operations",
    rating: 4.5,
    summary:
      "Completed the internship with sincerity, discipline, and steady performance while contributing to assigned tasks and documentation.",
    strength: "Reliable execution and quick learning",
    duration: "04/05/2026 - 30/05/2026",
    location: "Jaipur, Rajasthan",
    initials: "NY",
  },
];

const companyAbout =
  "Anaagat HumanPower Pvt. Ltd. is committed to practical learning, real-world exposure, and guided internship experience. The internship section reflects how we support students with professional discipline, structured work, and meaningful career-building opportunities.";

const Internship = () => {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const selectedCandidate = useMemo(
    () => candidates.find((c) => c.id === selectedCandidateId) ?? candidates[0],
    [selectedCandidateId],
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pb-20 pt-24 sm:pt-28">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-5xl">

            {/* Page heading */}
            <div className="mb-8 text-center sm:mb-10">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary sm:text-sm">
                Internship
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
                Internship Section
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:mt-4 sm:text-base">
                Click a candidate card to view the certificate, internship details, and company write-up.
              </p>
            </div>

            {/* Candidates section */}
            <section className="space-y-5">
              {/* Section header */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Candidates</h2>
                  <p className="mt-0.5 text-sm text-slate-500">Select any card to see the internship profile.</p>
                </div>
                <Badge variant="secondary" className="shrink-0 rounded-full px-3 py-1 text-xs">
                  4.5 Average Rating
                </Badge>
              </div>

              {/* Cards grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                {candidates.map((candidate) => (
                  <Card
                    key={candidate.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedCandidateId(candidate.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedCandidateId(candidate.id);
                      }
                    }}
                    className={`cursor-pointer border-slate-200 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                      selectedCandidate?.id === candidate.id ? "ring-2 ring-primary/30" : ""
                    }`}
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <Avatar className="h-11 w-11 shrink-0 border border-slate-200 sm:h-12 sm:w-12">
                          <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                            {candidate.initials}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-semibold text-slate-900 sm:text-base">
                                {candidate.name}
                              </h3>
                              <p className="mt-0.5 truncate text-xs text-slate-500 sm:text-sm">
                                {candidate.college}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1 text-amber-500">
                              <Star size={13} fill="currentColor" />
                              <span className="text-xs font-semibold text-slate-700 sm:text-sm">
                                {candidate.rating}
                              </span>
                            </div>
                          </div>

                          <p className="mt-2 text-xs font-medium text-slate-700 sm:mt-3 sm:text-sm">
                            {candidate.role}
                          </p>
                          <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-slate-600 sm:mt-2 sm:text-sm">
                            {candidate.summary}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2">
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-500 sm:px-3 sm:py-1 sm:text-xs">
                              {candidate.location}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-500 sm:px-3 sm:py-1 sm:text-xs">
                              {candidate.duration}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Certificate dialog */}
      <Dialog
        open={Boolean(selectedCandidateId)}
        onOpenChange={(open) => !open && setSelectedCandidateId(null)}
      >
        <DialogContent className="w-[calc(100%-1rem)] max-h-[92svh] overflow-y-auto rounded-2xl border-slate-200 bg-white p-0 sm:w-full sm:max-w-4xl sm:rounded-3xl">
          <div className="grid lg:grid-cols-[0.95fr_1.05fr]">

            {/* Certificate image */}
            <div className="bg-slate-50 p-4 sm:p-6">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <img
                  src={certificateUrl}
                  alt="Internship certificate"
                  className="h-auto w-full object-contain"
                />
              </div>
            </div>

            {/* Details */}
            <div className="p-4 sm:p-6">
              <DialogHeader className="text-left">
                <DialogTitle className="text-xl font-bold text-slate-900 sm:text-2xl">
                  {selectedCandidate.name}
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500">
                  {selectedCandidate.college} · {selectedCandidate.role}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
                  4.5 Star
                </Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                  {selectedCandidate.duration}
                </Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                  {selectedCandidate.location}
                </Badge>
              </div>

              <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600 sm:mt-5 sm:space-y-4">
                <p>{selectedCandidate.summary}</p>
                <p>
                  Strength:{" "}
                  <span className="font-medium text-slate-900">{selectedCandidate.strength}</span>
                </p>
                <p>{companyAbout}</p>
              </div>

              <div className="mt-5 sm:mt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-full sm:w-auto"
                  onClick={() => setSelectedCandidateId(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Internship;
