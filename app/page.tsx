import LandingPage from "@/components/landing/landing-page";
import { landingStructuredData } from "./structured-data";
import { headers } from "next/headers";

export default async function Home() {
  const nonce = (await headers()).get("x-nonce");
  if (!nonce) {
    throw new Error("Missing request CSP nonce.");
  }

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
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
