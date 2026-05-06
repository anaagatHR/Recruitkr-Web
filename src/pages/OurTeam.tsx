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
    <div className="pt-24">
      <TeamSection />
    </div>
    <Footer />
  </div>
);

export default OurTeam;
