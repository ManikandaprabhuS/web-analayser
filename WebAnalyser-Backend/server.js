const express = require('express');
const cors = require('cors');
const { crawlWebsite } = require('./Crawl'); 

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Main endpoint: receive audit request
app.post('/api/audit', async (req, res) => {
    const { url, email, type } = req.body;

    console.log('Received audit request:', { url, email, type });

    // Basic validation
    if (!url || !email || !type) {
        return res.status(400).json({
            success: false,
            message: 'url, email and type are required'
        });
    }

    try {
        console.log("\n🚀 Starting website crawl...");
        // ✅ Get extracted text from crawler
        const extractedPages = await crawlWebsite(url, 10);
        
        console.log("\n======================");
        console.log("📌 FINAL EXTRACTED DATA");
        console.log("======================\n");

        extractedPages.forEach((page) => {
      console.log(`\n📄 PAGE ${page.page}: ${page.url}`);
      console.log("--------------------------------------");
      console.log("Title:", page.text.title);
      console.log("H1:", page.text.h1);
      console.log("Headings:", page.text.headings);
      console.log("Word Count:", page.text.wordCount);
    });

        return res.json({
            success: true,
            message: "Crawling completed. Check backend console for extracted text."
        });
    } catch (error) {
        console.error("Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Crawling failed.",
            error: error.message
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
