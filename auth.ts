import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? ""
    })
  ],
  pages: {
    signIn: "/"
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) {
        return false;
      }

      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name ?? undefined,
          image: user.image ?? undefined
        },
        create: {
          email: user.email,
          name: user.name,
          image: user.image,
          role: "USER",
          kycStatus: "NONE"
        }
      });

      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (dbUser) {
          token.sub = dbUser.id;
          token.role = dbUser.role;
          token.kycStatus = dbUser.kycStatus;
        }
      }

      if (token.sub && (!token.role || !token.kycStatus)) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.sub } });
        if (dbUser) {
          token.role = dbUser.role;
          token.kycStatus = dbUser.kycStatus;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role as "USER" | "CREATOR" | "ADMIN";
        session.user.kycStatus = token.kycStatus as "NONE" | "PENDING" | "APPROVED" | "REJECTED";
      }

      return session;
    }
  }
});
