"use client";
import { Briefcase, Upload } from "lucide-react";
import { Link } from "@/compat/router";

const DualCtaSection = () => {
  return (
    <section id="cta" className="py-12 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Employers */}
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-6 text-center sm:p-8 lg:p-10">
            <div className="mx-auto mb-3 inline-flex rounded-full bg-primary/20 p-3 text-primary sm:mb-5 sm:p-4">
              <Briefcase className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <h3 className="mb-1.5 text-lg font-extrabold text-foreground sm:mb-2 sm:text-2xl">For Employers</h3>
            <p className="mb-4 text-sm text-muted-foreground sm:mb-6 sm:text-base">
              Share your requirements and let us find the perfect fit.
            </p>
            <Link
              to="/login?role=client"
              className="btn-gradient inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3.5 font-bold transition-transform hover:scale-105 sm:w-auto sm:px-8"
            >
              Post a Requirement
            </Link>
          </div>

          {/* Job Seekers */}
          <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 to-accent/5 p-6 text-center sm:p-8 lg:p-10">
            <div className="mx-auto mb-3 inline-flex rounded-full bg-accent/20 p-3 text-accent sm:mb-5 sm:p-4">
              <Upload className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <h3 className="mb-1.5 text-lg font-extrabold text-foreground sm:mb-2 sm:text-2xl">For Job Seekers</h3>
            <p className="mb-4 text-sm text-muted-foreground sm:mb-6 sm:text-base">
              Upload your resume and let opportunities find you.
            </p>
            <Link
              to="/signup"
              className="btn-gradient inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3.5 font-bold transition-transform hover:scale-105 sm:w-auto sm:px-8"
            >
              Upload Your Resume
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DualCtaSection;
