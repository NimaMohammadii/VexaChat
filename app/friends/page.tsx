import { HeaderMenuDrawer } from "@/components/header-menu-drawer";
import { FriendsPage } from "@/components/friends/friends-page";

export default function FriendsRoutePage() {
  return (
    <>
      <header className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 pt-6 md:px-8">
        <HeaderMenuDrawer />
      </header>
      <FriendsPage />
    </>
  );
}
