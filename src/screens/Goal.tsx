"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GoalSection from "@/components/GoalSection";
import DualCtaSection from "@/components/DualCtaSection";

const Goal = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-24">
      <GoalSection />
      <DualCtaSection />
    </div>
    <Footer />
  </div>
);

export default Goal;
