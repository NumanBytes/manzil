import {z} from "zod";
import NextAuth from "next-auth";
import {PrismaAdapter} from "@auth/prisma-adapter";
import {prisma} from "@/lib/prisma";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials"

import bcrypt from "bcryptjs";

const credentialsSchema  = z.object({
    email: z.email(),
    password: z.string().min(8),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),

    session: {
        strategy: "jwt",
    },

    pages: {
        signIn: "/login",
        error: "/login",
        newUser: "/onboarding",
    },

    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),

        Credentials({
            async authorize(credentials) {
                const parsed = credentialsSchema.safeParse(credentials)
                if (!parsed.success) return null

                const { email, password } = parsed.data

                const user = await prisma.user.findUnique({
                    where: { email },
                })

                if (!user || !user.password) return null

                const passwordMatch = await bcrypt.compare(password, user.password)
                if (!passwordMatch) return null

                return user
            },
        }),
    ],

    callbacks: {
        async session({ session, token }) {
            if (token.sub) {
                session.user.id = token.sub
            }
            if (token.onboarded != undefined) {
                session.user.onboarded = token.onboarded as boolean
            }
            return session
        },

        async jwt({ token, user }) {
            if (user) {
                token.onboarded = (user as any).onboarded
            }
            return token
        },
    },
})