import { router } from './trpc';
import { lessonRouter } from './routers/lesson';
import { profileRouter } from './routers/profile';
import { questionRouter } from './routers/question';

export const appRouter = router({
  profile: profileRouter,
  lesson: lessonRouter,
  question: questionRouter,
});

export type AppRouter = typeof appRouter;
