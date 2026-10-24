import { useState, type FormEvent } from "react";
import {
  Check,
  ChevronRight,
  FileUp,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  PlayCircle,
  Plus,
  ReceiptText,
  Search,
  ShieldCheck,
  Upload,
  Users,
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
import { LanguageToggle, useLanguage } from "@/components/Language";
import { startLogin } from "@/const";

function readAsBase64(
  file: File,
  onFile: (value: { name: string; type: string; data: string }) => void
) {
  if (file.size > 50 * 1024 * 1024) return;
  const reader = new FileReader();
  reader.onload = () => {
    const raw = String(reader.result ?? "");
    onFile({
      name: file.name,
      type: file.type || "application/octet-stream",
      data: raw.split(",")[1] ?? raw,
    });
  };
  reader.readAsDataURL(file);
}

function AdminStatus({ status }: { status: string }) {
  return (
    <span
      className={`status-pill ${status === "approved" ? "status-approved" : status === "rejected" ? "status-rejected" : "status-pending"}`}
    >
      {status}
    </span>
  );
}

export default function Admin() {
  const auth = useAuth();
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const overview = trpc.admin.overview.useQuery(
    { search: search || undefined },
    { enabled: auth.user?.role === "admin", retry: false }
  );
  const [courseForm, setCourseForm] = useState({
    title: "",
    slug: "",
    description: "",
  });
  const [lessonForm, setLessonForm] = useState({
    courseId: "",
    title: "",
    description: "",
    duration: "",
    sortOrder: "1",
  });
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    body: "",
  });
  const [uploadingLesson, setUploadingLesson] = useState<number | null>(null);
  const [section, setSection] = useState("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const createCourse = trpc.admin.createCourse.useMutation({
    onSuccess: () => {
      setCourseForm({ title: "", slug: "", description: "" });
      void utils.admin.overview.invalidate();
    },
  });
  const createLesson = trpc.admin.createLesson.useMutation({
    onSuccess: () => {
      setLessonForm({
        courseId: "",
        title: "",
        description: "",
        duration: "",
        sortOrder: "1",
      });
      void utils.admin.overview.invalidate();
    },
  });
  const setCourseStatus = trpc.admin.setCourseStatus.useMutation({
    onSuccess: () => void utils.admin.overview.invalidate(),
  });
  const setLessonStatus = trpc.admin.setLessonStatus.useMutation({
    onSuccess: () => void utils.admin.overview.invalidate(),
  });
  const createAnnouncement = trpc.admin.createAnnouncement.useMutation({
    onSuccess: () => {
      setAnnouncementForm({ title: "", body: "" });
      void utils.admin.overview.invalidate();
    },
  });
  const reviewReceipt = trpc.admin.reviewReceipt.useMutation({
    onSuccess: () => void utils.admin.overview.invalidate(),
  });
  const uploadLessonFile = trpc.admin.uploadLessonFile.useMutation({
    onSuccess: () => {
      setUploadingLesson(null);
      void utils.admin.overview.invalidate();
    },
  });
  const data = overview.data;

  if (auth.loading)
    return (
      <div className="min-h-screen bg-[#101010] p-8 text-white/50">
        Opening the admin portal…
      </div>
    );
  if (!auth.user)
    return (
      <div className="min-h-screen bg-[#101010] p-6 text-white sm:p-10">
        <div className="mx-auto max-w-lg pt-16">
          <div className="flex items-center justify-between">
            <Brand compact />
            <LanguageToggle />
          </div>
          <Card className="mt-12 border-primary/25 bg-white/[0.035] text-white shadow-none">
            <CardHeader>
              <div className="eyebrow text-primary">
                <span className="eyebrow-line bg-primary" /> ADMIN / SECURE
                ACCESS
              </div>
              <CardTitle className="mt-4 text-3xl font-bold uppercase">
                {t.adminLoginTitle}
              </CardTitle>
              <p className="mt-3 text-sm leading-6 text-white/45">
                {t.adminLoginBody}
              </p>
            </CardHeader>
            <CardContent>
              <Button
                onClick={startLogin}
                className="w-full bg-primary font-bold uppercase tracking-[.1em] text-black hover:bg-[#ff5a5a]"
              >
                {t.signInAdmin}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  if (auth.user.role !== "admin")
    return (
      <div className="min-h-screen bg-[#101010] p-8 text-white">
        <a href="/" className="text-primary">
          Return home
        </a>
        <h1 className="mt-8 font-display text-4xl font-black uppercase">
          {t.accessDenied}
        </h1>
      </div>
    );

  const courseName = (courseId: number) =>
    data?.courses.find(course => course.id === courseId)?.title ??
    `Course #${courseId}`;
  const studentName = (userId: number) =>
    data?.students.find(student => student.id === userId)?.name ||
    data?.students.find(student => student.id === userId)?.email ||
    `Student #${userId}`;
  const submitCourse = (event: FormEvent) => {
    event.preventDefault();
    if (!courseForm.title || !courseForm.description) return;
    const slug =
      courseForm.slug ||
      courseForm.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    createCourse.mutate({ ...courseForm, slug });
  };
  const submitLesson = (event: FormEvent) => {
    event.preventDefault();
    if (!lessonForm.courseId || !lessonForm.title) return;
    createLesson.mutate({
      courseId: Number(lessonForm.courseId),
      title: lessonForm.title,
      description: lessonForm.description || undefined,
      duration: lessonForm.duration || undefined,
      sortOrder: Number(lessonForm.sortOrder) || 1,
      status: "draft",
    });
  };
  const submitAnnouncement = (event: FormEvent) => {
    event.preventDefault();
    if (!announcementForm.title || !announcementForm.body) return;
    createAnnouncement.mutate({ ...announcementForm, type: "general" });
  };

  return (
    <div className="portal-shell min-h-screen bg-[#101010] text-white">
      <aside className={`portal-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="flex items-center justify-between">
          <Brand compact />
          <div className="flex items-center gap-3">
            <Badge className="border-primary/30 bg-primary/10 text-primary">
              Admin
            </Badge>
            <button
              className="md:hidden"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5 text-white/50" />
            </button>
          </div>
        </div>
        <div className="mt-12">
          <div className="eyebrow">
            <span className="eyebrow-line" /> {t.controlRoom}
          </div>
          <h2 className="mt-4 font-display text-3xl font-black uppercase tracking-[-0.04em]">
            Run the
            <br />
            <span className="text-white/35">classroom.</span>
          </h2>
        </div>
        <nav className="mt-12 space-y-2 text-sm">
          <button
            className={
              section === "overview" ? "portal-nav-active w-full" : "w-full"
            }
            onClick={() => {
              setSection("overview");
              setMobileOpen(false);
            }}
          >
            <LayoutDashboard className="h-4 w-4" /> {t.adminOverview}
          </button>
          <button
            className={
              section === "receipts" ? "portal-nav-active w-full" : "w-full"
            }
            onClick={() => {
              setSection("receipts");
              setMobileOpen(false);
            }}
          >
            <ReceiptText className="h-4 w-4" /> {t.paymentReviews}{" "}
            <span className="ml-auto rounded bg-primary px-1.5 py-0.5 text-[10px] font-black text-black">
              {data?.receipts.filter(receipt => receipt.status === "pending")
                .length ?? 0}
            </span>
          </button>
          <button
            className={
              section === "courses" ? "portal-nav-active w-full" : "w-full"
            }
            onClick={() => {
              setSection("courses");
              setMobileOpen(false);
            }}
          >
            <PlayCircle className="h-4 w-4" /> {t.coursesLessons}
          </button>
          <button
            className={
              section === "announcements"
                ? "portal-nav-active w-full"
                : "w-full"
            }
            onClick={() => {
              setSection("announcements");
              setMobileOpen(false);
            }}
          >
            <Megaphone className="h-4 w-4" /> {t.adminAnnouncements}
          </button>
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
            className="mr-4 md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-white/60" />
          </button>
          <div className="eyebrow">
            <span className="eyebrow-line" /> ADMIN / RAVISHKA KALINGA
          </div>
          <div className="ml-auto flex items-center gap-4">
            <LanguageToggle />
            <a
              href="/dashboard"
              className="text-xs font-bold uppercase tracking-[0.12em] text-white/40 hover:text-white"
            >
              Student view
            </a>
            <div className="avatar-mark">RK</div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-8 lg:px-10 lg:py-12">
          <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" /> ADMIN DASHBOARD / 01
              </div>
              <h1 className="mt-3 font-display text-4xl font-black uppercase tracking-[-0.05em] sm:text-6xl">
                The control room.
              </h1>
            </div>
            <a
              href="/"
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-white/40 hover:text-white"
            >
              Public site <ChevronRight className="h-4 w-4" />
            </a>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="metric-card">
              <CardContent className="p-5">
                <div className="metric-label">Students</div>
                <div className="mt-4 font-display text-3xl font-bold">
                  {data?.students.length ?? 0}
                </div>
                <p className="mt-2 text-xs text-white/35">
                  Registered accounts
                </p>
              </CardContent>
            </Card>
            <Card className="metric-card">
              <CardContent className="p-5">
                <div className="metric-label">Courses</div>
                <div className="mt-4 font-display text-3xl font-bold">
                  {data?.courses.length ?? 0}
                </div>
                <p className="mt-2 text-xs text-white/35">Drafts + published</p>
              </CardContent>
            </Card>
            <Card className="metric-card">
              <CardContent className="p-5">
                <div className="metric-label">Needs review</div>
                <div className="mt-4 font-display text-3xl font-bold text-primary">
                  {data?.receipts.filter(
                    receipt => receipt.status === "pending"
                  ).length ?? 0}
                </div>
                <p className="mt-2 text-xs text-white/35">
                  Payment submissions
                </p>
              </CardContent>
            </Card>
          </div>

          {section === "overview" && (
            <section className="mt-12 space-y-8">
              <Card className="border-white/10 bg-white/[0.035] text-white shadow-none">
                <CardHeader className="flex flex-row items-center justify-between border-b border-white/8 px-6 py-5">
                  <div>
                    <div className="eyebrow">
                      <span className="eyebrow-line" /> STUDENT DIRECTORY
                    </div>
                    <CardTitle className="mt-3 text-2xl font-bold uppercase">
                      Latest students
                    </CardTitle>
                  </div>
                  <label className="relative hidden sm:block">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/25" />
                    <Input
                      value={search}
                      onChange={event => setSearch(event.target.value)}
                      placeholder="Search name or email"
                      className="w-56 border-white/10 bg-black/20 pl-9 text-white"
                    />
                  </label>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-white/8">
                    {(data?.students ?? []).slice(0, 8).map(student => (
                      <div
                        key={student.id}
                        className="flex items-center gap-4 px-6 py-4"
                      >
                        <div className="avatar-mark small">
                          {(student.name || student.email || "S")
                            .slice(0, 1)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">
                            {student.name || "New student"}
                          </div>
                          <div className="truncate text-xs text-white/35">
                            {student.email || "No email"}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25">
                          {student.role}
                        </span>
                      </div>
                    ))}
                    {!data?.students.length && (
                      <div className="p-8 text-sm text-white/35">
                        No student accounts yet.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <div className="grid gap-5 lg:grid-cols-2">
                <Card className="border-primary/20 bg-primary/[0.06] text-white shadow-none">
                  <CardHeader className="px-6 pb-3 pt-6">
                    <div className="eyebrow text-primary">
                      <span className="eyebrow-line bg-primary" /> QUICK CREATE
                    </div>
                    <CardTitle className="mt-3 text-2xl font-bold uppercase">
                      New announcement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <form onSubmit={submitAnnouncement} className="space-y-3">
                      <Input
                        value={announcementForm.title}
                        onChange={event =>
                          setAnnouncementForm({
                            ...announcementForm,
                            title: event.target.value,
                          })
                        }
                        placeholder="Announcement title"
                        className="field-control"
                      />
                      <Textarea
                        value={announcementForm.body}
                        onChange={event =>
                          setAnnouncementForm({
                            ...announcementForm,
                            body: event.target.value,
                          })
                        }
                        placeholder="What should students know?"
                        className="field-control"
                      />
                      <Button
                        disabled={createAnnouncement.isPending}
                        className="bg-primary font-bold uppercase tracking-[0.1em] text-black hover:bg-[#ff5a5a]"
                      >
                        <Megaphone className="h-4 w-4" /> Publish update
                      </Button>
                    </form>
                  </CardContent>
                </Card>
                <Card className="border-white/10 bg-white/[0.035] text-white shadow-none">
                  <CardHeader className="px-6 pb-3 pt-6">
                    <div className="eyebrow">
                      <span className="eyebrow-line" /> LATEST ACTIVITY
                    </div>
                    <CardTitle className="mt-3 text-2xl font-bold uppercase">
                      Payment queue
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 px-6 pb-6">
                    {(data?.receipts ?? []).slice(0, 4).map(receipt => (
                      <div
                        key={receipt.id}
                        className="flex items-center gap-3 border-b border-white/8 pb-3 last:border-0"
                      >
                        <ReceiptText className="h-4 w-4 text-primary" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">
                            {studentName(receipt.userId)}
                          </div>
                          <div className="truncate text-xs text-white/35">
                            {courseName(receipt.courseId)}
                          </div>
                        </div>
                        <AdminStatus status={receipt.status} />
                      </div>
                    ))}
                    {!data?.receipts.length && (
                      <p className="text-sm text-white/35">
                        The queue is clear.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </section>
          )}

          {section === "receipts" && (
            <section className="mt-12">
              <div className="section-heading">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-line" /> PAYMENT REVIEWS
                  </div>
                  <h2 className="mt-3 font-display text-3xl font-black uppercase">
                    Review and decide.
                  </h2>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {(data?.receipts ?? []).map(receipt => (
                  <Card
                    key={receipt.id}
                    className="border-white/10 bg-white/[0.035] text-white shadow-none"
                  >
                    <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
                      <div className="flex min-w-0 flex-1 items-start gap-4">
                        <div className="rounded-lg bg-primary/10 p-3 text-primary">
                          <ReceiptText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold">
                            {studentName(receipt.userId)}
                          </div>
                          <div className="mt-1 text-xs text-white/40">
                            {courseName(receipt.courseId)}{" "}
                            {receipt.reference ? `· ${receipt.reference}` : ""}
                          </div>
                          <a
                            href={`/manus-storage/${receipt.fileKey}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.1em] text-primary hover:underline"
                          >
                            <FileUp className="h-3.5 w-3.5" /> Open{" "}
                            {receipt.fileName}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <AdminStatus status={receipt.status} />
                        {receipt.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() =>
                                reviewReceipt.mutate({
                                  receiptId: receipt.id,
                                  status: "approved",
                                })
                              }
                              className="bg-emerald-400 font-bold text-black hover:bg-emerald-300"
                            >
                              <Check className="h-4 w-4" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                reviewReceipt.mutate({
                                  receiptId: receipt.id,
                                  status: "rejected",
                                  rejectionNote:
                                    "Please upload a clearer payment receipt.",
                                })
                              }
                              className="border-red-400/25 text-red-200 hover:bg-red-500/10"
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {!data?.receipts.length && (
                  <div className="rounded-xl border border-dashed border-white/10 p-10 text-sm text-white/35">
                    No receipts submitted yet.
                  </div>
                )}
              </div>
            </section>
          )}

          {section === "courses" && (
            <section className="mt-12 space-y-8">
              <div className="grid gap-5 lg:grid-cols-2">
                <Card className="border-primary/20 bg-primary/[0.06] text-white shadow-none">
                  <CardHeader className="px-6 pb-3 pt-6">
                    <div className="eyebrow text-primary">
                      <span className="eyebrow-line bg-primary" /> COURSE
                      BUILDER
                    </div>
                    <CardTitle className="mt-3 text-2xl font-bold uppercase">
                      Add a course
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <form onSubmit={submitCourse} className="space-y-3">
                      <Input
                        value={courseForm.title}
                        onChange={event =>
                          setCourseForm({
                            ...courseForm,
                            title: event.target.value,
                          })
                        }
                        placeholder="Course title"
                        className="field-control"
                      />
                      <Input
                        value={courseForm.slug}
                        onChange={event =>
                          setCourseForm({
                            ...courseForm,
                            slug: event.target.value,
                          })
                        }
                        placeholder="URL slug (optional)"
                        className="field-control"
                      />
                      <Textarea
                        value={courseForm.description}
                        onChange={event =>
                          setCourseForm({
                            ...courseForm,
                            description: event.target.value,
                          })
                        }
                        placeholder="Short course description"
                        className="field-control"
                      />
                      <Button
                        disabled={createCourse.isPending}
                        className="bg-primary font-bold uppercase tracking-[0.1em] text-black hover:bg-[#ff5a5a]"
                      >
                        <Plus className="h-4 w-4" /> Create draft course
                      </Button>
                    </form>
                  </CardContent>
                </Card>
                <Card className="border-white/10 bg-white/[0.035] text-white shadow-none">
                  <CardHeader className="px-6 pb-3 pt-6">
                    <div className="eyebrow">
                      <span className="eyebrow-line" /> LESSON BUILDER
                    </div>
                    <CardTitle className="mt-3 text-2xl font-bold uppercase">
                      Add a lesson
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <form onSubmit={submitLesson} className="space-y-3">
                      <select
                        value={lessonForm.courseId}
                        onChange={event =>
                          setLessonForm({
                            ...lessonForm,
                            courseId: event.target.value,
                          })
                        }
                        className="field-control"
                      >
                        <option value="">Choose course</option>
                        {(data?.courses ?? []).map(course => (
                          <option key={course.id} value={course.id}>
                            {course.title}
                          </option>
                        ))}
                      </select>
                      <Input
                        value={lessonForm.title}
                        onChange={event =>
                          setLessonForm({
                            ...lessonForm,
                            title: event.target.value,
                          })
                        }
                        placeholder="Lesson title"
                        className="field-control"
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          value={lessonForm.duration}
                          onChange={event =>
                            setLessonForm({
                              ...lessonForm,
                              duration: event.target.value,
                            })
                          }
                          placeholder="Duration e.g. 42 min"
                          className="field-control"
                        />
                        <Input
                          value={lessonForm.sortOrder}
                          onChange={event =>
                            setLessonForm({
                              ...lessonForm,
                              sortOrder: event.target.value,
                            })
                          }
                          type="number"
                          placeholder="Order"
                          className="field-control"
                        />
                      </div>
                      <Textarea
                        value={lessonForm.description}
                        onChange={event =>
                          setLessonForm({
                            ...lessonForm,
                            description: event.target.value,
                          })
                        }
                        placeholder="Lesson description"
                        className="field-control"
                      />
                      <Button
                        disabled={createLesson.isPending}
                        variant="outline"
                        className="border-white/15 text-white hover:bg-white/10"
                      >
                        <Plus className="h-4 w-4" /> Create lesson draft
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
              <Card className="border-white/10 bg-white/[0.035] text-white shadow-none">
                <CardHeader className="px-6 pb-3 pt-6">
                  <div className="eyebrow">
                    <span className="eyebrow-line" /> COURSE LIBRARY
                  </div>
                  <CardTitle className="mt-3 text-2xl font-bold uppercase">
                    Publish when ready
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 px-6 pb-6">
                  {(data?.courses ?? []).map(course => (
                    <div
                      key={course.id}
                      className="flex flex-col gap-3 border-b border-white/8 pb-3 last:border-0 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">
                          {course.title}
                        </div>
                        <div className="text-xs text-white/35">
                          {course.status === "published"
                            ? "Visible to students"
                            : "Draft · hidden from students"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <AdminStatus
                          status={
                            course.status === "published"
                              ? "approved"
                              : "pending"
                          }
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setCourseStatus.mutate({
                              courseId: course.id,
                              status:
                                course.status === "published"
                                  ? "draft"
                                  : "published",
                            })
                          }
                          className="border-white/15 text-white/65 hover:bg-white/10"
                        >
                          {course.status === "published"
                            ? "Unpublish"
                            : "Publish"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="border-white/10 bg-white/[0.035] text-white shadow-none">
                <CardHeader className="px-6 pb-3 pt-6">
                  <div className="eyebrow">
                    <span className="eyebrow-line" /> CONTENT LIBRARY
                  </div>
                  <CardTitle className="mt-3 text-2xl font-bold uppercase">
                    Upload recordings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 px-6 pb-6">
                  {(data?.lessons ?? []).map(lesson => (
                    <div
                      key={lesson.id}
                      className="flex flex-col gap-3 border-b border-white/8 pb-3 last:border-0 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">
                          {lesson.title}
                        </div>
                        <div className="text-xs text-white/35">
                          {courseName(lesson.courseId)} ·{" "}
                          {lesson.recordingKey
                            ? "Recording attached"
                            : "No recording yet"}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setLessonStatus.mutate({
                            lessonId: lesson.id,
                            status:
                              lesson.status === "published"
                                ? "draft"
                                : "published",
                          })
                        }
                        className="border-white/15 text-white/65 hover:bg-white/10"
                      >
                        {lesson.status === "published"
                          ? "Unpublish"
                          : "Publish"}
                      </Button>
                      <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-white/15 px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-white/65 hover:bg-white/10">
                        {uploadingLesson === lesson.id ? (
                          "Uploading…"
                        ) : (
                          <>
                            <Upload className="h-3.5 w-3.5" /> Choose video
                          </>
                        )}
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          disabled={uploadingLesson === lesson.id}
                          onChange={event => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            setUploadingLesson(lesson.id);
                            readAsBase64(file, value =>
                              uploadLessonFile.mutate({
                                lessonId: lesson.id,
                                kind: "recording",
                                fileName: value.name,
                                fileType: value.type,
                                fileData: value.data,
                              })
                            );
                          }}
                        />
                      </label>
                    </div>
                  ))}
                  {!data?.lessons.length && (
                    <p className="text-sm text-white/35">
                      Create a lesson before adding a recording.
                    </p>
                  )}
                </CardContent>
              </Card>
            </section>
          )}

          {section === "announcements" && (
            <section className="mt-12">
              <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                <Card className="border-primary/20 bg-primary/[0.06] text-white shadow-none">
                  <CardHeader className="px-6 pb-3 pt-6">
                    <div className="eyebrow text-primary">
                      <span className="eyebrow-line bg-primary" /> PUBLISH
                    </div>
                    <CardTitle className="mt-3 text-2xl font-bold uppercase">
                      New announcement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <form onSubmit={submitAnnouncement} className="space-y-3">
                      <Input
                        value={announcementForm.title}
                        onChange={event =>
                          setAnnouncementForm({
                            ...announcementForm,
                            title: event.target.value,
                          })
                        }
                        placeholder="Title"
                        className="field-control"
                      />
                      <Textarea
                        value={announcementForm.body}
                        onChange={event =>
                          setAnnouncementForm({
                            ...announcementForm,
                            body: event.target.value,
                          })
                        }
                        placeholder="Message for students"
                        className="field-control min-h-32"
                      />
                      <Button
                        disabled={createAnnouncement.isPending}
                        className="bg-primary font-bold uppercase tracking-[0.1em] text-black hover:bg-[#ff5a5a]"
                      >
                        <Megaphone className="h-4 w-4" /> Publish
                      </Button>
                    </form>
                  </CardContent>
                </Card>
                <div className="space-y-3">
                  {(data?.announcements ?? []).map(announcement => (
                    <Card
                      key={announcement.id}
                      className="border-white/10 bg-white/[0.035] text-white shadow-none"
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <Badge className="border-primary/25 bg-primary/10 text-primary">
                            {announcement.type}
                          </Badge>
                          <span className="text-[10px] uppercase tracking-[0.12em] text-white/25">
                            {new Date(
                              announcement.createdAt
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="mt-4 text-lg font-bold uppercase">
                          {announcement.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-white/45">
                          {announcement.body}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                  {!data?.announcements.length && (
                    <p className="text-sm text-white/35">
                      No announcements yet.
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
