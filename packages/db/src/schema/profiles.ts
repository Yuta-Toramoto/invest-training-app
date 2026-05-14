import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  xp: integer('xp').notNull().default(0),
  currentStreak: integer('current_streak').notNull().default(0),
  hearts: integer('hearts').notNull().default(5),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
  weeklyGoalXp: integer('weekly_goal_xp').notNull().default(100),
  role: text('role', { enum: ['user', 'admin'] })
    .notNull()
    .default('user'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
