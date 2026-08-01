"use client";

import { ArrowRight, HelpCircle } from "lucide-react";
import { Link } from "@/compat/router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/motion/Reveal";

/**
 * Six-question FAQ for the home page — a taster for the full list at /faqs.
 *
 * Two deliberate constraints:
 *
 *  1. Every question and answer below is copied verbatim from `FAQSection`
 *     (the /faqs page). Nothing is rewritten or summarised, because these are
 *     factual statements about fees, guarantees and coverage — the home page
 *     must not state them in stronger terms than the page of record. Keep the
 *     two in sync.
 *
 *  2. No `FAQPage` JSON-LD here. `FAQSection` already emits it for its full
 *     list; a second FAQPage block on the home page would put duplicate,
 *     partially-overlapping structured data on the same site. The visible
 *     accordion is the point — the rich-result markup stays on /faqs.
 *
 * The CTA says "Read all FAQs" rather than quoting a count — the number on
 * /faqs changes whenever a question is added, and a stale "all N questions"
 * link is worse than no number.
 *
 * The picks cover both audiences (job seeker + employer) and lead with the two
 * questions that actually gate a decision: whether it costs anything, and
 * whether placement is guaranteed. The honest "cannot guarantee employment"
 * answer is included on purpose rather than filtered out for being off-message.
 */
const faqs = [
  {
    question: "Do job seekers need to pay any fees?",
    answer:
      "No. Job seekers can apply for jobs through RecruitKr without paying registration fees.",
  },
  {
    question: "Does RecruitKr guarantee job placement?",
    answer: "RecruitKr connects candidates with employers but cannot guarantee employment.",
  },
  {
    question: "How can I apply for jobs through RecruitKr?",
    answer:
      "Job seekers can upload their resume and apply for available job opportunities through the RecruitKr platform.",
  },
  {
    question: "How can my company hire employees through RecruitKr?",
    answer:
      "Companies can submit hiring requirements through the website or contact the RecruitKr team directly to start the recruitment process.",
  },
  {
    question: "How much do RecruitKr recruitment services cost?",
    answer:
      "Pricing varies depending on hiring requirements, number of positions, and type of recruitment service.",
  },
  {
    question: "Does RecruitKr provide nationwide hiring services?",
    answer: "Yes, RecruitKr supports recruitment and staffing services for companies across India.",
  },
];

export default function HomeFaq() {
  return (
    // White, like the section above it, so a border carries the separation
    // instead of a tint change.
    <section className="border-t border-slate-100 bg-white py-14 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal as="div" className="mx-auto mb-8 max-w-2xl text-center sm:mb-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#e59f56]/25 bg-[#e59f56]/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c07c33]">
            <HelpCircle size={13} />
            Questions
          </span>
          <h2 className="mt-4 font-heading text-2xl font-extrabold tracking-tight text-slate-900 sm:mt-5 sm:text-3xl lg:text-4xl">
            Before you <span className="text-[#e59f56]">get started</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
            The things candidates and employers ask us most.
          </p>
        </Reveal>

        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((item) => (
              <AccordionItem
                key={item.question}
                value={item.question}
                className="rounded-2xl border border-slate-200 bg-white px-4 transition-colors duration-200 hover:border-[#264a7f]/40 sm:px-5"
              >
                <AccordionTrigger className="py-4 text-left text-[13.5px] font-semibold text-slate-900 sm:text-base">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-[12.5px] leading-relaxed text-slate-600 sm:text-sm">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="mt-8 flex justify-center sm:mt-10">
          <Link
            to="/faqs"
            className="group inline-flex min-h-[48px] items-center gap-2 rounded-full border border-slate-300 bg-white px-7 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#e59f56] hover:text-[#c07c33]"
          >
            Read all FAQs
            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
