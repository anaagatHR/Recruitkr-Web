"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SuccessStoriesSection from "@/components/SuccessStoriesSection";
import DualCtaSection from "@/components/DualCtaSection";

const SuccessStories = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-24">
      <SuccessStoriesSection />
      <DualCtaSection />
    </div>
    <Footer />
  </div>
);

export default SuccessStories;
