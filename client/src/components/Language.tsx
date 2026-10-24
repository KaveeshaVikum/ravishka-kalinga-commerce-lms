import { Languages } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Locale = "en" | "si";

const copy = {
  en: {
    language: "සිංහල",
    homeNav: ["Learning path", "Why this class", "Access"],
    studentLogin: "Student login",
    openDashboard: "Open dashboard",
    startClass: "Start your class",
    exploreSyllabus: "Explore syllabus",
    paymentTitle: "How to pay and get access",
    paymentBody:
      "Complete the class payment using the teacher’s instructions, then upload a clear receipt from your dashboard.",
    paymentStep1:
      "Contact the teacher for the current payment account details.",
    paymentStep2: "Complete the payment and keep the transaction reference.",
    paymentStep3: "Upload the receipt; admin approval unlocks the recordings.",
    paymentNote:
      "Payment instructions are kept here so every student follows the same process.",
    completeProfile: "Complete your student registration",
    profileBody:
      "Add these details once so the teacher can identify your account and contact you about the class.",
    fullName: "Full name",
    phone: "Phone number",
    school: "School / institute",
    grade: "Grade / class",
    district: "District",
    saveProfile: "Save registration",
    required: "Required",
    signInAdmin: "Sign in as admin",
    adminLoginTitle: "Admin sign in",
    adminLoginBody:
      "Use your authorized account to open the Ravishka Kalinga control room.",
    adminPortal: "Admin portal",
    accessDenied: "This account does not have admin access.",
    studentDesk: "Student desk",
    overview: "Overview",
    myLessons: "My lessons",
    paymentProof: "Payment proof",
    announcements: "Announcements",
    dashboard: "Dashboard",
    adminOverview: "Overview",
    paymentReviews: "Payment reviews",
    coursesLessons: "Courses & lessons",
    adminAnnouncements: "Announcements",
    controlRoom: "Control room",
  },
  si: {
    language: "English",
    homeNav: ["පාඩම් මාර්ගය", "මෙම පන්තිය ඇයි", "ප්‍රවේශය"],
    studentLogin: "ශිෂ්‍ය පිවිසුම",
    openDashboard: "Dashboard වෙත යන්න",
    startClass: "පන්තිය ආරම්භ කරන්න",
    exploreSyllabus: "විෂය නිර්දේශය බලන්න",
    paymentTitle: "ගෙවීම් කරන්නේ කෙසේද",
    paymentBody:
      "ගුරුවරයා ලබා දෙන ගෙවීම් විස්තර අනුව ගෙවීම කරලා dashboard එකෙන් පැහැදිලි receipt එක upload කරන්න.",
    paymentStep1: "වත්මන් ගෙවීම් ගිණුම් විස්තර සඳහා ගුරුවරයා අමතන්න.",
    paymentStep2: "ගෙවීම කර transaction reference එක සුරකින්න.",
    paymentStep3:
      "Receipt එක upload කරන්න; admin approval එකෙන් recordings unlock වේ.",
    paymentNote:
      "සියලුම ශිෂ්‍යයන් එකම ක්‍රමය අනුගමනය කිරීමට ගෙවීම් විස්තර මෙහි තබා ඇත.",
    completeProfile: "ඔබගේ ශිෂ්‍ය ලියාපදිංචිය සම්පූර්ණ කරන්න",
    profileBody:
      "ගුරුවරයාට ඔබව හඳුනාගැනීමට සහ පන්තිය ගැන සම්බන්ධ වීමට මෙම තොරතුරු එක් වරක් ලබා දෙන්න.",
    fullName: "සම්පූර්ණ නම",
    phone: "දුරකථන අංකය",
    school: "පාසල / ආයතනය",
    grade: "ශ්‍රේණිය / පන්තිය",
    district: "දිස්ත්‍රික්කය",
    saveProfile: "ලියාපදිංචිය සුරකින්න",
    required: "අවශ්‍යයි",
    signInAdmin: "Admin ලෙස පිවිසෙන්න",
    adminLoginTitle: "Admin පිවිසුම",
    adminLoginBody:
      "Ravishka Kalinga control room එක විවෘත කිරීමට අවසර ලත් account එක භාවිතා කරන්න.",
    adminPortal: "Admin portal",
    accessDenied: "මෙම account එකට admin access නැත.",
    studentDesk: "ශිෂ්‍ය පුවරුව",
    overview: "සාරාංශය",
    myLessons: "මගේ පාඩම්",
    paymentProof: "ගෙවීම් සාක්ෂි",
    announcements: "නිවේදන",
    dashboard: "Dashboard",
    adminOverview: "සාරාංශය",
    paymentReviews: "ගෙවීම් පරීක්ෂා කිරීම",
    coursesLessons: "පාඨමාලා සහ පාඩම්",
    adminAnnouncements: "නිවේදන",
    controlRoom: "පාලන පුවරුව",
  },
} as const;

type Copy = (typeof copy)[Locale];
const LanguageContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Copy;
}>({
  locale: "en",
  setLocale: () => undefined,
  t: copy.en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(
    () => (localStorage.getItem("rk-locale") as Locale) || "en"
  );
  useEffect(() => localStorage.setItem("rk-locale", locale), [locale]);
  const value = useMemo(
    () => ({ locale, setLocale, t: copy[locale] }),
    [locale]
  );
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageToggle() {
  const { locale, setLocale, t } = useLanguage();
  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "en" ? "si" : "en")}
      className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/[0.04] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white/65 transition hover:bg-white/10 hover:text-white"
      aria-label="Change language"
    >
      <Languages className="h-3.5 w-3.5 text-primary" /> {t.language}
    </button>
  );
}

export function PaymentInstructions() {
  const { t } = useLanguage();
  return (
    <section
      id="payment-instructions"
      className="relative z-10 border-y border-white/8 bg-[#171717] px-5 py-16 lg:px-10 lg:py-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-line" /> PAYMENT / ACCESS
            </div>
            <h2 className="mt-4 font-display text-4xl font-black uppercase tracking-[-.04em] text-white sm:text-5xl">
              {t.paymentTitle}
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/45">
              {t.paymentBody}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {[t.paymentStep1, t.paymentStep2, t.paymentStep3].map(
              (step, index) => (
                <div key={step} className="border-t border-white/15 pt-4">
                  <div className="font-display text-3xl font-bold text-primary">
                    0{index + 1}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/60">{step}</p>
                </div>
              )
            )}
          </div>
        </div>
        <p className="mt-8 border-l-2 border-primary pl-4 text-xs leading-5 text-white/35">
          {t.paymentNote}
        </p>
      </div>
    </section>
  );
}
