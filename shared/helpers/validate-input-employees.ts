import { InputEmployee } from "../dto/input-employee.dto";
import { plainToClass } from "class-transformer";
import { Employee, InsertEmployeeError } from "../interfaces";

export const validateInputEmployees = async (
  inputs: any[],
): Promise<[Employee[], InsertEmployeeError[]]> => {
  const validatedEmployees: Employee[] = [];
  const invalidEmployees: InsertEmployeeError[] = [];

  await Promise.all(
    inputs.map(async (obj: InputEmployee) => {
      try {
        const employee = plainToClass(InputEmployee, obj);
        await employee.validate();
        validatedEmployees.push(employee);
      } catch (error) {
        const { number } = obj;
        invalidEmployees.push({ number, error: `${error}` });
      }
    }),
  );

  return [validatedEmployees, invalidEmployees];
};
