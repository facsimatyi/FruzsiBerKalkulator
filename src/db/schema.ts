import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  numeric,
  boolean,
  index,
  unique,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userSettings = pgTable("user_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  illetmeny: integer("illetmeny").notNull().default(457500),
  hoursPerDay: numeric("hours_per_day", { precision: 4, scale: 2 })
    .notNull()
    .default("6"),
  selectedBer: integer("selected_ber").notNull().default(-1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const shifts = pgTable(
  "shifts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    isBehivas: boolean("is_behivas").notNull().default(false),
    isPihenonap: boolean("is_pihenonap").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("idx_shifts_user_month").on(table.userId, table.startTime)]
);

export const kedvezmenyMap = pgTable(
  "kedvezmeny_map",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    kedvezmenyes: boolean("kedvezmenyes").notNull(),
  },
  (table) => [
    unique("uq_kedvezmeny_user_year_month").on(
      table.userId,
      table.year,
      table.month
    ),
  ]
);

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserSettings = typeof userSettings.$inferSelect;
export type Shift = typeof shifts.$inferSelect;
export type NewShift = typeof shifts.$inferInsert;
export type KedvezmenyEntry = typeof kedvezmenyMap.$inferSelect;
