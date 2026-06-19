import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Rate-limited procedure — enforces IP rate limit before running
export const rateLimitedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const { checkRateLimit } = await import("@/lib/rate-limit");
  const result = await checkRateLimit(ctx.ipAddress);

  if (!result.allowed) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Rate limit exceeded. You can make ${process.env.RATE_LIMIT_MAX ?? 3} analyses per hour. Try again after ${result.resetAt.toLocaleTimeString()}.`,
    });
  }

  return next();
});
