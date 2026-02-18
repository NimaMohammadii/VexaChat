import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "USER" | "CREATOR" | "ADMIN";
      kycStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "USER" | "CREATOR" | "ADMIN";
    kycStatus?: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  }
}
