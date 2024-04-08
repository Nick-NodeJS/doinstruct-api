import { Employee } from "./employee.interface";
import { InsertError } from "./insert-error.interface";

export interface Database {
  employee: Employee;
  insertError: InsertError;
}
