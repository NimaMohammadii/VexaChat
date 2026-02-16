import { Profile } from "@/lib/types";

const initialProfiles: Profile[] = [
  {
    id: "1",
    name: "Ava Morgan",
    age: 27,
    city: "New York",
    price: "$450/hr",
    description:
      "A refined and discreet companion focused on premium city experiences with clean communication and calm presence.",
    services: ["Dinner Companion", "Travel Companion", "Private Events"],
    images: [
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?auto=format&fit=crop&w=900&q=80"
    ]
  },
  {
    id: "2",
    name: "Mila Hart",
    age: 29,
    city: "London",
    price: "$520/hr",
    description:
      "Minimal, elegant and well-traveled. Built for clients who value discretion and intelligent conversation.",
    services: ["Luxury Evenings", "Weekend Travel", "Business Events"],
    images: [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80"
    ]
  },
  {
    id: "3",
    name: "Nora Vale",
    age: 26,
    city: "Paris",
    price: "$490/hr",
    description:
      "Polished, warm and effortless. Designed for high-end social events and private curated experiences.",
    services: ["Private Bookings", "Social Events", "Fine Dining"],
    images: [
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=900&q=80"
    ]
  }
];

let profiles = [...initialProfiles];

export function getProfiles() {
  return profiles;
}

export function getProfile(id: string) {
  return profiles.find((profile) => profile.id === id);
}

export function updateProfile(id: string, data: Partial<Profile>) {
  profiles = profiles.map((profile) =>
    profile.id === id
      ? {
          ...profile,
          ...data,
          services: data.services ?? profile.services,
          images: data.images ?? profile.images
        }
      : profile
  );
  return getProfile(id);
}

export function deleteProfile(id: string) {
  const exists = profiles.some((profile) => profile.id === id);
  profiles = profiles.filter((profile) => profile.id !== id);
  return exists;
}
