import { PharosLandingPage } from "@/components/landing-page/pharos-landing-page";
import { LandingEspresso } from "@/components/landing-rise/landing-espresso";
import { LandingRise } from "@/components/landing-rise/landing-rise";
import { isFeatureEnabled } from "@/constants/features/features-config";

export default function Home() {
  // Early return based on configuration
  if (isFeatureEnabled('LANDING_PAGE_RISE')) {
    return <LandingRise />;
  }
  
  if (isFeatureEnabled('LANDING_PAGE_PHAROS')) {
    return <PharosLandingPage />;
  }
  
  if (isFeatureEnabled('LANDING_PAGE_ESPRESSO')) {
    return <LandingEspresso />;
  }
  
  // Optional: Return a default component or null
  return null;
}