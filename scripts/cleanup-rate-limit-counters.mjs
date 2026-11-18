import { PrismaClient } from "@prisma/client";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const retentionArg = args.find((arg) => arg.startsWith("--retention-hours="));
const retentionHours = retentionArg
  ? Number(retentionArg.split("=")[1])
  : 48;

if (!Number.isInteger(retentionHours) || retentionHours < 48) {
  console.error("Retention must be a whole number of at least 48 hours.");
  process.exit(2);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(2);
}

if (apply && process.env.APEX_ALLOW_RATE_LIMIT_CLEANUP !== "1") {
  console.error(
    "Refusing to delete rows. Set APEX_ALLOW_RATE_LIMIT_CLEANUP=1 and pass --apply to confirm.",
  );
  process.exit(2);
}

const cutoff = new Date(Date.now() - retentionHours * 60 * 60 * 1000);
const prisma = new PrismaClient();

try {
  const count = await prisma.apiRateLimitCounter.count({
    where: { updatedAt: { lt: cutoff } },
  });

  console.log(
    `${count} rate-limit counter row(s) are older than ${retentionHours} hours (cutoff ${cutoff.toISOString()}).`,
  );

  if (!apply) {
    console.log("Dry run only. No rows were changed. Pass --apply with the explicit environment confirmation to delete them.");
  } else {
    const result = await prisma.apiRateLimitCounter.deleteMany({
      where: { updatedAt: { lt: cutoff } },
    });
    console.log(`Deleted ${result.count} expired rate-limit counter row(s).`);
  }
} catch (error) {
  console.error("Rate-limit counter cleanup failed.", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
