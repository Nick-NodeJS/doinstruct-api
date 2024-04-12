import { Employee } from "./employee";
import { InsertError } from "./insert-error";

export type Database = {
  employee: Employee;
  insertError: InsertError;
};
