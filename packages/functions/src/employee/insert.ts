import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { CamelCasePlugin, Kysely } from "kysely";
import { Database } from "../../../../shared/interfaces";
import { DataApiDialect } from "kysely-data-api";
import { RDSData } from "@aws-sdk/client-rds-data";
import { RDS } from "sst/node/rds";
import { insertEmployeeChunk } from "../../../../shared/helpers";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  if (!event.body) {
    return {
      statusCode: 400,
      error: "BadRequest",
    };
  }

  // Parse input Employee records
  const employeesToInsert = JSON.parse(event.body);

  // Get DB
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

  // Process input Employee records via spliting them by chunks

  // TODO: should be configured via settings
  const insertChunkSize = 7;

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
      acc.failValidationEmployee = acc.failValidationEmployee.concat(
        curr.failValidationEmployee,
      );
      return acc;
    },
    { insertedEmployee: [], failValidationEmployee: [] },
  );

  return {
    statusCode: 200,
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      inserted: result.insertedEmployee.length,
      fail: result.failValidationEmployee.length,
    }),
  };
};
