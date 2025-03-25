import NextAuth from "next-auth"
import Apple from "next-auth/providers/apple"
import Facebook from "next-auth/providers/facebook"
import Google from "next-auth/providers/google"

export const { handlers, signIn: nextAuthSign, signOut, auth } = NextAuth({
  providers: [Google, Facebook, Apple],
})

export const signIn = (provider: "apple" | "facebook" | "google") => {
  return async () => {
    "use server";
    return nextAuthSign(provider);
  };
};