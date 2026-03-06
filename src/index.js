require('dotenv').config();
const FigmaScanner = require('./figma/scanner');
const FigmaRenamer = require('./figma/renamer');
const LokaliseClient = require('./lokalise/client');
const JiraClient = require('./jira/client');

class WorkflowOrchestrator {
  constructor() {
    this.figmaScanner = new FigmaScanner(process.env.FIGMA_ACCESS_TOKEN);
    this.figmaRenamer = new FigmaRenamer(process.env.FIGMA_ACCESS_TOKEN);
    this.lokaliseClient = new LokaliseClient(
      process.env.LOKALISE_API_TOKEN,
      process.env.LOKALISE_PROJECT_ID
    );
    this.jiraClient = new JiraClient(
      process.env.JIRA_BASE_URL,
      process.env.JIRA_EMAIL,
      process.env.JIRA_API_TOKEN
    );
  }

  async run(fileKey, screenName, projectKey, epicKey = null) {
    console.log('🔍 Step 1: Scanning Figma file...');
    const layers = await this.figmaScanner.scanLayers(fileKey);
    const score = this.figmaScanner.calculateScore(layers);
    console.log(`Found ${layers.length} text layers (Design score: ${score.toFixed(1)}/10)`);

    console.log('\n💡 Step 2: Generating suggestions...');
    const suggestions = layers
      .filter(layer => layer.isGeneric)
      .map(layer => ({
        nodeId: layer.id,
        oldName: layer.name,
        newName: this.figmaScanner.suggestSemanticName(layer),
        path: layer.path
      }));
    console.log(`Generated ${suggestions.length} suggestions`);

    if (suggestions.length > 0) {
      console.log('\nSuggestions:');
      suggestions.forEach(s => {
        console.log(`  ${s.oldName} → ${s.newName}`);
      });
    }

    // In real implementation, show UI for approval here
    // For POC, auto-approve if suggestions exist
    if (suggestions.length > 0) {
      console.log('\n✏️  Step 3: Renaming layers...');
      const renames = suggestions.map(s => ({
        nodeId: s.nodeId,
        newName: s.newName
      }));
      const results = await this.figmaRenamer.batchRename(fileKey, renames);
      const successCount = results.filter(r => r.success).length;
      console.log(`Successfully renamed ${successCount}/${results.length} layers`);
    } else {
      console.log('\n✅ Step 3: No renaming needed - layer names look good!');
    }

    console.log('\n✅ Step 4: Validating...');
    const updatedLayers = await this.figmaScanner.scanLayers(fileKey);
    const genericCount = updatedLayers.filter(l => l.isGeneric).length;
    console.log(`Generic layers remaining: ${genericCount}`);
    console.log(`Naming compliance: ${((1 - genericCount / updatedLayers.length) * 100).toFixed(1)}%`);

    console.log('\n📤 Step 5: Exporting to Lokalise...');
    const keys = updatedLayers.map((layer) => {
      const pathParts = layer.path.split(' / ');
      const groupName = pathParts[pathParts.length - 2] || 'Root';

      return {
        key_name: this.lokaliseClient.generateKeyName(
          screenName,
          groupName,
          layer.name
        ),
        platforms: ['web'],
        translations: [
          { language_iso: 'en', translation: layer.content || '' }
        ]
      };
    });

    const validatedKeys = await this.lokaliseClient.validateKeys(keys);
    const existingCount = validatedKeys.filter(k => k.exists).length;
    const duplicateCount = validatedKeys.filter(k => k.isDuplicate).length;

    console.log(`  Total keys: ${keys.length}`);
    console.log(`  Existing keys to link: ${existingCount}`);
    console.log(`  Duplicate keys: ${duplicateCount}`);

    await this.lokaliseClient.createKeys(keys);
    console.log(`✓ Created ${keys.length} keys in Lokalise`);

    console.log('\n🎫 Step 6: Creating JIRA ticket...');
    const description = this.jiraClient.generateTicketDescription(
      keys.map(k => ({ name: k.key_name, text: k.translations[0].translation })),
      `https://app.lokalise.com/project/${process.env.LOKALISE_PROJECT_ID}`,
      `https://figma.com/file/${fileKey}`,
      screenName
    );

    const ticket = await this.jiraClient.createIssue(
      projectKey,
      `Implement translations for ${screenName}`,
      description,
      epicKey
    );

    console.log(`\n✨ Success! JIRA ticket created: ${ticket.key}`);
    console.log(`View at: ${process.env.JIRA_BASE_URL}/browse/${ticket.key}`);

    return {
      layers: updatedLayers.length,
      keys: keys.length,
      score,
      suggestions: suggestions.length,
      ticket: ticket.key
    };
  }
}

// CLI usage
if (require.main === module) {
  const [fileKey, screenName, projectKey, epicKey] = process.argv.slice(2);

  if (!fileKey || !screenName || !projectKey) {
    console.log('Usage: node src/index.js <figma-file-key> <screen-name> <jira-project-key> [epic-key]');
    console.log('');
    console.log('Example:');
    console.log('  node src/index.js abc123def456 "CashISA" MOBILE MOBILE-1234');
    process.exit(1);
  }

  const workflow = new WorkflowOrchestrator();
  workflow.run(fileKey, screenName, projectKey, epicKey)
    .then(() => process.exit(0))
    .catch(error => {
      console.error('\n❌ Error:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}

module.exports = WorkflowOrchestrator;
