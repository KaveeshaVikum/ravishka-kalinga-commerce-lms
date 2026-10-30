import { and, asc, desc, eq, inArray, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  announcements,
  assignments,
  courses,
  enrollments,
  InsertUser,
  lessons,
  receipts,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && ENV.databaseUrl) {
    try {
      _db = drizzle(ENV.databaseUrl);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = [
    "name",
    "email",
    "phone",
    "school",
    "grade",
    "district",
    "loginMethod",
  ] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (
    user.openId === ENV.ownerOpenId ||
    (ENV.ownerFirebaseUid && user.openId === `firebase:${ENV.ownerFirebaseUid}`)
  ) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db
    .insert(users)
    .values(values)
    .onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result[0];
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return result[0];
}

export async function updateStudentProfile(
  userId: number,
  profile: {
    name: string;
    phone: string;
    school: string;
    grade: string;
    district: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postalCode?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(users)
    .set({ ...profile, profileCompleted: 1, updatedAt: new Date() })
    .where(eq(users.id, userId));
  return getUserById(userId);
}

export async function getPublishedCatalog() {
  const db = await getDb();
  if (!db) return { courses: [], lessons: [] };
  const courseRows = await db
    .select()
    .from(courses)
    .where(eq(courses.status, "published"))
    .orderBy(asc(courses.createdAt));
  const lessonRows = await db
    .select()
    .from(lessons)
    .where(eq(lessons.status, "published"))
    .orderBy(asc(lessons.sortOrder));
  return { courses: courseRows, lessons: lessonRows };
}

export async function getStudentOverview(userId: number) {
  const db = await getDb();
  if (!db)
    return {
      courses: [],
      lessons: [],
      enrollments: [],
      receipts: [],
      announcements: [],
      assignments: [],
    };
  const [
    courseRows,
    lessonRows,
    enrollmentRows,
    receiptRows,
    announcementRows,
  ] = await Promise.all([
    db
      .select()
      .from(courses)
      .where(eq(courses.status, "published"))
      .orderBy(asc(courses.createdAt)),
    db
      .select()
      .from(lessons)
      .where(eq(lessons.status, "published"))
      .orderBy(asc(lessons.sortOrder)),
    db
      .select()
      .from(enrollments)
      .where(eq(enrollments.userId, userId))
      .orderBy(desc(enrollments.updatedAt)),
    db
      .select()
      .from(receipts)
      .where(eq(receipts.userId, userId))
      .orderBy(desc(receipts.submittedAt)),
    db
      .select()
      .from(announcements)
      .where(eq(announcements.isPublished, 1))
      .orderBy(desc(announcements.createdAt)),
  ]);
  const publishedCourseIds = new Set(courseRows.map(course => course.id));
  const eligibleCourseIds = [
    ...new Set(
      enrollmentRows
        .filter(
          enrollment =>
            enrollment.accessStatus === "approved" &&
            publishedCourseIds.has(enrollment.courseId)
        )
        .map(enrollment => enrollment.courseId)
    ),
  ];
  const assignmentRows = eligibleCourseIds.length
    ? await db
        .select()
        .from(assignments)
        .where(
          and(
            eq(assignments.status, "published"),
            inArray(assignments.courseId, eligibleCourseIds)
          )
        )
        .orderBy(asc(assignments.dueAt), desc(assignments.createdAt))
    : [];
  return {
    courses: courseRows,
    lessons: lessonRows,
    enrollments: enrollmentRows,
    receipts: receiptRows,
    announcements: announcementRows,
    assignments: assignmentRows,
  };
}

export async function getAdminOverview(search?: string) {
  const db = await getDb();
  if (!db)
    return {
      courses: [],
      lessons: [],
      students: [],
      receipts: [],
      announcements: [],
      assignments: [],
    };
  const studentFilter = search?.trim()
    ? or(
        like(users.name, `%${search.trim()}%`),
        like(users.email, `%${search.trim()}%`)
      )
    : undefined;
  const [
    courseRows,
    lessonRows,
    studentRows,
    receiptRows,
    announcementRows,
    assignmentRows,
  ] = await Promise.all([
    db.select().from(courses).orderBy(desc(courses.updatedAt)),
    db.select().from(lessons).orderBy(asc(lessons.sortOrder)),
    studentFilter
      ? db
          .select()
          .from(users)
          .where(studentFilter)
          .orderBy(desc(users.createdAt))
      : db.select().from(users).orderBy(desc(users.createdAt)),
    db.select().from(receipts).orderBy(desc(receipts.submittedAt)),
    db.select().from(announcements).orderBy(desc(announcements.createdAt)),
    db.select().from(assignments).orderBy(desc(assignments.createdAt)),
  ]);
  return {
    courses: courseRows,
    lessons: lessonRows,
    students: studentRows,
    receipts: receiptRows,
    announcements: announcementRows,
    assignments: assignmentRows,
  };
}

export async function findEnrollment(userId: number, courseId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(enrollments)
    .where(
      and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId))
    )
    .limit(1);
  return result[0];
}

export async function getCourseById(courseId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);
  return result[0];
}

export async function createDefaultCourseIfEmpty() {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select({ id: courses.id }).from(courses).limit(1);
  if (existing.length > 0) return;
  const [created] = await db.insert(courses).values({
    title: "Commerce — Business and Accounting",
    slug: "commerce-business-accounting",
    description:
      "Build a strong foundation in Business Studies and Accounting with Ravishka Kalinga.",
    category: "Commerce",
    status: "published",
  });
  const courseId = Number(created.insertId);
  await db.insert(lessons).values([
    {
      courseId,
      title: "Welcome to the Commerce classroom",
      description: "Course orientation and learning roadmap.",
      duration: "08 min",
      sortOrder: 1,
      status: "published",
    },
    {
      courseId,
      title: "Business Studies — core concepts",
      description: "The fundamentals every Commerce student should know.",
      duration: "42 min",
      sortOrder: 2,
      status: "published",
    },
    {
      courseId,
      title: "Accounting — first principles",
      description: "A clear start to recording and understanding accounts.",
      duration: "36 min",
      sortOrder: 3,
      status: "published",
    },
  ]);
  await db.insert(announcements).values({
    title: "Welcome to the new Commerce classroom",
    body: "Your learning dashboard is ready. Submit your payment receipt to request access to the recordings.",
    type: "general",
    isPublished: 1,
    createdBy: 1,
  });
}
