"use client";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageSeo from "@/components/PageSeo";
import TeamSection from "@/components/TeamSection";

const OurTeam = () => (
  <div className="min-h-screen bg-background">
    <PageSeo
      title="Our Team | RecruitKr"
      description="Meet the RecruitKr team supporting recruitment, employer partnerships, and candidate success across industries."
      canonicalPath="/our-team"
      type="website"
    />
    <Navbar />
    {/* No top padding: the navy hero runs up under the fixed navbar itself. */}
    <main id="main">
      <TeamSection />
    </main>
    <Footer />
  </div>
);

export default OurTeam;
