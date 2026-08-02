import { GoogleAuthControl } from "@/components/google-auth-control";
import { HomePageRedesign } from "@/components/home-page-redesign";
import { PublicHeader } from "@/components/public-header";

export default function HomePage() {
  const homeHeroConfig = {
    heroTitle: "Real connection starts",
    heroAccentWord: "here",
    heroSubtitle: "Vexa brings private conversations, meaningful introductions, and real presence into one beautifully simple space.",
    primaryCtaText: "Enter Vexa",
    secondaryCtaText: "Create Your Profile"
  };

  return (
    <>
      <PublicHeader rightSlot={<GoogleAuthControl />} />
      <HomePageRedesign
        profiles={[]}
        favoriteProfileIds={[]}
        homeSections={[]}
        homepageImages={[]}
        homeHeroConfig={homeHeroConfig}
      />
    </>
  );
}
