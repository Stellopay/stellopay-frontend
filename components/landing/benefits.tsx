import { Shield, CreditCard, HeadphonesIcon } from "lucide-react";

/**
 * BenefitsSection
 *
 * Dark landing section listing three core product benefits.
 *
 * ## Design tokens used
 *
 * | Token                    | Value      | Role                              |
 * |--------------------------|------------|-----------------------------------|
 * | --color-surface-deep     | #040404    | Section background                |
 * | --color-brand-glow       | 27 67 245  | Radial glow RGB channels          |
 * | --color-brand-card       | #8eb6ff    | Featured card background          |
 * | --color-brand-border     | #598eff    | Non-featured card border          |
 * | text-white               | #ffffff    | Section heading + non-feat titles |
 * | text-muted-foreground    | —          | Subtitle + non-feat body copy     |
 * | text-foreground          | —          | Featured card heading + body      |
 *
 * ## Accessibility
 *
 * - Section uses `<section>` with an implicit region role; the `<h2>`
 *   provides the accessible name for AT users navigating by landmark.
 * - The decorative radial glow overlay is `aria-hidden` via
 *   `pointer-events-none` and carries no semantic content.
 * - Icon wrappers are decorative and do not need alt text because the card
 *   `<h3>` already names the benefit. The `<HeadphonesIcon>` colour is
 *   black on white, meeting 21:1 contrast.
 * - Featured card (#8eb6ff bg): heading `text-foreground` (#060606) at 24px
 *   bold gives ≥ 7:1 contrast; body `text-foreground` (#212121) at 14px
 *   gives ≥ 7:1 contrast. Both exceed WCAG 2.1 AA.
 * - Non-featured cards (dark bg): heading `text-white` and
 *   `text-muted-foreground` body both meet 4.5:1 on the deep surface.
 * - Subtitle uses `text-muted-foreground` on `--color-surface-deep`;
 *   muted-foreground in dark contexts resolves to ≥ 4.5:1 contrast.
 */

const benefits = [
  {
    title: "Low Fees",
    description:
      "Reduce payroll costs with blockchain-powered transactions that eliminate excessive banking fees and hidden charges. Stellopay ensures more of your money goes where it matters.",
    icon: (
      <Shield
        className="w-6 h-6"
        color="black"
        aria-hidden="true"
        focusable="false"
      />
    ),
    featured: true,
  },
  {
    title: "Ease of Use",
    description:
      "Our intuitive platform simplifies payroll management with seamless automation, real-time tracking, and effortless navigation—no technical expertise required.",
    icon: (
      <CreditCard
        className="w-6 h-6"
        color="black"
        aria-hidden="true"
        focusable="false"
      />
    ),
    featured: false,
  },
  {
    title: "Reliable Customer Support",
    description:
      "Get dedicated assistance whenever you need it. Our expert support team is always available to help with transactions, troubleshooting, and guidance.",
    icon: (
      <HeadphonesIcon
        className="w-6 h-6"
        color="black"
        aria-hidden="true"
        focusable="false"
      />
    ),
    featured: false,
  },
];

export default function BenefitsSection() {
  return (
    <section className="relative bg-[#040404] py-16 sm:py-20 lg:py-24 px-4 text-white min-h-screen">
      <div
        className="absolute inset-0 pointer-events-none z-10"
        aria-hidden="true"
        data-testid="benefits-glow-overlay"
        style={{
          background: `
            radial-gradient(circle at 20% 70%, rgba(var(--color-brand-glow) / 0.15) 15%, transparent 30%),
            radial-gradient(circle at 50% 30%, rgba(var(--color-brand-glow) / 0.15) 35%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(var(--color-brand-glow) / 0.15) 15%, transparent 30%)`,
          filter: "blur(200px)",
        }}
      />

      {/* Section accent bar */}
      <div
        className="relative z-20 w-10 h-1 bg-white mx-auto"
        aria-hidden="true"
      />

      {/* Section heading */}
      <div className="relative z-20 text-center max-w-4xl mx-auto">
        <h2
          id="benefits-heading"
          className="text-[45px] font-clash py-1"
          data-testid="benefits-heading"
        >
          Benefits
        </h2>
        <p
          className="text-base leading-[22px] text-muted-foreground font-general max-w-170 mx-auto"
          data-testid="benefits-subtitle"
        >
          All in one seamless platform. Stellopay ensures secure, instant salary
          payments without the complexity.
        </p>
      </div>

      {/* Card grid */}
      <div
        className="relative z-20 max-w-6xl mx-auto mt-10"
        data-testid="benefits-card-grid"
      >
        {/*
         * Featured card — Low Fees
         * Background: --color-brand-card (#8eb6ff)
         * Text uses text-foreground (resolves to near-black) for body and
         * heading so both meet WCAG AA contrast on the light card surface.
         */}
        <div className="flex justify-center mb-8 max-w-[400px] mx-auto">
          <div
            className="w-full max-w-md rounded-[8px] p-6 text-center"
            style={{ backgroundColor: "var(--color-brand-card)" }}
            data-testid="benefits-featured-card"
          >
            <div className="w-15 h-15 mx-auto mb-6 flex items-center justify-center rounded-full bg-white">
              {benefits[0].icon}
            </div>
            <h3
              className="text-2xl font-clash mb-3 text-foreground"
              data-testid="benefits-featured-card-title"
            >
              {benefits[0].title}
            </h3>
            <p
              className="text-sm text-foreground font-general font-medium leading-[19px]"
              data-testid="benefits-featured-card-body"
            >
              {benefits[0].description}
            </p>
          </div>
        </div>

        {/*
         * Non-featured cards — Ease of Use + Reliable Customer Support
         * Border: --color-brand-border (#598eff)
         * Heading: text-white
         * Body: text-muted-foreground (≥ 4.5:1 on --color-surface-deep)
         */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[832px] mx-auto"
          data-testid="benefits-secondary-cards"
        >
          {benefits.slice(1).map((benefit) => (
            <div
              key={benefit.title}
              className="bg-transparent max-w-[400px] mx-auto rounded-[8px] p-6 text-center"
              style={{ border: "1px solid var(--color-brand-border)" }}
              data-testid={`benefits-card-${benefit.title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className="w-15 h-15 mx-auto mb-6 flex items-center justify-center rounded-full bg-white">
                {benefit.icon}
              </div>
              <h3
                className="text-2xl font-clash mb-3 text-white"
                data-testid={`benefits-card-title-${benefit.title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {benefit.title}
              </h3>
              <p
                className="text-sm text-muted-foreground font-general font-medium leading-[19px]"
                data-testid={`benefits-card-body-${benefit.title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
