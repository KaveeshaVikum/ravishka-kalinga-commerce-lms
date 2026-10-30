import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileImage,
  FileUp,
  LockKeyhole,
  LogOut,
  Menu,
  PlayCircle,
  ReceiptText,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Brand } from "@/components/Brand";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  LanguageToggle,
  PaymentInstructions,
  useLanguage,
} from "@/components/Language";

function StatusPill({ status }: { status: string }) {
  const config: Record<
    string,
    { label: string; className: string; icon: typeof Check }
  > = {
    approved: {
      label: "Approved",
      className: "status-approved",
      icon: CheckCircle2,
    },
    pending: {
      label: "Pending review",
      className: "status-pending",
      icon: Clock3,
    },
    rejected: {
      label: "Needs attention",
      className: "status-rejected",
      icon: CircleAlert,
    },
    revoked: { label: "Access paused", className: "status-rejected", icon: X },
  };
  const item = config[status] ?? {
    label: status,
    className: "status-pending",
    icon: Clock3,
  };
  const Icon = item.icon;
  return (
    <span className={`status-pill ${item.className}`}>
      <Icon className="h-3.5 w-3.5" /> {item.label}
    </span>
  );
}

function FileToBase64({
  onFile,
}: {
  onFile: (file?: { name: string; type: string; data: string }) => void;
}) {
  const [label, setLabel] = useState("Choose receipt");
  const [error, setError] = useState("");
  const readFile = (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      onFile(undefined);
      setLabel("Choose receipt");
      setError("Please choose a file smaller than 5 MB.");
      return;
    }
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    const isImage =
      ["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!isPdf && !isImage) {
      onFile(undefined);
      setLabel("Choose receipt");
      setError("Choose a JPG, PNG, WebP, or PDF receipt.");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result ?? "");
      onFile({
        name: file.name,
        type:
          file.type ||
          (isPdf
            ? "application/pdf"
            : /\.png$/i.test(file.name)
              ? "image/png"
              : /\.webp$/i.test(file.name)
                ? "image/webp"
                : "image/jpeg"),
        data: raw.split(",")[1] ?? raw,
      });
      setLabel(file.name);
    };
    reader.onerror = () => {
      onFile(undefined);
      setLabel("Choose receipt");
      setError("This file could not be read. Please try another one.");
    };
    reader.readAsDataURL(file);
  };
  return (
    <div>
      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-white/20 bg-white/[0.025] px-4 py-3 text-sm text-white/60 transition hover:border-primary/60 hover:text-white">
        <FileImage className="h-4 w-4 text-primary" />
        <span className="flex-1 truncate">{label}</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">
          JPG / PNG / PDF · 5 MB max
        </span>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          className="hidden"
          onChange={event => {
            readFile(event.target.files?.[0]);
            event.currentTarget.value = "";
          }}
          aria-label="Upload payment receipt"
        />
      </label>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

export default function Dashboard() {
  const auth = useAuth({ redirectOnUnauthenticated: true });
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: async () => {
      await auth.refresh();
    },
  });
  const overview = trpc.lms.dashboard.useQuery(undefined, {
    enabled: auth.isAuthenticated,
    retry: false,
  });
  const submitReceipt = trpc.lms.submitReceipt.useMutation({
    onSuccess: async () => {
      await utils.lms.dashboard.invalidate();
      setForm({ courseId: "", amount: "", reference: "", file: undefined });
    },
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    school: "",
    grade: "",
    district: "",
  });
  const [form, setForm] = useState<{
    courseId: string;
    amount: string;
    reference: string;
    file?: { name: string; type: string; data: string };
  }>({ courseId: "", amount: "", reference: "" });
  useEffect(() => {
    if (!auth.user) return;
    setProfile({
      name: auth.user.name ?? "",
      phone: auth.user.phone ?? "",
      school: auth.user.school ?? "",
      grade: auth.user.grade ?? "",
      district: auth.user.district ?? "",
    });
  }, [auth.user]);
  const data = overview.data;
  const displayName = auth.user?.name?.split(" ")[0] || "Student";
  const enrollmentByCourse = useMemo(
    () => new Map((data?.enrollments ?? []).map(item => [item.courseId, item])),
    [data?.enrollments]
  );
  const latestReceipt = data?.receipts?.[0];

  if (auth.loading || !auth.user)
    return (
      <div className="min-h-screen bg-[#101010] p-8 text-white/50">
        Opening your classroom…
      </div>
    );

  if (overview.isLoading)
    return (
      <div
        className="min-h-screen bg-[#101010] p-8 text-white/50"
        role="status"
      >
        Loading your classroom details…
      </div>
    );

  if (overview.isError)
    return (
      <div className="min-h-screen bg-[#101010] p-8 text-white">
        <div className="mx-auto mt-16 max-w-lg rounded-xl border border-white/10 bg-white/[0.035] p-6">
          <h1 className="font-display text-2xl font-bold uppercase">
            We couldn’t load your classroom
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/55">
            Check your connection and try again. Your account and saved details
            are unchanged.
          </p>
          <Button
            onClick={() => void overview.refetch()}
            className="mt-5 bg-primary font-bold text-black hover:bg-[#ff5a5a]"
          >
            Try again
          </Button>
        </div>
      </div>
    );

  const selectedCourse = data?.courses.find(
    course => String(course.id) === form.courseId
  );
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.courseId || !form.file) return;
    submitReceipt.mutate({
      courseId: Number(form.courseId),
      amount: form.amount ? Number(form.amount) : undefined,
      reference: form.reference || undefined,
      fileName: form.file.name,
      fileType: form.file.type,
      fileData: form.file.data,
    });
  };
  const saveProfile = (event: FormEvent) => {
    event.preventDefault();
    updateProfile.mutate(profile);
  };

  return (
    <div className="portal-shell min-h-screen bg-[#101010] text-white">
      <aside className={`portal-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="flex items-center justify-between">
          <Brand compact />
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-white/50" />
          </button>
        </div>
        <div className="mt-12">
          <div className="eyebrow">
            <span className="eyebrow-line" /> {t.studentDesk}
          </div>
          <h2 className="mt-4 font-display text-3xl font-black uppercase tracking-[-0.04em]">
            Keep moving,
            <br />
            <span className="text-white/35">{displayName}.</span>
          </h2>
        </div>
        <nav className="mt-12 space-y-2 text-sm">
          <a
            className="portal-nav-active"
            href="#overview"
            onClick={() => setMobileOpen(false)}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />{" "}
            {t.overview}
          </a>
          <a href="#lessons" onClick={() => setMobileOpen(false)}>
            <PlayCircle className="h-4 w-4" /> {t.myLessons}
          </a>
          <a href="#payment" onClick={() => setMobileOpen(false)}>
            <ReceiptText className="h-4 w-4" /> {t.paymentProof}
          </a>
          <a href="#announcements" onClick={() => setMobileOpen(false)}>
            <ArrowUpRight className="h-4 w-4" /> {t.announcements}
          </a>
          {auth.user.role === "admin" && (
            <a href="/admin">
              <ShieldCheck className="h-4 w-4" /> Admin portal
            </a>
          )}
        </nav>
        <div className="mt-auto border-t border-white/10 pt-5">
          <button
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-white/40 transition hover:text-white"
            onClick={() => auth.logout()}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>
      <div className="portal-main">
        <header className="portal-header">
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-white/60" />
          </button>
          <div className="eyebrow hidden md:flex">
            <span className="eyebrow-line" /> YOUR LEARNING SPACE
          </div>
          <div className="ml-auto flex items-center gap-4">
            <LanguageToggle />
            <span className="hidden text-xs text-white/35 sm:block">
              {auth.user.email}
            </span>
            <div className="avatar-mark">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>
        <main
          id="overview"
          className="mx-auto max-w-6xl px-5 py-8 lg:px-10 lg:py-12"
        >
          {!auth.user.profileCompleted && (
            <Card className="mb-10 border-primary/30 bg-primary/[0.07] text-white shadow-none">
              <CardHeader className="px-6 pb-3 pt-6">
                <div className="eyebrow text-primary">
                  <span className="eyebrow-line bg-primary" /> {t.required}
                </div>
                <CardTitle className="mt-3 text-2xl font-bold uppercase">
                  {t.completeProfile}
                </CardTitle>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
                  {t.profileBody}
                </p>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <form
                  onSubmit={saveProfile}
                  className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {[
                    {
                      key: "name",
                      label: t.fullName,
                      type: "text",
                      minLength: 2,
                      maxLength: 120,
                    },
                    {
                      key: "phone",
                      label: t.phone,
                      type: "tel",
                      minLength: 7,
                      maxLength: 30,
                    },
                    {
                      key: "school",
                      label: t.school,
                      type: "text",
                      minLength: 2,
                      maxLength: 180,
                    },
                    {
                      key: "grade",
                      label: t.grade,
                      type: "text",
                      minLength: 1,
                      maxLength: 40,
                    },
                    {
                      key: "district",
                      label: t.district,
                      type: "text",
                      minLength: 2,
                      maxLength: 80,
                    },
                  ].map(field => (
                    <label key={field.key} className="field-label">
                      {field.label}
                      <Input
                        required
                        type={field.type}
                        minLength={field.minLength}
                        maxLength={field.maxLength}
                        value={profile[field.key as keyof typeof profile]}
                        onChange={event =>
                          setProfile({
                            ...profile,
                            [field.key]: event.target.value,
                          })
                        }
                        className="field-control"
                      />
                    </label>
                  ))}
                  <div className="flex items-end">
                    <Button
                      disabled={updateProfile.isPending}
                      className="h-10 w-full bg-primary font-bold uppercase tracking-[.1em] text-black hover:bg-[#ff5a5a]"
                    >
                      {updateProfile.isPending ? "Saving…" : t.saveProfile}
                    </Button>
                  </div>
                  {updateProfile.error && (
                    <p role="alert" className="text-sm text-red-300">
                      Could not save your details. Check your connection and try
                      again.
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          )}
          <PaymentInstructions />
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" /> DASHBOARD / 01
              </div>
              <h1 className="mt-3 font-display text-4xl font-black uppercase tracking-[-0.05em] sm:text-6xl">
                Your classroom.
              </h1>
            </div>
            <a
              href="/"
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-white/40 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Back to site
            </a>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="metric-card">
              <CardContent className="p-5">
                <div className="metric-label">Access status</div>
                <div className="mt-4 flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${latestReceipt?.status === "approved" ? "bg-emerald-400" : latestReceipt?.status === "rejected" ? "bg-red-400" : "bg-primary"}`}
                  />
                  <span className="font-display text-2xl font-bold uppercase">
                    {latestReceipt?.status === "approved"
                      ? "Active"
                      : latestReceipt?.status === "pending"
                        ? "Under review"
                        : latestReceipt?.status === "rejected"
                          ? "Action needed"
                          : "Not submitted"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-white/35">
                  {latestReceipt?.status === "approved"
                    ? "Your course access is active"
                    : latestReceipt?.status === "pending"
                      ? "Your latest payment proof is being checked"
                      : latestReceipt?.status === "rejected"
                        ? "Review the note below and submit a new receipt"
                        : "Upload a receipt to request course access"}
                </p>
              </CardContent>
            </Card>
            <Card className="metric-card">
              <CardContent className="p-5">
                <div className="metric-label">Available lessons</div>
                <div className="mt-4 font-display text-3xl font-bold">
                  {data?.lessons.length ?? 0}
                  <span className="ml-2 text-base font-normal text-white/30">
                    recordings
                  </span>
                </div>
                <p className="mt-2 text-xs text-white/35">
                  New material appears here
                </p>
              </CardContent>
            </Card>
            <Card className="metric-card">
              <CardContent className="p-5">
                <div className="metric-label">Announcements</div>
                <div className="mt-4 font-display text-3xl font-bold">
                  {data?.announcements.length ?? 0}
                  <span className="ml-2 text-base font-normal text-white/30">
                    updates
                  </span>
                </div>
                <p className="mt-2 text-xs text-white/35">
                  Stay close to the class
                </p>
              </CardContent>
            </Card>
          </div>

          <section id="lessons" className="mt-12">
            <div className="section-heading">
              <div>
                <div className="eyebrow">
                  <span className="eyebrow-line" /> LESSONS
                </div>
                <h2 className="mt-3 font-display text-3xl font-black uppercase tracking-[-0.04em]">
                  Your learning path
                </h2>
              </div>
              <Badge className="border-white/10 bg-white/5 text-white/55">
                Commerce — Business + Accounting
              </Badge>
            </div>
            <div className="mt-5 grid gap-3">
              {(data?.courses ?? []).map(course => {
                const enrollment = enrollmentByCourse.get(course.id);
                const unlocked = enrollment?.accessStatus === "approved";
                const courseLessons = (data?.lessons ?? []).filter(
                  lesson => lesson.courseId === course.id
                );
                return (
                  <Card
                    key={course.id}
                    className="border-white/10 bg-white/[0.035] text-white shadow-none"
                  >
                    <CardHeader className="border-b border-white/8 px-5 py-5">
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                          <Badge className="border-primary/20 bg-primary/10 text-primary">
                            {course.category}
                          </Badge>
                          <CardTitle className="mt-3 text-xl font-bold uppercase">
                            {course.title}
                          </CardTitle>
                        </div>
                        {enrollment ? (
                          <StatusPill status={enrollment.accessStatus} />
                        ) : (
                          <span className="status-pill status-pending">
                            <LockKeyhole className="h-3.5 w-3.5" /> Access not
                            requested
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 p-5">
                      {courseLessons.map((lesson, index) => (
                        <div key={lesson.id} className="lesson-row">
                          <div
                            className={`lesson-index ${unlocked ? "is-live" : ""}`}
                          >
                            {String(index + 1).padStart(2, "0")}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-white/85">
                              {lesson.title}
                            </div>
                            <div className="mt-1 text-xs text-white/35">
                              {lesson.duration || "Self-paced"}
                            </div>
                          </div>
                          {unlocked && lesson.recordingKey ? (
                            <a
                              href={`/manus-storage/${lesson.recordingKey}`}
                              target="_blank"
                              rel="noreferrer"
                              className="lesson-action"
                            >
                              <PlayCircle className="h-4 w-4" /> Watch
                            </a>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/25">
                              <LockKeyhole className="h-3.5 w-3.5" /> Locked
                            </span>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
              {!data?.courses.length && (
                <div className="rounded-xl border border-dashed border-white/10 p-6 text-sm leading-6 text-white/45">
                  There are no published courses yet. Check back soon, or
                  contact your teacher if you expected to see one.
                </div>
              )}
            </div>
          </section>

          <section
            id="payment"
            className="mt-12 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]"
          >
            <Card className="border-primary/25 bg-primary/[0.07] text-white shadow-none">
              <CardHeader className="px-6 pb-3 pt-6">
                <div className="eyebrow text-primary">
                  <span className="eyebrow-line bg-primary" /> PAYMENT PROOF
                </div>
                <CardTitle className="mt-3 text-2xl font-bold uppercase">
                  Request your access
                </CardTitle>
                <p className="mt-2 text-sm leading-6 text-white/45">
                  Make your class payment using the instructions from the
                  teacher, then upload the receipt here. Admin review will
                  unlock the recordings.
                </p>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <form onSubmit={submit} className="space-y-4">
                  <label className="field-label">
                    Course
                    <select
                      value={form.courseId}
                      onChange={event =>
                        setForm({ ...form, courseId: event.target.value })
                      }
                      className="field-control"
                    >
                      <option value="">Choose a course</option>
                      {(data?.courses ?? []).map(course => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="field-label">
                      Amount{" "}
                      <Input
                        value={form.amount}
                        onChange={event =>
                          setForm({ ...form, amount: event.target.value })
                        }
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Optional"
                        className="field-control"
                      />
                    </label>
                    <label className="field-label">
                      Payment reference{" "}
                      <Input
                        value={form.reference}
                        onChange={event =>
                          setForm({ ...form, reference: event.target.value })
                        }
                        maxLength={160}
                        placeholder="Optional"
                        className="field-control"
                      />
                    </label>
                  </div>
                  <FileToBase64 onFile={file => setForm({ ...form, file })} />
                  <Button
                    disabled={
                      submitReceipt.isPending || !form.courseId || !form.file
                    }
                    className="h-11 w-full bg-primary font-bold uppercase tracking-[0.1em] text-black hover:bg-[#ff5a5a]"
                  >
                    {submitReceipt.isPending ? (
                      "Uploading…"
                    ) : (
                      <>
                        <FileUp className="h-4 w-4" /> Submit for review
                      </>
                    )}
                  </Button>
                  {submitReceipt.isSuccess && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <Check className="h-4 w-4" /> Receipt submitted. We’ll
                      update your status after review.
                    </div>
                  )}
                  {submitReceipt.error && (
                    <div role="alert" className="text-sm text-red-300">
                      Could not submit this receipt. Check the file and payment
                      details, then try again.
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/[0.035] text-white shadow-none">
              <CardHeader className="px-6 pb-3 pt-6">
                <div className="eyebrow">
                  <span className="eyebrow-line" /> STATUS
                </div>
                <CardTitle className="mt-3 text-2xl font-bold uppercase">
                  Your submissions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-6 pb-6">
                {(data?.receipts ?? []).length ? (
                  data?.receipts.map(receipt => (
                    <div
                      key={receipt.id}
                      className="rounded-lg border border-white/8 bg-black/20 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <ReceiptText className="h-4 w-4 text-primary" />{" "}
                          {receipt.fileName}
                        </div>
                        <StatusPill status={receipt.status} />
                      </div>
                      {receipt.rejectionNote && (
                        <p className="mt-3 text-xs leading-5 text-red-200/70">
                          Note: {receipt.rejectionNote}
                        </p>
                      )}
                      <p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-white/25">
                        Submitted{" "}
                        {receipt.submittedAt
                          ? new Date(receipt.submittedAt).toLocaleDateString()
                          : "recently"}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-white/10 p-6 text-sm leading-6 text-white/40">
                    No payment proof yet. Once you submit a receipt, its review
                    status will appear here.
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section id="announcements" className="mt-12 pb-12">
            <div className="section-heading">
              <div>
                <div className="eyebrow">
                  <span className="eyebrow-line" /> FROM THE DESK
                </div>
                <h2 className="mt-3 font-display text-3xl font-black uppercase tracking-[-0.04em]">
                  Announcements
                </h2>
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {(data?.announcements ?? []).map(announcement => (
                <Card
                  key={announcement.id}
                  className="border-white/10 bg-white/[0.035] text-white shadow-none"
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className="border-primary/25 text-primary"
                      >
                        {announcement.type}
                      </Badge>
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25">
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="mt-5 text-lg font-bold uppercase">
                      {announcement.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/45">
                      {announcement.body}
                    </p>
                  </CardContent>
                </Card>
              ))}
              {!data?.announcements?.length && (
                <div className="text-sm text-white/35">
                  No announcements yet.
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
