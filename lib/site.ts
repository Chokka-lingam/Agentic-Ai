export const SITE_NAME = "TripNovaAI"
export const SITE_TITLE = "AI Travel Planner & Chat Agent for Smart Trips";
export const SITE_DESCRIPTION =
  "Plan trips faster with an AI travel planner, chat agent, itinerary generator, and smart destination recommendations for seamless travel planning.";

export function getSiteUrl(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;
  const fallbackUrl = "http://localhost:3000";

  return (siteUrl || vercelUrl || fallbackUrl).replace(/\/$/, "");
}
