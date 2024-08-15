import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";

import type { NextAuthConfig } from "next-auth/";
import { headers } from "next/headers";

class Response {
    ok: boolean = true;
    text: string = "Login accepted"
    async json() {
        return {
            "completed": true,
            "message": "dummy message",
            "data": {
                "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
                "refresherToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
            }
        };
    }
}


const FecthLogin = async (credentials: any, path: string) => {
    const { username, password, rememberMe } = credentials;
    const header = headers()
    const response = new Response()
    if (!response.ok) {
        throw new Error(`Invalid credentials ${response.text}`);
    }
    const data = await response.json()
    return data;
}

export default {
    secret: process.env.AUTH_SECRET!,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET
        }),
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: "Username", type: "email", placeholder: "email@email.com" },
                password: { label: "Password", type: "password", placeholder: "**********" },
                rememberMe: { label: "Remember Me", type: "checkbox" }
            },
            async authorize(credentials, req) {
                try {
                    const response = await FecthLogin(credentials, `${process.env.API_BASE_URL}/Authentication/login`)
                    if (response.completed === false) {
                        throw new Error(response.message);
                    } else {
                        if (response?.data?.access_token) {
                            return response;
                        }
                    }
                } catch (error) {
                    console.error("authorize", error);
                }
                return null;
            }
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (token) {
                session.accessToken = token?.accessToken;
                session.refresherToken = token?.refresherToken;
            }
            return session;
        },
        async jwt({ token, user }) {
            const tokenData = user?.data
            if (user) {
                token.accessToken = tokenData.access_token;
                token.refresherToken = tokenData.refresh_token;
            }
            return token;
        }
    },
    pages: {
        signIn: '/api/auth/sign-in',
        signOut: '/auth/sign-out',
        error: '/auth/error', // Error code passed in query string as ?error=
        verifyRequest: '/auth/verify-request', // (used for check email message)
        newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out if not of interest)
    }
} satisfies NextAuthConfig;
