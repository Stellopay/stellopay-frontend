import LandingPage from "@/components/landing/landing-page";
import { landingStructuredData } from "./structured-data";

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(landingStructuredData),
        }}
      />
      {/* id="main-content" is the skip-link target declared in the root layout. */}
      <main id="main-content">
        <LandingPage />
      </main>
    </>
  );
}
