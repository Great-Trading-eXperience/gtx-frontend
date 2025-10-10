import { LandingEspresso } from "@/_components/landing-page/landing-espresso";

// Force dynamic rendering to prevent SSG issues with Privy
export const dynamic = 'force-dynamic';

export default function Home() {
  return <LandingEspresso />;
}
