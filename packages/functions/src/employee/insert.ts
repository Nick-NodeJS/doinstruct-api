import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { CamelCasePlugin, Kysely } from "kysely";
import { Database, InsertError } from "../../../../shared/interfaces";
import { DataApiDialect } from "kysely-data-api";
import { RDSData } from "@aws-sdk/client-rds-data";
import { RDS } from "sst/node/rds";
import { validateInputEmployees } from "../../../../shared/helpers/validate-input-employees";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  if (!event.body) {
    return {
      statusCode: 400,
      error: "BadRequest",
    };
  }

  const employeesToInsert = JSON.parse(event.body);

  const db = new Kysely<Database>({
    dialect: new DataApiDialect({
      mode: "postgres",
      driver: {
        client: new RDSData(),
        secretArn: RDS.Cluster.secretArn,
        resourceArn: RDS.Cluster.clusterArn,
        database: RDS.Cluster.defaultDatabaseName,
      },
    }),
    plugins: [new CamelCasePlugin()],
  });

  // TODO: should be configured via settings
  const insertChunkSize = 1000;

  const promises = [];

  let restOfInserts = employeesToInsert.length;

  while (restOfInserts > 0) {
    console.log(
      `...put next ${insertChunkSize < restOfInserts ? insertChunkSize : restOfInserts} employees of ${restOfInserts}`,
    );
    const employeeChunk = employeesToInsert.splice(0, insertChunkSize);
    promises.push(insertEmployeeChunk(db, employeeChunk));
    restOfInserts = employeesToInsert.length;
  }

  console.log(`Insert ${promises.length} employee chunks into Data Storage`);
  const result = (await Promise.all(promises)).reduce(
    (acc, curr) => {
      acc.insertedEmployee = acc.insertedEmployee.concat(curr.insertedEmployee);
      acc.failedEmployee = acc.failedEmployee.concat(curr.failedEmployee);
      return acc;
    },
    { insertedEmployee: [], failedEmployee: [] },
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      inserted: result.insertedEmployee.length,
      fail: result.failedEmployee.length,
    }),
  };
};

const insertEmployeeChunk = async (
  db: Kysely<Database>,
  data: any,
): Promise<{
  insertedEmployee: { number: string }[];
  failedEmployee: InsertError[];
}> => {
  const [employeeToInsert, failValidationEmployee] =
    await validateInputEmployees(data);

  // TODO: investigate if it returns the exact employee insert error
  const insertedEmployee = await db
    .insertInto("employee")
    .values(employeeToInsert)
    .returning(["employee.number"])
    .execute();

  const failOnInsertEmployee = employeeToInsert
    .filter(({ number }) => !insertedEmployee.find((e) => e.number == number))
    .map(({ number }) => ({ number, error: "DB insert error" }));

  const failedEmployee = [...failValidationEmployee, ...failOnInsertEmployee];

  //TODO: handle insertError result
  const _ = await db.insertInto("insertError").values(failedEmployee).execute();

  return { insertedEmployee, failedEmployee };
};
