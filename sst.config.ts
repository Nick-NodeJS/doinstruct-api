import { SSTConfig } from "sst";
import { EmployeeStack } from "./stacks/EmployeeStack";

export default {
  config(_input) {
    return {
      name: "doinstruct-rest-api",
      region: "eu-central-1",
    };
  },
  stacks(app) {
    app.stack(EmployeeStack);
  }
} satisfies SSTConfig;
