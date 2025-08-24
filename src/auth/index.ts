import NextAuth from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { getConnectedClient } from "@/db";
import Resend from "next-auth/providers/resend";
import type { Provider } from "next-auth/providers";
import { sendVerificationRequest } from "./sendRequest";

const providers: Provider[] = [
  Resend({
    from: process.env.RESEND_FROM!,
    sendVerificationRequest,
  }),
];

// https://authjs.dev/guides/pages/signin
export const providerMap = providers
  .map((provider) => {
    if (typeof provider === "function") {
      const providerData = provider();
      return { id: providerData.id, name: providerData.name };
    } else {
      return { id: provider.id, name: provider.name };
    }
  })
  .filter((provider) => provider.id !== "credentials");

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: MongoDBAdapter(getConnectedClient, {
    databaseName: process.env.USER_DATABASE_NAME!,
  }),
  providers,
  session: { strategy: "jwt" },
  callbacks: {
    signIn: ({ user }) => {
      return !!(
        user.email?.endsWith("@mcgill.ca") ||
        user.email?.endsWith("@mail.mcgill.ca")
      );
    },
  },
  pages: {
    signIn: "/auth",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },
});
