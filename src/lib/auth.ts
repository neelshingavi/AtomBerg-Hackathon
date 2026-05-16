import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import AzureAD from "next-auth/providers/azure-ad";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Role } from "@prisma/client";
import type { Provider } from "next-auth/providers";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const providers: Provider[] = [
  Credentials({
    id: "credentials",
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const { prisma } = await import("@/lib/prisma");
      const parsed = credentialsSchema.safeParse(credentials);
      if (!parsed.success) return null;

      const user = await prisma.user.findUnique({
        where: { email: parsed.data.email, isActive: true },
      });

      if (!user?.passwordHash) return null;

      const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
      if (!valid) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        departmentId: user.departmentId,
        managerId: user.managerId,
        employeeCode: user.employeeCode,
      };
    },
  }),
];

const azureConfigured =
  Boolean(process.env.AZURE_AD_CLIENT_ID?.trim()) &&
  Boolean(process.env.AZURE_AD_CLIENT_SECRET?.trim()) &&
  Boolean(process.env.AZURE_AD_TENANT_ID?.trim());

if (azureConfigured) {
  providers.push(
    AzureAD({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "credentials") {
        const { prisma } = await import("@/lib/prisma");
        const email = user.email?.toLowerCase().trim();
        if (!email) return false;
        const dbUser = await prisma.user.findFirst({
          where: {
            email: { equals: email, mode: "insensitive" },
            isActive: true,
          },
        });
        if (!dbUser) return false;
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        if (account?.provider === "credentials") {
          token.id = user.id!;
          token.role = user.role as Role;
          token.departmentId = user.departmentId;
          token.managerId = user.managerId;
          token.employeeCode = user.employeeCode;
        } else {
          const { prisma } = await import("@/lib/prisma");
          const email = user.email?.toLowerCase().trim();
          if (email) {
            const dbUser = await prisma.user.findFirst({
              where: {
                email: { equals: email, mode: "insensitive" },
                isActive: true,
              },
            });
            if (dbUser) {
              token.id = dbUser.id;
              token.role = dbUser.role;
              token.departmentId = dbUser.departmentId;
              token.managerId = dbUser.managerId;
              token.employeeCode = dbUser.employeeCode;
            }
          }
        }
      }

      if (trigger === "update" && token.id) {
        const { prisma } = await import("@/lib/prisma");
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.departmentId = dbUser.departmentId;
          token.managerId = dbUser.managerId;
          token.employeeCode = dbUser.employeeCode;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (!token.id) return session;

      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      session.user.departmentId = token.departmentId as string;
      session.user.managerId = (token.managerId as string | null | undefined) ?? null;
      session.user.employeeCode = token.employeeCode as string;
      return session;
    },
  },
});
