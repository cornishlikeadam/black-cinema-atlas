import {sqliteTable,text,integer,index,primaryKey} from 'drizzle-orm/sqlite-core';
export const filmCache=sqliteTable('film_cache',{id:integer('id').primaryKey(),data:text('data').notNull(),updatedAt:integer('updated_at').notNull()});
export const preferences=sqliteTable('preferences',{userId:text('user_id').primaryKey(),data:text('data').notNull(),updatedAt:integer('updated_at').notNull()});
export const messages=sqliteTable('messages',{id:text('id').primaryKey(),userId:text('user_id').notNull(),role:text('role').notNull(),content:text('content').notNull(),createdAt:integer('created_at').notNull()},t=>[index('messages_user_created').on(t.userId,t.createdAt)]);
export const counters=sqliteTable('counters',{key:text('key').primaryKey(),count:integer('count').notNull().default(0),expiresAt:integer('expires_at').notNull()});
export const smsReceipts=sqliteTable('sms_receipts',{sid:text('sid').primaryKey(),createdAt:integer('created_at').notNull(),status:text('status').notNull().default('received')});
export const groups=sqliteTable('groups',{id:text('id').primaryKey(),ownerId:text('owner_id').notNull(),name:text('name').notNull(),criteria:text('criteria').notNull(),createdAt:integer('created_at').notNull()});
export const votes=sqliteTable('votes',{groupId:text('group_id').notNull(),userId:text('user_id').notNull(),filmId:integer('film_id').notNull()},t=>[primaryKey({columns:[t.groupId,t.userId]})]);
