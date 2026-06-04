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
    () => candidates.find((candidate) => candidate.id === selectedCandidateId) || candidates[0],
    [selectedCandidateId],
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 text-center">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                Internship
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
                Internship Section
              </h1>
              <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Click a candidate card to view the certificate, internship details, and company write-up.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Candidates</h2>
                    <p className="mt-1 text-sm text-slate-500">Select any card to see the internship profile.</p>
                  </div>
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
                    4.5 Average Rating
                  </Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {candidates.map((candidate) => (
                    <Card
                      key={candidate.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedCandidateId(candidate.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedCandidateId(candidate.id);
                        }
                      }}
                      className={`cursor-pointer border-slate-200 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_50px_-28px_rgba(15,23,42,0.24)] ${
                        selectedCandidate.id === candidate.id ? "ring-2 ring-primary/30" : ""
                      }`}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12 border border-slate-200">
                            <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                              {candidate.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="truncate text-base font-semibold text-slate-900">
                                  {candidate.name}
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">{candidate.college}</p>
                              </div>
                              <div className="flex items-center gap-1 text-amber-500">
                                <Star size={14} fill="currentColor" />
                                <span className="text-sm font-semibold text-slate-700">{candidate.rating}</span>
                              </div>
                            </div>

                            <p className="mt-3 text-sm font-medium text-slate-700">{candidate.role}</p>
                            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">
                              {candidate.summary}
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                              <span className="rounded-full bg-slate-100 px-3 py-1">{candidate.location}</span>
                              <span className="rounded-full bg-slate-100 px-3 py-1">{candidate.duration}</span>
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
        </div>
      </main>

      <Dialog open={Boolean(selectedCandidateId)} onOpenChange={(open) => !open && setSelectedCandidateId(null)}>
        <DialogContent className="max-w-4xl overflow-hidden border-slate-200 bg-white p-0 sm:rounded-3xl">
          <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="bg-slate-50 p-4 sm:p-6">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <img
                  src={certificateUrl}
                  alt="Internship certificate"
                  className="h-auto w-full object-contain"
                />
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <DialogHeader className="text-left">
                <DialogTitle className="text-2xl text-slate-900">{selectedCandidate.name}</DialogTitle>
                <DialogDescription className="text-slate-500">
                  {selectedCandidate.college} · {selectedCandidate.role}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-5 flex flex-wrap gap-2">
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  4.5 Star
                </Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  {selectedCandidate.duration}
                </Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  {selectedCandidate.location}
                </Badge>
              </div>

              <div className="mt-5 space-y-4 text-sm leading-relaxed text-slate-600">
                <p>{selectedCandidate.summary}</p>
                <p>
                  Strength: <span className="font-medium text-slate-900">{selectedCandidate.strength}</span>
                </p>
                <p>{companyAbout}</p>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
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
