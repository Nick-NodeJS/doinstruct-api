import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { CamelCasePlugin, Kysely } from "kysely";
import { Database } from "../../../../shared/interfaces";
import { DataApiDialect } from "kysely-data-api";
import { RDSData } from "@aws-sdk/client-rds-data";
import { RDS } from "sst/node/rds";
import { Tables } from "../../../../shared/enum";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  //TODO: implement errors pagination
  if (!event.body) {
    return {
      statusCode: 400,
      error: "BadRequest",
    };
  }

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

  const [insertedEmployees, errors] = await Promise.all([
    db
      .selectFrom(Tables.EMPLOYEE)
      .select((eb) => eb.fn.countAll().as("employees"))
      .execute(),
    db.selectFrom(Tables.INSERT_ERROR).select(["number", "error"]).execute(),
  ]);

  return {
    statusCode: 200,
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      insertedEmployees,
      errors,
    }),
  };
};
