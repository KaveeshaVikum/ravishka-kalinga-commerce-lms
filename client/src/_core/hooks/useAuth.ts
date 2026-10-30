import { trpc } from "@/lib/trpc";
import { firebaseAuth } from "@/lib/firebase";
import { TRPCClientError } from "@trpc/client";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useCallback, useEffect, useState } from "react";

export function useAuth() {
  const utils = trpc.useUtils();
  const [firebaseReady, setFirebaseReady] = useState(!firebaseAuth);

  useEffect(() => {
    if (!firebaseAuth) {
      setFirebaseReady(true);
      return;
    }

    return onAuthStateChanged(firebaseAuth, () => {
      setFirebaseReady(true);
      void utils.auth.me.invalidate();
    });
  }, [utils]);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: firebaseReady,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        !(error instanceof TRPCClientError) ||
        error.data?.code !== "UNAUTHORIZED"
      ) {
        throw error;
      }
    } finally {
      try {
        if (firebaseAuth) await signOut(firebaseAuth);
      } catch (error) {
        console.warn("[Auth] Firebase sign-out did not complete:", error);
      }
      try {
        sessionStorage.removeItem("manus-cookie");
        localStorage.removeItem("manus-runtime-user-info");
      } catch {
        // Browser storage can be unavailable in privacy-restricted contexts.
      }
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "manus-runtime-user-info",
        JSON.stringify(meQuery.data ?? null)
      );
    } catch {
      // Browser storage can be unavailable in privacy-restricted contexts.
    }
  }, [meQuery.data]);

  return {
    user: meQuery.data ?? null,
    loading: !firebaseReady || meQuery.isLoading || logoutMutation.isPending,
    error: meQuery.error ?? logoutMutation.error ?? null,
    isAuthenticated: Boolean(meQuery.data),
    refresh: () => meQuery.refetch(),
    logout,
  };
}
