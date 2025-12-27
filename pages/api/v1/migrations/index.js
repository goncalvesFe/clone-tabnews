import migrationRunner from "node-pg-migrate";
import { join } from "node:path";
import database from "infra/database";

async function migrations(request, response) {
  const { method } = request;
  const allowedMethods = ["GET", "POST"];
  if (!allowedMethods.includes(method))
    return response.status(405).json({
      error: `Method "${method}" not allowed`,
    });

  let dbClient;

  try {
    dbClient = await database.getNewClient();
    const isPostRequest = method === "POST" ? true : false;
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

    if (migrations.length > 0 && isPostRequest)
      return response.status(201).json(migrations);

    return response.status(200).json(migrations);
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await dbClient.end();
  }
}

export default migrations;
