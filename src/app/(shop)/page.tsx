import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedGrid, TryOnBanner, ValueStrip } from "@/components/home/HomeSections";
import { NewsletterCTA } from "@/components/home/NewsletterCTA";
import { StorySection } from "@/components/home/StorySection";
import { getFeaturedProducts, getLiveDrop, getNextDrop, toSnapshot } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [nextDrop, liveDrop, featured] = await Promise.all([getNextDrop(), getLiveDrop(), getFeaturedProducts(6)]);
  const heroDrop = nextDrop ? toSnapshot(nextDrop) : liveDrop ? toSnapshot(liveDrop) : null;
  const liveSnapshot = liveDrop ? toSnapshot(liveDrop) : null;
  const tryOnProduct = featured.find((p) => p.model_3d_url);

  return (
    <>
      <HeroSection drop={heroDrop} liveDrop={liveSnapshot} />
      <ValueStrip />
      <FeaturedGrid products={featured} liveDrop={liveSnapshot} />
      <TryOnBanner product={tryOnProduct} />
      <StorySection />
      <NewsletterCTA />
    </>
  );
}
