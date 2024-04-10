import { Kysely } from "kysely";

//TODO: investigate how to run migrations manualy(seems sst-web-comsole issue)

/**
 * @param db {Kysely<any>}
 */
export async function up(db) {
  await db.schema
    .createTable('employee')
    .addColumn('id', 'integer', (col) => col.autoIncrement().primaryKey())
    .addColumn("number", "varchar", (col) => col.notNull().unique())
    .addColumn("first_name", "varchar", (col) => col.notNull())
    .addColumn("last_name", "varchar", (col) => col.notNull())
    .addColumn("phone", "varchar", (col) => col.unique())
    .execute();

    await db.schema
    .createTable("insertError")
    .addColumn('id', 'integer', (col) => col.autoIncrement().primaryKey())
    .addColumn("number", "varchar", (col) => col.notNull().unique())
    .addColumn("error", "varchar", (col) => col.notNull())
    .execute();
}

/**
 * @param db {Kysely<any>}
 */
export async function down(db) {
  await db.schema.dropTable("employee").execute();
  await db.schema.dropTable("insertError").execute()
}