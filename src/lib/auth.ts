import NextAuth, { CredentialsSignin, DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";

class DatabaseUnavailableError extends CredentialsSignin {
  code = "database_unavailable";
}

function isDatabaseConnectionError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  return (
    name.includes("mongo") ||
    message.includes("querysrv") ||
    message.includes("econnrefused") ||
    message.includes("enotfound") ||
    message.includes("server selection") ||
    message.includes("timed out")
  );
}

// Extend the built-in session types to include our custom fields
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "user" | "partner" | "admin" | "superadmin";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "user" | "partner" | "admin" | "superadmin";
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
    }),
    CredentialsProvider({
      name: "CMS Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await dbConnect();

          const user = await User.findOne({ email: credentials.email });

          // Ensure user exists and has a password (non-Google users or admins)
          if (!user || !user.password) {
            return null;
          }

          // Verify password
          const isPasswordCorrect = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isPasswordCorrect) {
            return null;
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
          };
        } catch (error) {
          if (isDatabaseConnectionError(error)) {
            console.error("CMS credentials login database error:", error);
            throw new DatabaseUnavailableError();
          }

          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await dbConnect();
        
          // Find or create the user in MongoDB
          let existingUser = await User.findOne({ email: user.email });
        
          if (!existingUser) {
            existingUser = await User.create({
              name: user.name,
              email: user.email,
              image: user.image,
              role: "user", // Default role is user
              googleId: user.id,
            });
          } else if (!existingUser.googleId) {
            // If user registered with credentials, link Google ID
            existingUser.googleId = user.id;
            if (!existingUser.image && user.image) {
              existingUser.image = user.image;
            }
            await existingUser.save();
          }
        
          user.role = existingUser.role;
          user.id = existingUser._id.toString();
        } catch (error) {
          if (isDatabaseConnectionError(error)) {
            console.error("Google login database error:", error);
            return "/login?error=DatabaseUnavailable";
          }

          throw error;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      
      // Handle session updates (e.g. role change)
      if (trigger === "update" && session?.role) {
        token.role = session.role;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as "user" | "partner" | "admin" | "superadmin";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
