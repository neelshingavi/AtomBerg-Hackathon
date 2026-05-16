import { PrismaClient } from "@prisma/client";

async function globalSetup() {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({
      where: { email: "employee@demo.com" },
    });
    if (!user) {
      console.warn(
        "\n⚠️  E2E: Demo user not found. Run: npm run db:seed\n"
      );
      process.exit(1);
    }
    console.log("E2E global setup: database seed verified");
  } catch (e) {
    console.error(
      "\n⚠️  E2E: Cannot connect to database. Start Postgres and run npm run db:seed\n",
      e
    );
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

export default globalSetup;
