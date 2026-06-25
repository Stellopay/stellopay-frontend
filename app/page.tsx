import LandingPage from "@/components/landing/landing-page";

export default function Home() {
  return (
    // id="main-content" is the skip-link target declared in the root layout.
    <main id="main-content">
      <LandingPage />
    </main>
  );
}
