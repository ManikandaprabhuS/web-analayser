const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const axios = require('axios');      // ✅ new
const cheerio = require('cheerio');

// Extract ONLY readable text (no HTML)
function extractCleanContent(html) {
    const $ = cheerio.load(html);

    // 1️⃣ Remove all known junk containers
    $('nav, header, footer, script, style, svg, img, aside, form, ul, ol, li, .nav, .menu, .navbar, .footer, .sidebar, .widget, .breadcrumbs, .pagination, .social-icons, .product-category').remove();

    // 2️⃣ Extract basic SEO fields
    const title = $('title').text().trim();
    const metaDescription = $('meta[name="description"]').attr("content")?.trim() || "";
    const h1 = $('h1').first().text().trim();

    // 3️⃣ Extract meaningful headings
    const headings = [];
    $('h2, h3, h4').each((i, el) => {
        const txt = $(el).text().trim();
        if (txt.length > 5) headings.push(txt);
    });

    // 4️⃣ Extract REAL content paragraphs only
    const paragraphs = [];
    $('p').each((i, el) => {
        const txt = $(el).text().trim();

        // skip junk
        if (txt.length < 50) return; // skip short lines like menu labels
        if (txt.includes("Follow us") || txt.includes("Copyright")) return;
        if (txt.includes("Cart") || txt.includes("0.00")) return;
        if (txt.includes("Signup") || txt.includes("Login")) return;

        paragraphs.push(txt);
    });

    // 5️⃣ Extract content from <main>, <section>, <article>
    const mainContentBlocks = [];
    $('main, article, section').each((i, el) => {
        const blockText = $(el).text().replace(/\s+/g, " ").trim();

        if (blockText.length > 100) {
            mainContentBlocks.push(blockText);
        }
    });

    // Combine everything
    const combinedText = [...paragraphs, ...mainContentBlocks].join(" ");

    return {
        title,
        metaDescription,
        h1,
        headings,
        paragraphs,
        contentBlocks: mainContentBlocks,
        cleanText: combinedText,
        wordCount: combinedText.split(" ").length,
    };
}


async function crawlWebsite(startUrl, maxPages = 10) {
    const visited = new Set();
    const toVisit = [startUrl];
    let count = 0;

    const extractedData = [];

    while (toVisit.length > 0 && count < maxPages) {
        const url = toVisit.shift();

        if (visited.has(url)) continue;
        visited.add(url);

        try {
            console.log(`\n🔍 Crawling Page ${count + 1}: ${url}`);

            const response = await axios.get(url, { timeout: 10000 });
            const html = response.data;

            // 🔥 Get CLEAN extracted content
            const cleanContent = extractCleanContent(html);

            // ✅ Store text in array
            extractedData.push({
                page: count + 1,
                url,
                text: cleanContent
            });

            console.log("----- CLEAN CONTENT START -----");
            console.log(`Title: ${cleanContent.title}`);
            console.log(`H1: ${cleanContent.h1}`);
            console.log(`Headings: ${cleanContent.headings.join(", ")}`);
            console.log(`Word Count: ${cleanContent.wordCount}`);
            console.log("Paragraphs:");
            cleanContent.paragraphs.slice(0, 3).forEach(p => console.log(" - " + p));
            console.log("----- CLEAN CONTENT END -----\n");
            count++;

            // find new internal links
            const $ = cheerio.load(html);
            const baseDomain = new URL(startUrl).hostname;

            $("a[href]").each((_, el) => {
                let link = $(el).attr("href");
                if (!link) return;

                // ❌ Skip Cloudflare email protection links
                if (link.includes("cdn-cgi") || link.includes("email-protection")) return;

                // ❌ Skip JavaScript links
                if (link.startsWith("javascript")) return;

                // ❌ Skip phone/email links
                if (link.startsWith("tel:") || link.startsWith("mailto:")) return;

                // ❌ Skip hash links (#something)
                if (link.startsWith("#")) return;

                // Convert relative links to absolute
                if (link.startsWith("/")) {
                    link = new URL(link, url).href; // correct absolute path
                }
                // Only follow same domain links
                try {
                    const linkDomain = new URL(link).hostname;
                    // allow subdomains (blog.example.com)
                    if (!linkDomain.endsWith(baseDomain)) return;

                    if (!visited.has(link)) {
                        toVisit.push(link);
                    }
                } catch (err) { }
            });

        } catch (err) {
            console.log("❌ Failed to crawl:", url, err.message);
        }
    }
    console.log(`\n✅ Total Pages Crawled: ${count}`);
    return extractedData;
}

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
