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
    const { keys, screenName, projectKey, epicKey, fileKey } = req.body;

    console.log(`📤 Exporting ${keys.length} keys to Lokalise...`);

    // Create keys in Lokalise
    const lokaliseResult = await lokaliseClient.createKeys(keys);
    console.log(`✓ Created ${keys.length} keys in Lokalise`);

    // Generate JIRA ticket description
    const figmaUrl = `https://figma.com/file/${fileKey}`;
    const lokaliseUrl = `https://app.lokalise.com/project/${process.env.LOKALISE_PROJECT_ID}`;

    const description = jiraClient.generateTicketDescription(
      keys.map(k => ({ name: k.key_name, text: k.translations[0].translation })),
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
      linkedKeys: 0
    });

  } catch (error) {
    console.error('Export error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Plugin backend API running on http://localhost:${PORT}`);
  console.log(`Ready to receive export requests from Figma plugin`);
});
