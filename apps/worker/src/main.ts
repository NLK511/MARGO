import { createEmailDeliveryService, createNotificationOutboxWorker } from '@margo/db';

const pollIntervalMs = Number(process.env.NOTIFICATION_WORKER_INTERVAL_MS ?? 5000);
const once = process.env.NOTIFICATION_WORKER_ONCE === 'true';
const worker = createNotificationOutboxWorker(undefined, {
  mailer: createEmailDeliveryService(),
  take: Number(process.env.NOTIFICATION_WORKER_BATCH_SIZE ?? 20),
});

async function tick() {
  const result = await worker.processPending();
  if (result.attempted > 0) {
    console.log(`notification worker: processed=${result.processed} failed=${result.failed} attempted=${result.attempted}`);
  }
}

async function main() {
  await tick();
  if (once) return;

  console.log(`notification worker polling every ${pollIntervalMs}ms`);
  const timer = setInterval(() => {
    void tick().catch((error) => {
      console.error('notification worker tick failed', error);
    });
  }, pollIntervalMs);
  timer.unref();
}

main().catch((error) => {
  console.error('notification worker failed to start', error);
  process.exitCode = 1;
});
