import migrationRunner from "node-pg-migrate";
import { join } from "node:path";
import database from "infra/database";

async function migrations(request, response) {
  const dbClient = await database.getNewClient();
  const isPostRequest = request.method === "POST" ? true : false;
  const migrationsOptions = {
    dbClient,
    dryRun: true,
    dir: join("infra", "migrations"),
    direction: "up",
    verbose: true,
    migrationsTable: "pgmigrations",
  };

  if (isPostRequest) migrationsOptions.dryRun = false;

  const migrations = await migrationRunner(migrationsOptions);

  await dbClient.end();

  if (migrations.length > 0 && isPostRequest)
    return response.status(201).json(migrations);

  return response.status(200).json(migrations);
}

export default migrations;
