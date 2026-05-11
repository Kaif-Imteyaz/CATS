import dynamic from "next/dynamic";
import Navbar from "@/components/shared/Navbar";
import Hero from "@/components/landing/Hero";

const HowItWorks = dynamic(() => import("@/components/landing/HowItWorks"));
const ExercisePreview = dynamic(() => import("@/components/landing/ExercisePreview"));
const DashboardPreview = dynamic(() => import("@/components/landing/DashboardPreview"));
const CulturalAdaptation = dynamic(() => import("@/components/landing/CulturalAdaptation"));
const Testimonials = dynamic(() => import("@/components/landing/Testimonials"));
const FAQ = dynamic(() => import("@/components/landing/FAQ"));
const Footer = dynamic(() => import("@/components/landing/Footer"));
const DisclaimerPopup = dynamic(() => import("@/components/landing/DisclaimerPopup"));

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <HowItWorks />
      <ExercisePreview />
      <DashboardPreview />
      <CulturalAdaptation />
      <Testimonials />
      <FAQ />
      <Footer />
      <DisclaimerPopup />
    </main>
  );
}
