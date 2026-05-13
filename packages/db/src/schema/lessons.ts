import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const lessons = pgTable('lessons', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  order: integer('order').notNull(),
  difficulty: integer('difficulty').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
