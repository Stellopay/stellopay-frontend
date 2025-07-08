import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

interface AuthShowcaseProps {
  title: string;
  description: string;
  imagePosition: "left" | "right";
  imageSrc?: string;
}

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
      className={`w-full ${imagePosition === "left" ? "order-2 lg:order-1" : "order-2 lg:order-2"}`}
    >
      <Card className={`bg-[#35183A] border-0 p-0 ${paddingClass} pt-20`}>
        <CardContent className="p-0 space-y-14">
          <div className="space-y-3">
            <h2 className="text-2xl text-[#F8D2FE]">{title}</h2>
            <p className="text-[#E5E5E5] text-sm">{description}</p>
          </div>
          <Image
            src={imageSrc || "/placeholder.svg"}
            alt="Dashboard Preview"
            width={500}
            height={500}
            className={`${borderRadiusClass} w-full`}
          />
        </CardContent>
      </Card>
    </section>
  );
}
