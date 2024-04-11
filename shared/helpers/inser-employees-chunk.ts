import { Kysely } from "kysely";
import { Database, InsertResult } from "../interfaces";
import { validateInputEmployees } from "./validate-input-employees";
import { Tables, ERRORS } from "../enum";

export const insertEmployeeChunk = async (
  db: Kysely<Database>,
  data: any,
): Promise<InsertResult> => {
  // Validate input employees and split them for valids and fails
  const [validatedEmployeeToInsert, failValidationEmployee] =
    await validateInputEmployees(data);

  // Get Employee numbers and phones to insert
  const { insertsEmployeeNumbers, insertsEmployeePhones } =
    validatedEmployeeToInsert.reduce(
      (
        acc: {
          insertsEmployeeNumbers: string[];
          insertsEmployeePhones: string[];
        },
        { number, phone },
      ) => {
        acc.insertsEmployeeNumbers.push(number);
        if (phone) {
          acc.insertsEmployeePhones.push(phone);
        }
        return acc;
      },
      { insertsEmployeeNumbers: [], insertsEmployeePhones: [] },
    );

  return db.transaction().execute(async (trx) => {
    // Select from DB Employee numbers and phones which we have in input valid Employee records
    const [result1, result2] = await Promise.all([
      insertsEmployeeNumbers.length > 0
        ? trx
            .selectFrom(Tables.EMPLOYEE)
            .select(["employee.number"])
            .where("number", "in", insertsEmployeeNumbers)
            .execute()
        : Promise.resolve([]),
      insertsEmployeePhones.length > 0
        ? trx
            .selectFrom(Tables.EMPLOYEE)
            .select(["employee.phone"])
            .where("phone", "in", insertsEmployeePhones)
            .execute()
        : Promise.resolve([]),
    ]);
    const existenNumbers: string[] = result1.map(({ number }) => number);
    const existenPhones: string[] = result2.map(({ phone }) => phone);

    // Loop valid Employees to exclude existen records and fill Failed Employee array
    let numberOfEmployeesToInsert = validatedEmployeeToInsert.length;
    for (let i = 0; i < numberOfEmployeesToInsert; i++) {
      const { number, phone } = validatedEmployeeToInsert[i];
      let error = "";
      if (existenNumbers.includes(number)) {
        error = ERRORS.EMPLOYEE_NUMBER_EXISTS;
      } else if (phone && existenPhones.includes(phone)) {
        error = ERRORS.EMPLOYEE_PHONE_EXISTS;
      }
      if (error.length > 0) {
        failValidationEmployee.push({
          number,
          error,
        });
        validatedEmployeeToInsert.splice(i, 1);
        numberOfEmployeesToInsert--;
        i--;
      }
    }

    //Insert in DB valid Employees
    const insertedEmployee =
      validatedEmployeeToInsert.length > 0
        ? await trx
            .insertInto("employee")
            .values(validatedEmployeeToInsert)
            .returning(["employee.number"])
            .execute()
        : [];

    // Insert in DB fail records
    const _ =
      failValidationEmployee.length > 0
        ? await trx
            .insertInto("insertError")
            .values(failValidationEmployee)
            .execute()
        : [];

    return { insertedEmployee, failValidationEmployee };
  });
};
