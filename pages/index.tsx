import { RiseLandingPage } from "@/components/landing-page/rise-landing-page";
import { PharosLandingPage } from "@/components/landing-page/pharos-landing-page";

export default function Home() {
  // Early return based on configuration
  if (process.env.NEXT_PUBLIC_LANDING_PAGE_RISE === 'true') {
    return <RiseLandingPage />;
  }
  
  if (process.env.NEXT_PUBLIC_LANDING_PAGE_PHAROS === 'true') {
    return <PharosLandingPage />;
  }
  
  // Optional: Return a default component or null
  return null;
}