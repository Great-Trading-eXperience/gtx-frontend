import { RiseLandingPage } from "@/components/landing-page/rise-landing-page";
import { PharosLandingPage } from "@/components/landing-page/pharos-landing-page";
import { LandingRise } from "@/components/landing-rise/landing-rise";

export default function Home() {
  // Early return based on configuration
  if (process.env.NEXT_PUBLIC_LANDING_PAGE_RISE === 'true') {
    return <LandingRise />;
  }
  
  if (process.env.NEXT_PUBLIC_LANDING_PAGE_PHAROS === 'true') {
    return <PharosLandingPage />;
  }
  
  // Optional: Return a default component or null
  return null;
}