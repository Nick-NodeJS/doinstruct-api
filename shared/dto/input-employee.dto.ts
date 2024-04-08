import { Transform } from "class-transformer";
import { IsOptional, IsString, validate } from "class-validator";
import { parsePhoneNumber } from "libphonenumber-js";

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
        throw new Error(`Bad phone string ${this.phone}`);
      }
    }
    return this;
  }
}
