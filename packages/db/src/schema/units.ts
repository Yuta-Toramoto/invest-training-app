import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { lessons } from './lessons';

export const units = pgTable('units', {
  id: uuid('id').primaryKey().defaultRandom(),
  lessonId: uuid('lesson_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  order: integer('order').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
