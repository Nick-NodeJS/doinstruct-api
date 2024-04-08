import { Api, RDS, StackContext } from "sst/constructs";

export function EmployeeStack({ stack }: StackContext) {
    // Create the Aurora DB cluster
    const cluster = new RDS(stack, "Cluster", {
      engine: "postgresql11.13",
      defaultDatabaseName: "employees",
      migrations: "services/migrations",
      types: {
        path: "core/sql/types.ts",
        camelCase: true
      }
    });
  
    // Create a HTTP API
    const api = new Api(stack, "Api", {
      defaults: {
        function: {
          bind: [cluster],
        },
      },
      routes: {
        // report with errors and the number of imported employees
        "GET /report": "packages/functions/src/reports/get.handler",

        // endpoint that receives and validates employee data
        "POST /employee": "packages/functions/src/employee/insert.handler",
      },
    });
  
    // Show the resource info in the output
    stack.addOutputs({
      ApiEndpoint: api.url,
      SecretArn: cluster.secretArn,
      ClusterIdentifier: cluster.clusterIdentifier,
    });
}
