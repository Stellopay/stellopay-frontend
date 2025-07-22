import { KeyFeatures } from "@/components/landing/key-features";
import Hero from "./hero";
import Navbar from "@/components/common/navbar";

export default function LandingPage() {
  return (
    <main>
      <Navbar/>
      <Hero />
      <KeyFeatures />
    </main>
  );
} 