import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { AuthShowcaseProps } from "@/types/auth";

export function AuthShowcase({
  title,
  description,
  imagePosition,
  imageSrc = "/dashboard-preview.jpg",
}: AuthShowcaseProps) {
  const paddingClass = imagePosition === "left" ? "pl-14" : "pr-14";
  const borderRadiusClass =
    imagePosition === "left"
      ? "rounded-br-xl rounded-tl-xl"
      : "rounded-bl-xl rounded-tr-xl";

  return (
    <section
      className={`w-full ${
        imagePosition === "left" ? "order-2 lg:order-1" : "order-2 lg:order-2"
      }`}
    >
      <Card className={`bg-[#35183A] border-0 p-0 ${paddingClass} pt-20`}>
        <CardContent className="p-0 space-y-14">
          <div className="space-y-3 relative z-10 p-6 -m-6 rounded-xl dark:bg-gradient-to-b dark:from-black/80 dark:to-transparent">
            <h2 className="text-2xl text-[#F8D2FE]">{title}</h2>
            <p className="text-[#E5E5E5] text-sm">{description}</p>
          </div>
          <Image
            src={imageSrc || "/placeholder.svg"}
            alt={title ? `${title} showcase preview` : "Dashboard Preview"}
            width={500}
            height={500}
            sizes="(max-width: 1024px) 100vw, 500px"
            className={`${borderRadiusClass} w-full`}
          />
        </CardContent>
      </Card>
    </section>
  );
}
