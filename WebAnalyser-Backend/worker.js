// worker.js
require('dotenv').config();
const { popNextJob, updateJobStatus } = require('./queue');
const { crawlWebsite } = require('./Crawl');

async function processJob(job) {
  const { id: jobId, payload } = job;
  const { url, email, type } = payload;

  console.log(`\n⚙️ Processing job: ${jobId}`);
  console.log('Payload:', payload);

  await updateJobStatus(jobId, { status: 'processing' });

  try {
    // 1) Crawl website and extract content
    const pages = await crawlWebsite(url, 10);

    console.log(`\n✅ Crawl complete for job ${jobId}, pages: ${pages.length}`);
    pages.forEach((page) => {
      console.log(`PAGE ${page.page}: ${page.url}`);
      console.log('  Title:', page.text.title);
      console.log('  H1:', page.text.h1);
      console.log('  WordCount:', page.text.wordCount);
    });

    // later we’ll add: SEO, AI, PDF, email here

    await updateJobStatus(jobId, {
      status: 'completed',
      resultSummary: { pageCount: pages.length },
    });

    console.log(`🎉 Job ${jobId} marked as COMPLETED`);
  } catch (err) {
    console.error(`❌ Job ${jobId} failed:`, err.message);
    await updateJobStatus(jobId, {
      status: 'failed',
      error: err.message,
    });
  }
}

async function workerLoop() {
  console.log('👷 Worker started. Waiting for jobs...');

  while (true) {
    try {
      const job = await popNextJob();

      if (!job) {
        // no jobs → wait and check again
        await new Promise((resolve) => setTimeout(resolve, 3000));
        continue;
      }

      await processJob(job);
    } catch (err) {
      console.error('Worker loop error:', err.message);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

workerLoop();
