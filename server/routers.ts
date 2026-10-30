import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  announcements,
  assignments,
  courses,
  enrollments,
  lessons,
  receipts,
} from "../drizzle/schema";
import {
  createDefaultCourseIfEmpty,
  findEnrollment,
  getAdminOverview,
  getCourseById,
  getDb,
  getPublishedCatalog,
  getStudentOverview,
  updateStudentProfile,
} from "./db";
import { storagePut } from "./storage";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from "./_core/trpc";

const fileInput = z.object({
  fileName: z.string().min(1).max(180),
  fileType: z.string().min(1).max(120),
  fileData: z.string().min(1).max(8_000_000),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().min(2).max(120),
          phone: z.string().min(7).max(30),
          school: z.string().min(2).max(180),
          grade: z.string().min(1).max(40),
          district: z.string().min(2).max(80),
          addressLine1: z.string().min(3).max(180),
          addressLine2: z.string().max(180).optional(),
          city: z.string().min(2).max(100),
          postalCode: z.string().max(20).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await updateStudentProfile(ctx.user.id, input);
        return { success: true as const, user };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  lms: router({
    catalog: publicProcedure.query(async () => {
      await createDefaultCourseIfEmpty();
      return getPublishedCatalog();
    }),
    dashboard: protectedProcedure.query(async ({ ctx }) =>
      getStudentOverview(ctx.user.id)
    ),
    submitReceipt: protectedProcedure
      .input(
        fileInput.extend({
          courseId: z.number().int().positive(),
          amount: z.number().int().positive().optional(),
          reference: z.string().max(160).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database is not available",
          });
        const course = await getCourseById(input.courseId);
        if (!course || course.status !== "published")
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Course not found",
          });
        const stored = await storagePut(
          `receipts/${ctx.user.id}/${input.fileName}`,
          Buffer.from(input.fileData, "base64"),
          input.fileType
        );
        const existing = await findEnrollment(ctx.user.id, input.courseId);
        if (existing) {
          await db
            .update(enrollments)
            .set({ accessStatus: "pending", updatedAt: new Date() })
            .where(eq(enrollments.id, existing.id));
        } else {
          await db.insert(enrollments).values({
            userId: ctx.user.id,
            courseId: input.courseId,
            accessStatus: "pending",
          });
        }
        await db.insert(receipts).values({
          userId: ctx.user.id,
          courseId: input.courseId,
          amount: input.amount,
          reference: input.reference,
          fileName: input.fileName,
          fileKey: stored.key,
          status: "pending",
        });
        return { success: true } as const;
      }),
  }),

  admin: router({
    overview: adminProcedure
      .input(z.object({ search: z.string().optional() }).optional())
      .query(async ({ input }) => getAdminOverview(input?.search)),
    createCourse: adminProcedure
      .input(
        z.object({
          title: z.string().min(3).max(180),
          description: z.string().min(10),
          slug: z.string().min(3).max(180),
          status: z.enum(["draft", "published"]).default("draft"),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database is not available",
          });
        await db.insert(courses).values(input);
        return { success: true } as const;
      }),
    createLesson: adminProcedure
      .input(
        z.object({
          courseId: z.number().int().positive(),
          title: z.string().min(3).max(180),
          description: z.string().optional(),
          duration: z.string().max(40).optional(),
          sortOrder: z.number().int().default(1),
          status: z.enum(["draft", "published"]).default("draft"),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database is not available",
          });
        await db.insert(lessons).values(input);
        return { success: true } as const;
      }),
    setCourseStatus: adminProcedure
      .input(
        z.object({
          courseId: z.number().int().positive(),
          status: z.enum(["draft", "published"]),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database is not available",
          });
        await db
          .update(courses)
          .set({ status: input.status, updatedAt: new Date() })
          .where(eq(courses.id, input.courseId));
        return { success: true } as const;
      }),
    setLessonStatus: adminProcedure
      .input(
        z.object({
          lessonId: z.number().int().positive(),
          status: z.enum(["draft", "published"]),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database is not available",
          });
        await db
          .update(lessons)
          .set({ status: input.status, updatedAt: new Date() })
          .where(eq(lessons.id, input.lessonId));
        return { success: true } as const;
      }),
    createAssignment: adminProcedure
      .input(
        z.object({
          courseId: z.number().int().positive(),
          title: z.string().min(3).max(180),
          instructions: z.string().min(5).max(10000),
          dueAt: z.string().datetime().optional(),
          status: z.enum(["draft", "published"]).default("draft"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database is not available",
          });
        const course = await getCourseById(input.courseId);
        if (!course)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Course not found",
          });
        await db.insert(assignments).values({
          courseId: input.courseId,
          title: input.title,
          instructions: input.instructions,
          dueAt: input.dueAt ? new Date(input.dueAt) : null,
          status: input.status,
          createdBy: ctx.user.id,
        });
        return { success: true } as const;
      }),
    setAssignmentStatus: adminProcedure
      .input(
        z.object({
          assignmentId: z.number().int().positive(),
          status: z.enum(["draft", "published"]),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database is not available",
          });
        await db
          .update(assignments)
          .set({ status: input.status, updatedAt: new Date() })
          .where(eq(assignments.id, input.assignmentId));
        return { success: true } as const;
      }),
    uploadLessonFile: adminProcedure
      .input(
        fileInput.extend({
          lessonId: z.number().int().positive(),
          kind: z.enum(["recording", "resource"]),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database is not available",
          });
        const stored = await storagePut(
          `lessons/${input.lessonId}/${input.kind}/${input.fileName}`,
          Buffer.from(input.fileData, "base64"),
          input.fileType
        );
        await db
          .update(lessons)
          .set(
            input.kind === "recording"
              ? { recordingKey: stored.key, updatedAt: new Date() }
              : { resourceKey: stored.key, updatedAt: new Date() }
          )
          .where(eq(lessons.id, input.lessonId));
        return { success: true, url: stored.url } as const;
      }),
    reviewReceipt: adminProcedure
      .input(
        z.object({
          receiptId: z.number().int().positive(),
          status: z.enum(["approved", "rejected"]),
          rejectionNote: z.string().max(500).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database is not available",
          });
        const receipt = await db
          .select()
          .from(receipts)
          .where(eq(receipts.id, input.receiptId))
          .limit(1);
        if (!receipt[0])
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Receipt not found",
          });
        await db
          .update(receipts)
          .set({
            status: input.status,
            rejectionNote:
              input.status === "rejected" ? input.rejectionNote : null,
            reviewedAt: new Date(),
          })
          .where(eq(receipts.id, input.receiptId));
        await db
          .update(enrollments)
          .set({
            accessStatus: input.status === "approved" ? "approved" : "pending",
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(enrollments.userId, receipt[0].userId),
              eq(enrollments.courseId, receipt[0].courseId)
            )
          );
        return { success: true } as const;
      }),
    createAnnouncement: adminProcedure
      .input(
        z.object({
          title: z.string().min(3).max(180),
          body: z.string().min(5),
          type: z.enum(["general", "lesson"]).default("general"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database is not available",
          });
        await db
          .insert(announcements)
          .values({ ...input, createdBy: ctx.user.id, isPublished: 1 });
        return { success: true } as const;
      }),
  }),
});

export type AppRouter = typeof appRouter;
