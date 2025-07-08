"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";

export function AuthSocialButtons() {
  const handleGoogleLogin = () => {
    console.log("Authenticating with Google...");
    // Add your actual Google auth logic here
  };

  const handleAppleLogin = () => {
    console.log("Authenticating with Apple...");
    // Add your actual Apple auth logic here
  };

  return (
    <div className="flex md:flex-row flex-col justify-center items-center gap-3 mt-10">
      <Button
        variant={"outline"}
        onClick={handleGoogleLogin}
        className="border-muted-foreground cursor-pointer w-full md:w-auto"
      >
        <Image
          src={"/google-logo.svg"}
          alt="Google logo"
          width={20}
          height={20}
        />
        Continue With Google
      </Button>
      <Button
        variant={"outline"}
        onClick={handleAppleLogin}
        className="border-muted-foreground cursor-pointer w-full md:w-auto"
      >
        <Image
          src={"/apple-logo.svg"}
          alt="Apple logo"
          width={20}
          height={20}
        />
        Continue With Apple
      </Button>
    </div>
  );
}
