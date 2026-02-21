export type Profile = {
  id: string;
  supabaseUserId?: string | null;
  name: string;
  age: number;
  city: string;
  price: number;
  description: string;
  images: string[];
  height: string;
  languages: string[];
  availability: string;
  verified: boolean;
  isTop: boolean;
  experienceYears: number;
  rating: number;
  services: string[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProfileInput = Omit<
  Profile,
  "id" | "createdAt" | "updatedAt" | "supabaseUserId" | "isPublished"
>;
