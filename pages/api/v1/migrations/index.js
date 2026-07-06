import { createRouter } from "next-connect";
import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "infra/database";
import controller from "infra/controllers";

const router = createRouter();

router.get(getHandler).post(postHandler);

export default router.handler(controller.errorHandlers);

const migrationsOptions = {
  dryRun: true,
  dir: resolve("infra", "migrations"),
  direction: "up",
  verbose: true,
  migrationsTable: "pgmigrations",
};

async function getHandler(request, response) {
  let dbClient;

  try {
    dbClient = await database.getNewClient();

    const migrations = await migrationRunner({
      ...migrationsOptions,
      dbClient,
    });

    return response.status(200).json(migrations);
  } finally {
    await dbClient.end();
  }
}

async function postHandler(request, response) {
  let dbClient;

  try {
    dbClient = await database.getNewClient();
    migrationsOptions.dryRun = false;

    const migrations = await migrationRunner({
      ...migrationsOptions,
      dbClient,
    });

    if (migrations.length > 0) return response.status(201).json(migrations);

    return response.status(200).json(migrations);
  } finally {
    await dbClient.end();
  }
}
