import { PharosLanding, EspressoLanding, RiseLanding } from "@/components/landing";
import { isFeatureEnabled } from "@/constants/features/features-config";

export default function Home() {
  // Early return based on configuration
  if (isFeatureEnabled('LANDING_PAGE_RISE')) {
    return <RiseLanding />;
  }
  
  if (isFeatureEnabled('LANDING_PAGE_PHAROS')) {
    return <PharosLanding />;
  }
  
  if (isFeatureEnabled('LANDING_PAGE_ESPRESSO')) {
    return <EspressoLanding />;
  }
  
  // Optional: Return a default component or null
  return null;
}