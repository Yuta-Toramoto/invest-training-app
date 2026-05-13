import { integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { units } from './units';

export const questions = pgTable('questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  unitId: uuid('unit_id')
    .notNull()
    .references(() => units.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['chart', 'order_book', 'volume'] })
    .notNull()
    .default('chart'),
  chartImageUrl: text('chart_image_url'),
  orderBookImageUrl: text('order_book_image_url'),
  volumeImageUrl: text('volume_image_url'),
  prompt: text('prompt').notNull(),
  choices: jsonb('choices').notNull(),
  correctChoiceId: text('correct_choice_id').notNull(),
  explanation: text('explanation').notNull(),
  tags: text('tags').array().notNull().default([]),
  difficulty: integer('difficulty').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
