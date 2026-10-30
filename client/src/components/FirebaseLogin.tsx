import { useEffect, useRef, useState } from "react";
import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithRedirect,
  type ConfirmationResult,
} from "firebase/auth";
import { ArrowLeft, LoaderCircle, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { firebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { startLogin } from "@/const";

function friendlyAuthError(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";
  if (code === "auth/unauthorized-domain")
    return "This website is not authorized in the Firebase project yet. Please contact the administrator.";
  if (code === "auth/invalid-phone-number")
    return "Enter a valid phone number with the country code, such as +94 77 123 4567.";
  if (code === "auth/too-many-requests" || code === "auth/quota-exceeded")
    return "Too many verification attempts. Please wait a while and try again.";
  if (code === "auth/invalid-verification-code")
    return "That verification code is not valid. Check the SMS and try again.";
  if (code === "auth/popup-closed-by-user")
    return "The Google sign-in window was closed before sign-in finished.";
  if (code === "auth/network-request-failed")
    return "A network error interrupted sign-in. Check your connection and try again.";
  return error instanceof Error
    ? error.message
    : "Sign-in could not be completed.";
}

function hasManusLogin() {
  return Boolean(
    window.__MANUS_CONFIG__?.projectId &&
      window.__MANUS_CONFIG__?.oauthPortalUrl
  );
}

export function FirebaseLogin({ compact = false }: { compact?: boolean }) {
  const [showPhone, setShowPhone] = useState(false);
  const [phone, setPhone] = useState("+94");
  const [code, setCode] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(
    null
  );
  const [verifier, setVerifier] = useState<RecaptchaVerifier | null>(null);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const [recaptchaAttempt, setRecaptchaAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const recaptchaHost = useRef<HTMLDivElement>(null);
  const auth = firebaseAuth;

  useEffect(() => {
    if (!auth || !showPhone || confirmation || !recaptchaHost.current) return;

    const instance = new RecaptchaVerifier(auth, recaptchaHost.current, {
      size: "normal",
      "expired-callback": () => {
        setError("The security check expired. Please complete it again.");
        setRecaptchaReady(false);
        setRecaptchaAttempt(attempt => attempt + 1);
      },
    });
    setVerifier(instance);
    setRecaptchaReady(false);
    instance
      .render()
      .then(() => setRecaptchaReady(true))
      .catch((reason: unknown) => setError(friendlyAuthError(reason)));

    return () => {
      instance.clear();
      setVerifier(current => (current === instance ? null : current));
      setRecaptchaReady(false);
    };
  }, [auth, showPhone, confirmation, recaptchaAttempt]);

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setError("");
    setBusy(true);
    try {
      auth.useDeviceLanguage();
      const provider = new GoogleAuthProvider();
      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      if (isMobile) {
        await signInWithRedirect(auth, provider);
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (reason) {
      setError(friendlyAuthError(reason));
    } finally {
      setBusy(false);
    }
  };

  const handleSendCode = async () => {
    if (!auth || !verifier) return;
    const normalizedPhone = phone.replace(/[\s()-]/g, "");
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
      setError(
        "Enter your phone number in international format, such as +94 77 123 4567."
      );
      return;
    }

    setError("");
    setBusy(true);
    try {
      auth.useDeviceLanguage();
      const result = await signInWithPhoneNumber(
        auth,
        normalizedPhone,
        verifier
      );
      setConfirmation(result);
      setCode("");
    } catch (reason) {
      setError(friendlyAuthError(reason));
      setRecaptchaReady(false);
      setRecaptchaAttempt(attempt => attempt + 1);
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!confirmation) return;
    const cleanCode = code.replace(/\s/g, "");
    if (!/^\d{6}$/.test(cleanCode)) {
      setError("Enter the 6-digit verification code from the SMS.");
      return;
    }

    setError("");
    setBusy(true);
    try {
      await confirmation.confirm(cleanCode);
    } catch (reason) {
      setError(friendlyAuthError(reason));
    } finally {
      setBusy(false);
    }
  };

  const panelClass = compact
    ? "space-y-4"
    : "mx-auto w-full max-w-md space-y-4 rounded-xl border border-white/10 bg-white/[0.035] p-5 sm:p-6";

  return (
    <div className={panelClass}>
      {!isFirebaseConfigured && (
        <div
          role="status"
          className="rounded-lg border border-amber-400/25 bg-amber-400/10 p-3 text-sm leading-5 text-amber-100"
        >
          Firebase sign-in is not configured for this site yet. The
          administrator needs to connect a Firebase project and add its web-app
          settings.
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-400/25 bg-red-400/10 p-3 text-sm leading-5 text-red-200"
        >
          {error}
        </p>
      )}

      {!showPhone ? (
        <>
          <Button
            type="button"
            disabled={!auth || busy}
            onClick={handleGoogleSignIn}
            className="h-11 w-full bg-primary font-bold uppercase tracking-[.08em] text-black hover:bg-[#ff5a5a]"
          >
            {busy ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <span className="mr-2 text-base font-black">G</span>
            )}
            Continue with Google
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!auth || busy}
            onClick={() => {
              setError("");
              setShowPhone(true);
            }}
            className="h-11 w-full border-white/15 bg-white/[0.04] text-white hover:bg-white/10"
          >
            <Phone className="mr-2 h-4 w-4" />
            Verify by phone number
          </Button>
          <p className="text-center text-xs leading-5 text-white/45">
            Phone sign-in sends an SMS verification code. Standard message rates
            may apply.
          </p>
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {confirmation ? "Verify your number" : "Phone verification"}
          </div>

          {!confirmation ? (
            <>
              <div className="space-y-2">
                <label
                  htmlFor="firebase-phone"
                  className="text-xs text-white/60"
                >
                  Phone number with country code
                </label>
                <Input
                  id="firebase-phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={event => setPhone(event.target.value)}
                  placeholder="+94 77 123 4567"
                  disabled={busy}
                  className="border-white/15 bg-black/25 text-white placeholder:text-white/30"
                />
              </div>
              <div ref={recaptchaHost} className="min-h-0" />
              <Button
                type="button"
                onClick={handleSendCode}
                disabled={!auth || !verifier || !recaptchaReady || busy}
                className="h-11 w-full bg-primary font-bold uppercase tracking-[.08em] text-black hover:bg-[#ff5a5a]"
              >
                {busy && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Send verification code
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm leading-5 text-white/55">
                Enter the 6-digit code sent to {phone}.
              </p>
              <Input
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={event =>
                  setCode(event.target.value.replace(/\D/g, ""))
                }
                placeholder="123456"
                disabled={busy}
                className="border-white/15 bg-black/25 text-center text-lg tracking-[0.4em] text-white placeholder:text-white/30"
              />
              <Button
                type="button"
                onClick={handleVerifyCode}
                disabled={!auth || busy || code.length !== 6}
                className="h-11 w-full bg-primary font-bold uppercase tracking-[.08em] text-black hover:bg-[#ff5a5a]"
              >
                {busy && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Verify and sign in
              </Button>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              setConfirmation(null);
              setCode("");
              setError("");
              setShowPhone(false);
            }}
            className="inline-flex items-center gap-2 text-xs font-semibold text-white/55 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Use another sign-in method
          </button>
        </div>
      )}

      {hasManusLogin() && (
        <div className="border-t border-white/10 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={startLogin}
            className="w-full text-xs text-white/55 hover:bg-white/5 hover:text-white"
          >
            Continue with the existing Manus login
          </Button>
        </div>
      )}
    </div>
  );
}
