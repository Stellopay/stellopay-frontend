import { KeyFeatures } from "@/components/landing/key-features";
import Hero from "./hero";
import Footer from "@/components/common/footer";
import LandingPageNavBar from "@/components/landing/landing-page-nav-bar";

export default function LandingPage() {
  return (
    <div>
      <LandingPageNavBar />
      <Hero />
      <KeyFeatures />
      <Footer />
    </div>
  );
} 