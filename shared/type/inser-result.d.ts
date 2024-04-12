import { InsertError } from "./insert-error";

export type InsertResult = {
  insertedEmployee: { number: string }[];
  failValidationEmployee: InsertError[];
};
