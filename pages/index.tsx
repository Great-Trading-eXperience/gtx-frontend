import { RiseLandingPage } from "@/components/landing-page/rise-landing-page";
import { PharosLandingPage } from "@/components/landing-page/pharos-landing-page";
import { LandingRise } from "@/components/landing-rise/landing-rise";
import { FEATURE_FLAGS } from "@/constants/contract/contract-address";
export default function Home() {
  // Early return based on configuration
  if (FEATURE_FLAGS.LANDING_PAGE_RISE) {
    return <LandingRise />;
  }
  
  if (process.env.NEXT_PUBLIC_LANDING_PAGE_PHAROS === 'true') {
    return <PharosLandingPage />;
  }
  
  // Optional: Return a default component or null
  return null;
}