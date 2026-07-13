import { redirect } from "next/navigation";

// Forward ?shop to the onboarding form so the embedded-app deep link
// (onboard.street.london/?shop=<domain>) lands with the store prefilled and
// locked. A bare redirect("/onboard") drops the query string, which left the
// store field editable instead of read-only (TT-359 / App Store req 2.3.1).
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string | string[] }>;
}) {
  const { shop } = await searchParams;
  const shopValue = Array.isArray(shop) ? shop[0] : shop;
  redirect(shopValue ? `/onboard?shop=${encodeURIComponent(shopValue)}` : "/onboard");
}
