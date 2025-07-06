import { Button } from "@/components/ui/button"
import Image from "next/image"

export function SignUpSocialButtons() {
  return (
    <div className="flex md:flex-row flex-col justify-center items-center gap-3 mt-10">
      <Button variant={"outline"} asChild className="border-muted-foreground cursor-pointer w-full md:w-auto">
        <span>
          <Image src={"/google-logo.svg"} alt="Google logo" width={20} height={20} />
          Continue With Google
        </span>
      </Button>
      <Button variant={"outline"} asChild className="border-muted-foreground cursor-pointer w-full md:w-auto">
        <span>
          <Image src={"/apple-logo.svg"} alt="Apple logo" width={20} height={20} />
          Continue With Apple
        </span>
      </Button>
    </div>
  )
}
