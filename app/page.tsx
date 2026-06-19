import { GoogleAuthControl } from "@/components/google-auth-control";
import { HomePageRedesign } from "@/components/home-page-redesign";
import { PublicHeader } from "@/components/public-header";

export default function HomePage() {
  const homeHeroConfig = {
    heroTitle: "Where Desire Meets",
    heroAccentWord: "Discretion",
    heroSubtitle: "Refined discovery for people who value privacy, curation, and meaningful introductions.",
    primaryCtaText: "Explore the Experience",
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
