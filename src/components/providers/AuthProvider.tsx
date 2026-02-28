"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type UserData = { full_name: string | null; role: string | null };

type AuthContextType = {
    session: Session | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
    userData: UserData | null;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    isLoading: true,
    signOut: async () => { },
    userData: null
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUserData = async (userId: string) => {
        const { data, error } = await supabase
            .from("users")
            .select("full_name, role")
            .eq("id", userId)
            .single();

        if (!error && data) {
            setUserData(data as UserData);
        }
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                fetchUserData(session.user.id).finally(() => setIsLoading(false));
            } else {
                setIsLoading(false);
            }
        });

        // Subscribe to auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) {
                fetchUserData(session.user.id);
            } else {
                setUserData(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUserData(null);
        // Clear demo session cookie
        document.cookie = "unify_demo_session=; path=/; max-age=0";
    };

    return (
        <AuthContext.Provider value={{ session, isLoading, signOut, userData }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
