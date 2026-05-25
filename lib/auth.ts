import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

const githubClientId = process.env.GITHUB_ID;
const githubClientSecret = process.env.GITHUB_SECRET;

const hasGitHubCredentials = Boolean(githubClientId && githubClientSecret);

const defaultScouts = [
  {
    id: crypto.randomUUID(),
    name: "Scout 1",
    url: "abc.com",
    description: "This is scout 1",
  },
  {
    id: crypto.randomUUID(),
    name: "Scout 2",
    url: "def.com",
    description: "This is scout 2",
  },
  {
    id: crypto.randomUUID(),
    name: "Scout 3",
    url: "ghi.com",
    description: "This is scout 3",
  },
  {
    id: crypto.randomUUID(),
    name: "Scout 4",
    url: "jkl.com",
    description: "This is scout 4",
  },
];

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: hasGitHubCredentials
    ? [
        GitHubProvider({
          clientId: githubClientId as string,
          clientSecret: githubClientSecret as string,
        }),
      ]
    : [],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      try {
        // Add default scouts if user doesn't have any
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: { scouts: true },
        });

        if (existingUser && existingUser.scouts.length === 0) {
          await prisma.user.update({
            where: { email: user.email! },
            data: { scouts: defaultScouts },
          });
        }
      } catch (error) {
        console.error("Error adding default scouts:", error);
        // Don't block sign-in if this fails
      }

      return true;
    },
    async jwt({ token, profile }) {
      if (profile) {
        token.name = profile.name ?? token.name;
        token.picture =
          (profile as { avatar_url?: string }).avatar_url ?? token.picture;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name ?? session.user.name;
        session.user.image = token.picture ?? session.user.image;
      }

      return session;
    },
  },
};
