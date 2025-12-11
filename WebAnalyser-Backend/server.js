const express = require('express');
const cors = require('cors');
const { crawlWebsite } = require('./Crawl'); 
require('dotenv').config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const { enqueueAuditJob, getJobStatus } = require('./queue');

// Create a new audit job
app.post('/api/audit', async (req, res) => {
  const { url, email, type } = req.body;

  console.log('Received audit request:', { url, email, type });

  if (!url || !email || !type) {
    return res.status(400).json({
      success: false,
      message: 'url, email and type are required',
    });
  }

  let finalUrl = url;
  if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
    finalUrl = 'https://' + finalUrl;
  }

  try {
    const jobId = await enqueueAuditJob({
      url: finalUrl,
      email,
      type,
    });

    console.log('Job enqueued:', jobId);

    return res.json({
      success: true,
      jobId,
      message: 'Audit job queued. You will receive the result by email.',
    });
  } catch (err) {
    console.error('Error enqueuing job:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to queue audit job',
    });
  }
});

// Optional: job status endpoint
app.get('/api/audit/:jobId', async (req, res) => {
  const { jobId } = req.params;

  try {
    const job = await getJobStatus(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    return res.json({ success: true, job });
  } catch (err) {
    console.error('Error fetching job:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch job status',
    });
  }
});

// Health check
app.get('/', (req, res) => {
    res.send('Web Analyser Backend is running');
});


// Start server
app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
});
