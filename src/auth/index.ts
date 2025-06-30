import NextAuth from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { getConnectedClient } from "@/db";
import Resend from "next-auth/providers/resend";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: MongoDBAdapter(getConnectedClient),
  providers: [
    Resend({
      from: "no-reply@degreemapper.ai",
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    signIn: ({ user }) => {
      return !!(
        user.email?.endsWith("@mcgill.ca") ||
        user.email?.endsWith("@mail.mcgill.ca")
      );
    },
  },
});
