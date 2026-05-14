import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { questions } from './questions';

export const attempts = pgTable('attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  questionId: uuid('question_id')
    .notNull()
    .references(() => questions.id, { onDelete: 'cascade' }),
  selectedChoiceId: text('selected_choice_id').notNull(),
  isCorrect: boolean('is_correct').notNull(),
  xpEarned: integer('xp_earned').notNull().default(0),
  timeTakenMs: integer('time_taken_ms'),
  answeredAt: timestamp('answered_at', { withTimezone: true }).defaultNow().notNull(),
});
