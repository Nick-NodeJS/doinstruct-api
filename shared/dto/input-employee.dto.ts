import { Transform } from "class-transformer";
import { IsOptional, validate } from "class-validator";
import { parsePhoneNumber } from "libphonenumber-js";
import { ERRORS } from "../enum/error.enum";

export class InputEmployee {
  number!: string;
  firstName!: string;
  lastName!: string;

  @IsOptional()
  @Transform(({ value }) => value || undefined)
  phone?: string;

  async validate(): Promise<InputEmployee> {
    const errors = await validate(this);
    if (errors.length > 0) {
      throw new Error(errors.toString());
    }
    if (this.phone) {
      const phoneNumber = parsePhoneNumber(this.phone);
      if (phoneNumber.isValid()) {
        this.phone = phoneNumber.number;
      } else {
        throw new Error(ERRORS.BAD_EMPLOYEE_PHONE + " " + this.phone);
      }
    }
    return this;
  }
}
