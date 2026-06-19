import { router } from "../trpc";
import { resumeRouter } from "./resume";

export const appRouter = router({
  resume: resumeRouter,
});

export type AppRouter = typeof appRouter;
