// Backend API server for Figma plugin
require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const LokaliseClient = require('../src/lokalise/client');
const JiraClient = require('../src/jira/client');

const app = express();
app.use(cors());
app.use(express.json());

const lokaliseClient = new LokaliseClient(
  process.env.LOKALISE_API_TOKEN,
  process.env.LOKALISE_PROJECT_ID
);

const jiraClient = new JiraClient(
  process.env.JIRA_BASE_URL,
  process.env.JIRA_EMAIL,
  process.env.JIRA_API_TOKEN
);

// Export endpoint
app.post('/api/export', async (req, res) => {
  try {
    const { keys, screenshots, screenName, projectKey, epicKey, fileKey, layerMappings } = req.body;

    console.log(`📤 Exporting ${keys.length} keys to Lokalise...`);

    // Create keys in Lokalise
    const lokaliseResult = await lokaliseClient.createKeys(keys);
    const createdKeys = lokaliseResult.keys || [];
    console.log(`✓ Created ${keys.length} keys in Lokalise`);

    // Upload screenshots if provided
    if (screenshots && screenshots.length > 0) {
      console.log(`📸 Uploading ${screenshots.length} screenshots...`);

      // Map screenshots to key IDs
      const screenshotsWithKeyIds = screenshots.map(screenshot => {
        // Find the created key ID for this screenshot
        const keyIndex = screenshot.keyIndex;
        const createdKey = createdKeys[keyIndex];

        return {
          keyIds: createdKey ? [createdKey.key_id] : [],
          image: screenshot.image,
          title: `${screenName} - ${keys[keyIndex].key_name}`
        };
      }).filter(s => s.keyIds.length > 0);

      const screenshotResults = await lokaliseClient.bulkUploadScreenshots(screenshotsWithKeyIds);
      console.log(`✓ Uploaded ${screenshotResults.filter(r => r.success).length}/${screenshots.length} screenshots`);
    }

    // Generate JIRA ticket description
    const figmaUrl = `https://figma.com/file/${fileKey}`;
    const lokaliseUrl = `https://app.lokalise.com/project/${process.env.LOKALISE_PROJECT_ID}`;

    const description = jiraClient.generateTicketDescription(
      keys.map(k => ({ name: k.key_name, text: k.text })),
      lokaliseUrl,
      figmaUrl,
      screenName
    );

    // Create JIRA ticket
    console.log(`🎫 Creating JIRA ticket in project ${projectKey}...`);
    const jiraTicket = await jiraClient.createIssue(
      projectKey,
      `Implement translations for ${screenName}`,
      description,
      epicKey || null,
      null
    );

    console.log(`✓ JIRA ticket created: ${jiraTicket.key}`);

    res.json({
      success: true,
      jiraTicket: {
        key: jiraTicket.key,
        url: `${process.env.JIRA_BASE_URL}/browse/${jiraTicket.key}`
      },
      lokaliseUrl,
      linkedKeys: 0,
      screenshotsUploaded: screenshots ? screenshots.length : 0,
      layerMappings: layerMappings || []
    });

  } catch (error) {
    console.error('Export error:', error.message);
    if (error.response) {
      console.error('Error details:', JSON.stringify(error.response.data, null, 2));
    }
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Plugin backend API running on http://localhost:${PORT}`);
  console.log(`Ready to receive export requests from Figma plugin`);
});
