import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

export function SignUpShowcase() {
  return (
    <section className="w-full">
      <Card className="bg-[#35183A] border-0 p-0 pl-14 pt-20">
        <CardContent className="p-0 space-y-14">
          <div className="space-y-3">
            <h2 className="text-2xl text-[#F8D2FE]">
              StelloPay streamlines global payroll with fast, secure blockchain payments.
            </h2>
            <p className="text-[#E5E5E5] text-sm">Enter your credentials to access your account</p>
          </div>
          <Image
            src={"/dashboard-preview.jpg"}
            alt="Dashboard Preview"
            width={500}
            height={500}
            className="rounded-br-xl rounded-tl-xl w-full"
          />
        </CardContent>
      </Card>
    </section>
  )
}
