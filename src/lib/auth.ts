import NextAuth from "next-auth";
import {PrismaAdapter} from "@auth/prisma-adapter";
import {prisma} from "@/lib/prisma";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials"
import { authConfig } from "@/lib/auth.config"
import { credentialsSchema } from "@/lib/validations/auth"

import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    // @auth/prisma-adapter types against @prisma/client's PrismaClient; Prisma 7's
    // "prisma-client" generator (required for a custom output path) produces a
    // structurally different type, so this cast is needed despite runtime compatibility.
    adapter: PrismaAdapter(prisma as Parameters<typeof PrismaAdapter>[0]),

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
})
