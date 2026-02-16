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
  },
  {
    id: "4",
    name: "Elise Rowan",
    age: 28,
    city: "Los Angeles",
    price: "$430/hr",
    description:
      "Confident and composed with a modern approach to private bookings and social companionship.",
    services: ["Private Events", "City Tours", "Dinner Dates"],
    images: [
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80"
    ]
  },
  {
    id: "5",
    name: "Clara Monroe",
    age: 30,
    city: "Chicago",
    price: "$410/hr",
    description: "Poised, conversational, and discreet for private evening engagements.",
    services: ["Dinner Companion", "Gala Events", "Travel Companion"],
    images: [
      "https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1485893086445-ed75865251e0?auto=format&fit=crop&w=900&q=80"
    ]
  },
  {
    id: "6",
    name: "Ivy Sinclair",
    age: 25,
    city: "Miami",
    price: "$390/hr",
    description: "Elegant and approachable with a focus on refined, relaxed company.",
    services: ["Private Bookings", "Fine Dining", "Weekend Escapes"],
    images: [
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80"
    ]
  },
  {
    id: "7",
    name: "Sophie Lane",
    age: 29,
    city: "Toronto",
    price: "$420/hr",
    description: "Known for seamless communication, punctuality, and a polished presence.",
    services: ["Business Events", "Dinner Companion", "Travel Companion"],
    images: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=900&q=80"
    ]
  },
  {
    id: "8",
    name: "Jade Ellis",
    age: 27,
    city: "Berlin",
    price: "$400/hr",
    description: "Sophisticated yet relaxed, ideal for clients seeking effortless company.",
    services: ["Private Bookings", "Social Events", "Weekend Travel"],
    images: [
      "https://images.unsplash.com/photo-1506863530036-1efeddceb993?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1512310604669-443f26c35f52?auto=format&fit=crop&w=900&q=80"
    ]
  },
  {
    id: "9",
    name: "Naomi West",
    age: 28,
    city: "Dubai",
    price: "$560/hr",
    description: "Discreet and attentive for premium travel and private city evenings.",
    services: ["Luxury Evenings", "Travel Companion", "Private Events"],
    images: [
      "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=900&q=80"
    ]
  },
  {
    id: "10",
    name: "Aria Knox",
    age: 26,
    city: "Madrid",
    price: "$380/hr",
    description: "Warm and articulate with a minimalist, professional booking style.",
    services: ["Dinner Companion", "City Experiences", "Fine Dining"],
    images: [
      "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1546961329-78bef0414d7c?auto=format&fit=crop&w=900&q=80"
    ]
  },
  {
    id: "11",
    name: "Lena Sterling",
    age: 31,
    city: "Sydney",
    price: "$470/hr",
    description: "A calm, upscale companion with exceptional etiquette and reliability.",
    services: ["Private Events", "Business Dinners", "Travel Companion"],
    images: [
      "https://images.unsplash.com/photo-1526080676457-4544bf0ebba9?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80"
    ]
  },
  {
    id: "12",
    name: "Daphne Cole",
    age: 27,
    city: "Vienna",
    price: "$440/hr",
    description: "Refined, cultured, and attentive to detail for premium bookings.",
    services: ["Opera Nights", "Fine Dining", "Private Companion"],
    images: [
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80"
    ]
  },
  {
    id: "13",
    name: "Bianca Gray",
    age: 24,
    city: "Amsterdam",
    price: "$360/hr",
    description: "Stylish and conversational for sophisticated city meetings.",
    services: ["Dinner Companion", "Museum Evenings", "Social Events"],
    images: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80"
    ]
  },
  {
    id: "14",
    name: "Zoe Mercer",
    age: 30,
    city: "San Francisco",
    price: "$510/hr",
    description: "Executive-level professionalism with discreet private coordination.",
    services: ["Corporate Events", "Travel Companion", "Private Bookings"],
    images: [
      "https://images.unsplash.com/photo-1512310604669-443f26c35f52?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80"
    ]
  },
  {
    id: "15",
    name: "Rhea Collins",
    age: 28,
    city: "Rome",
    price: "$430/hr",
    description: "Chic and discreet with a balanced, natural social presence.",
    services: ["Fine Dining", "Private Events", "Weekend Travel"],
    images: [
      "https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1506863530036-1efeddceb993?auto=format&fit=crop&w=900&q=80"
    ]
  },
  {
    id: "16",
    name: "Kira Blake",
    age: 27,
    city: "Singapore",
    price: "$540/hr",
    description: "Effortless company for premium evenings and private travel.",
    services: ["Luxury Evenings", "Business Travel", "Private Companion"],
    images: [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1546961329-78bef0414d7c?auto=format&fit=crop&w=900&q=80"
    ]
  },
  {
    id: "17",
    name: "Tessa Quinn",
    age: 25,
    city: "Dublin",
    price: "$370/hr",
    description: "Friendly, polished, and easy to coordinate for short-notice bookings.",
    services: ["City Companion", "Dinner Dates", "Private Events"],
    images: [
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1526080676457-4544bf0ebba9?auto=format&fit=crop&w=900&q=80"
    ]
  },
  {
    id: "18",
    name: "Maya Rhodes",
    age: 29,
    city: "Lisbon",
    price: "$405/hr",
    description: "Modern, discreet companionship tailored to private schedules.",
    services: ["Private Bookings", "Yacht Events", "Evening Company"],
    images: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=900&q=80"
    ]
  },
  {
    id: "19",
    name: "Freya Stone",
    age: 26,
    city: "Monaco",
    price: "$590/hr",
    description: "Premium private companion for exclusive social calendars.",
    services: ["Luxury Events", "Travel Companion", "Fine Dining"],
    images: [
      "https://images.unsplash.com/photo-1485893086445-ed75865251e0?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80"
    ]
  },
  {
    id: "20",
    name: "Sienna Vale",
    age: 28,
    city: "Tokyo",
    price: "$500/hr",
    description: "Quiet confidence, elegant presentation, and exceptional privacy standards.",
    services: ["Private Events", "Cultural Evenings", "Business Companion"],
    images: [
      "https://images.unsplash.com/photo-1512310604669-443f26c35f52?auto=format&fit=crop&w=900&q=80",
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
