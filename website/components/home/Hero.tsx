import Link from "next/link";
import { YCLogo } from "./img/ycLogo";
import { Button } from "../ui/button";
import Image from "next/image";
import phLight from "./img/ph_product_of_the_day_light.png";
import phDark from "./img/ph_product_of_the_day_dark.png";
// import { CloudflareVideo } from "../Video";
import GoldenKittyAwardSVG from "./img/ph_gke_ai_infra.svg";
import GoldenKittyAwardSVGWhite from "./img/ph_gke_ai_infra_white.svg";
import { HomeSection } from "./components/HomeSection";
import { CloudflareVideo } from "../Video";

export function Hero() {
  return (
    <HomeSection>
      {/* HERO */}
      <div className="flex flex-col items-start justify-center gap-3 md:min-h-[calc(60vh-100px)] lg:pt-20">
        <h1 className="text-4xl sm:text-7xl lg:text-8xl font-bold font-mono">
          Open Source
          <br />
          Customer Platform
        </h1>
        <span className="mt-2 text-primary/70 text-2xl sm:text-3xl lg:text-4xl md:text-balance font-semibold tracking-wide">
          <s>Connect 15 SaaS to go-to-market</s> {"->"} manage the full customer
          lifecycle in one app
          {/* <Link href="/docs/data-provider" className="underline">
            Lead data provider
          </Link>
          ,{" "}
          <Link href="/docs/sales-engagement" className="underline">
            sales engagement
          </Link>
          ,{" "}
          <Link href="/docs/call-transcription" className="underline">
            call transcription
          </Link>{" "}
          <Link href="/docs/customer-support" className="underline">
            knowledge base
          </Link>{" "}
          <Link href="/docs/customer-support" className="underline">
            customer support
          </Link>{" "}
          to debug and improve your LLM application.
          <Link href="/docs/shared-channel" className="underline">
            metrics
          </Link>{" "} */}
        </span>

        <div className="flex gap-4 flex-wrap items-center justify-center my-4">
          <Button size="lg" asChild className="whitespace-nowrap w-100[px]">
            <Link href="/waitlist">Join Waitlist</Link>
          </Button>
          <Button
            variant="secondary"
            size="lg"
            asChild
            className="whitespace-nowrap w-100[px]"
          >
            <Link href="/docs">Read Manifesto</Link>
          </Button>
        </div>
      </div>
      {/* Badges
      <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-4 items-center justify-items-center my-10 flex-wrap">
      </div> */}
    </HomeSection>
  );
}

const ProductHuntBadge = () => (
  <a
    href="https://www.producthunt.com/posts/langfuse-2-0?utm_source=badge-top-post-badge&utm_medium=badge&utm_souce=badge-langfuse"
    target="_blank"
  >
    <Image
      src={phLight}
      alt="Product Hunt - Product of the Day"
      width={250}
      height={54}
      className="block dark:hidden"
    />
    <Image
      src={phDark}
      alt="Product Hunt - Product of the Day"
      width={250}
      height={54}
      className="hidden dark:block"
    />
  </a>
);
