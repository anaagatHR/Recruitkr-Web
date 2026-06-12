"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FAQSection from "@/components/FAQSection";
import PageSeo from "@/components/PageSeo";

const FAQs = () => {
  return (
    <div className="min-h-screen bg-background">
      <PageSeo
        title="RecruitKr FAQs | Hiring, Staffing, HR & Job Seeker Questions"
        description="Find answers about RecruitKr recruitment services, staffing, payroll, job applications, partnerships, and workforce outsourcing across India."
        canonicalPath="/faqs"
        keywords={[
          "RecruitKr FAQs",
          "recruitment FAQ India",
          "staffing questions",
          "job application help",
          "HR outsourcing FAQ",
        ]}
      />
      <Navbar />
      <div className="pt-20">
        <FAQSection />
      </div>
      <Footer />
    </div>
  );
};

export default FAQs;
