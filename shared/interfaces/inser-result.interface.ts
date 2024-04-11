import { InsertError } from "./insert-error.interface";

export interface InsertResult {
  insertedEmployee: { number: string }[];
  failValidationEmployee: InsertError[];
}
