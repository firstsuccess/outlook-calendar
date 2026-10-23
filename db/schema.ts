import {integer,sqliteTable,text} from 'drizzle-orm/sqlite-core';
export const pageCounters=sqliteTable('page_counters',{id:text('id').primaryKey(),value:integer('value').notNull().default(100)});
