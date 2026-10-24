import { useMemo } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  LogIn,
  PlayCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Brand, Wordmark } from "@/components/Brand";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  LanguageToggle,
  PaymentInstructions,
  useLanguage,
} from "@/components/Language";

function CourseCard({
  course,
  lessons,
  onStart,
}: {
  course: any;
  lessons: any[];
  onStart: () => void;
}) {
  const courseLessons = lessons.filter(lesson => lesson.courseId === course.id);
  return (
    <Card className="course-card overflow-hidden border-white/10 bg-white/[0.035] text-white shadow-none">
      <div className="course-card-top relative min-h-44 overflow-hidden border-b border-white/10 p-6">
        <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full border border-primary/20 bg-primary/10 blur-2xl" />
        <div className="relative flex items-start justify-between gap-4">
          <Badge className="border-primary/30 bg-primary/10 text-primary">
            {course.category}
          </Badge>
          <span className="text-right text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
            Course / 01
          </span>
        </div>
        <div className="relative mt-9">
          <h3 className="font-display max-w-sm text-2xl font-bold uppercase leading-tight tracking-[-0.03em]">
            {course.title}
          </h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-white/50">
            {course.description}
          </p>
        </div>
      </div>
      <CardContent className="space-y-5 p-6">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.12em] text-white/40">
          <span>{courseLessons.length || 3} lessons</span>
          <span>Self-paced</span>
        </div>
        <div className="space-y-2">
          {courseLessons.slice(0, 3).map(lesson => (
            <div
              key={lesson.id}
              className="flex items-center gap-3 border-t border-white/8 pt-3 text-sm text-white/65"
            >
              <PlayCircle className="h-4 w-4 text-primary" />
              <span className="flex-1">{lesson.title}</span>
              <span className="text-xs text-white/30">
                {lesson.duration || "—"}
              </span>
            </div>
          ))}
        </div>
        <Button
          onClick={onStart}
          className="w-full bg-primary font-bold uppercase tracking-[0.12em] text-black hover:bg-[#ff5a5a]"
        >
          View learning path <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const auth = useAuth();
  const { t } = useLanguage();
  const catalog = trpc.lms.catalog.useQuery();
  const courses = catalog.data?.courses ?? [];
  const lessons = catalog.data?.lessons ?? [];
  const primaryCourse = courses[0];
  const lessonCount = useMemo(() => lessons.length || 3, [lessons.length]);

  const startLearning = () => {
    if (auth.isAuthenticated) window.location.href = "/dashboard";
    else startLogin();
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#101010] text-white">
      <div className="noise" />
      <header className="relative z-10 border-b border-white/8">
        <div className="site-header-inner mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-10">
          <Brand compact />
          <nav className="hidden items-center gap-8 text-xs font-bold uppercase tracking-[0.16em] text-white/45 md:flex">
            <a href="#path" className="transition hover:text-white">
              {t.homeNav[0]}
            </a>
            <a href="#why" className="transition hover:text-white">
              {t.homeNav[1]}
            </a>
            <a href="#access" className="transition hover:text-white">
              {t.homeNav[2]}
            </a>
          </nav>
          <LanguageToggle />
          <Button
            onClick={startLearning}
            variant="outline"
            className="border-white/15 bg-white/[0.04] text-white hover:bg-white/10"
          >
            {auth.isAuthenticated ? (
              "Open dashboard"
            ) : (
              <>
                <LogIn className="h-4 w-4" /> {t.studentLogin}
              </>
            )}
          </Button>
        </div>
      </header>

      <section className="hero-section relative z-10 mx-auto grid max-w-7xl gap-12 px-5 pb-24 pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:pb-32 lg:pt-28">
        <div className="flex flex-col justify-center">
          <Wordmark />
          <p className="mt-8 max-w-xl text-lg leading-8 text-white/55 sm:text-xl">
            A focused online classroom for students who want to understand
            Commerce — not just memorize it.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={startLearning}
              size="lg"
              className="h-12 bg-primary px-7 font-bold uppercase tracking-[0.11em] text-black hover:bg-[#ff5a5a]"
            >
              {t.startClass} <ArrowRight className="h-4 w-4" />
            </Button>
            <a
              href="#path"
              className="inline-flex h-12 items-center justify-center rounded-md border border-white/12 px-7 text-sm font-bold uppercase tracking-[0.11em] text-white/70 transition hover:border-white/25 hover:text-white"
            >
              {t.exploreSyllabus}
            </a>
          </div>
          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-4 text-xs font-bold uppercase tracking-[0.14em] text-white/35">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Clear lessons
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Teacher-led
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Learn anywhere
            </span>
          </div>
        </div>
        <div className="hero-orbit relative min-h-[520px] lg:min-h-[600px]">
          <div className="teacher-card absolute inset-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[#171717] shadow-2xl shadow-black/50 lg:inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(255,59,59,.18),transparent_35%),linear-gradient(135deg,#1b1b1b,#0f0f0f)]" />
            <div className="relative z-10 flex items-center justify-between border-b border-white/10 p-6 lg:p-8">
              <span className="eyebrow">CLASSROOM / 001</span>
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="teacher-copy relative z-10 max-w-[58%] p-6 pt-8 lg:p-10 lg:pt-12">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
                Your teacher
              </p>
              <h2 className="teacher-title mt-4 font-display text-4xl font-black uppercase leading-[0.92] tracking-[-0.05em] text-white lg:text-6xl">
                Learn from
                <br />
                <span className="text-white/35">the sharpest.</span>
              </h2>
              <p className="mt-5 max-w-[220px] text-sm leading-6 text-white/45">
                Commerce made clear by Ravishka Kalinga.
              </p>
            </div>
            <img
              src="/manus-storage/sir-cutout_a8fb0dce.png"
              alt="Ravishka Kalinga teaching Commerce"
              className="teacher-cutout absolute bottom-0 right-[-12%] z-[5] w-[86%] max-w-none lg:right-[-9%] lg:w-[82%]"
            />
            <div className="teacher-callout absolute bottom-28 left-6 z-10 rounded border border-primary/25 bg-black/40 px-3 py-2 backdrop-blur-sm lg:bottom-32 lg:left-10">
              <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-primary">
                Commerce / Business + Accounting
              </div>
              <div className="mt-1 font-display text-xl font-bold uppercase text-white">
                Make the numbers make sense.
              </div>
            </div>
            <div className="teacher-stats absolute bottom-6 left-6 right-6 z-10 grid grid-cols-3 gap-2 border-t border-white/10 pt-5 text-center lg:bottom-10 lg:left-10 lg:right-10">
              <div>
                <div className="font-display text-2xl font-bold text-white">
                  01
                </div>
                <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.15em] text-white/35">
                  Subject
                </div>
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-white">
                  {String(lessonCount).padStart(2, "0")}
                </div>
                <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.15em] text-white/35">
                  Lessons
                </div>
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-white">
                  24/7
                </div>
                <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.15em] text-white/35">
                  Access
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-2 -left-2 hidden w-48 -rotate-6 border border-primary/30 bg-primary p-4 text-black shadow-2xl shadow-primary/10 sm:block lg:-left-12">
            <div className="text-[10px] font-black uppercase tracking-[0.18em]">
              No noise.
            </div>
            <div className="mt-2 font-display text-2xl font-black uppercase leading-none">
              Just progress.
            </div>
          </div>
        </div>
      </section>

      <PaymentInstructions />

      <section
        id="path"
        className="relative z-10 border-y border-white/8 bg-[#131313] px-5 py-20 lg:px-10 lg:py-28"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" /> THE PATH
              </div>
              <h2 className="mt-4 font-display text-4xl font-black uppercase tracking-[-0.04em] sm:text-6xl">
                One subject.
                <br />
                <span className="text-white/35">A real edge.</span>
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-6 text-white/45">
              Structured recordings, thoughtful explanations, and a dashboard
              that keeps your next step visible.
            </p>
          </div>
          {catalog.isLoading ? (
            <div className="rounded-xl border border-white/10 p-8 text-white/40">
              Loading the classroom…
            </div>
          ) : primaryCourse ? (
            <div className="max-w-2xl">
              <CourseCard
                course={primaryCourse}
                lessons={lessons}
                onStart={startLearning}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 p-8 text-white/40">
              The first course is being prepared.
            </div>
          )}
        </div>
      </section>

      <section
        id="why"
        className="relative z-10 mx-auto max-w-7xl px-5 py-20 lg:px-10 lg:py-28"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: BookOpen,
              title: "Learn in sequence",
              body: "Every lesson has a place. Move from the first principle to confident application.",
            },
            {
              icon: ShieldCheck,
              title: "Access that is clear",
              body: "Submit your payment receipt once. Your approval status stays visible in your dashboard.",
            },
            {
              icon: FileText,
              title: "Keep your notes close",
              body: "Lesson resources and important announcements live next to the class, not in scattered chats.",
            },
          ].map(({ icon: Icon, title, body }, index) => (
            <div key={title} className="border-t border-white/15 pt-5">
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 text-primary" />
                <span className="font-display text-3xl font-bold text-white/15">
                  0{index + 1}
                </span>
              </div>
              <h3 className="mt-10 font-display text-2xl font-bold uppercase tracking-[-0.02em]">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/45">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="access"
        className="relative z-10 border-t border-white/8 bg-primary px-5 py-16 text-black lg:px-10 lg:py-20"
      >
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-black/55">
              Your next lesson is waiting
            </div>
            <h2 className="mt-4 max-w-xl font-display text-4xl font-black uppercase leading-[0.95] tracking-[-0.04em] sm:text-6xl">
              Trade confusion
              <br />
              for clarity.
            </h2>
          </div>
          <Button
            onClick={startLearning}
            size="lg"
            className="h-12 bg-black px-7 font-bold uppercase tracking-[0.11em] text-white hover:bg-black/80"
          >
            Enter the classroom <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      <footer className="relative z-10 flex flex-col justify-between gap-4 border-t border-white/8 px-5 py-8 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 md:flex-row lg:px-10">
        <span>© {new Date().getFullYear()} Ravishka Kalinga</span>
        <span>Commerce — Business and Accounting</span>
        <a href="/admin" className="transition hover:text-white">
          {t.adminPortal}
        </a>
        <span className="flex items-center gap-1">
          <Clock3 className="h-3 w-3" /> Learn at your pace
        </span>
      </footer>
    </main>
  );
}
