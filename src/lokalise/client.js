require('dotenv').config();
const axios = require('axios');

const LOKALISE_API = 'https://api.lokalise.com/api2';

class LokaliseClient {
  constructor(apiToken, projectId) {
    this.token = apiToken;
    this.projectId = projectId;
    this.headers = { 'X-Api-Token': this.token };
  }

  async getProjectLanguages() {
    const response = await axios.get(
      `${LOKALISE_API}/projects/${this.projectId}/languages`,
      { headers: this.headers }
    );
    return response.data.languages;
  }

  async createKeys(keys) {
    // Create keys without translations first (safer approach)
    // Translations can be added via Lokalise UI or updated later
    const transformedKeys = keys.map(key => ({
      key_name: key.key_name,
      platforms: ['web'],
      description: key.text || ''
    }));

    console.log('Creating', transformedKeys.length, 'keys without initial translations');
    console.log('Sample key:', JSON.stringify(transformedKeys[0], null, 2));

    const response = await axios.post(
      `${LOKALISE_API}/projects/${this.projectId}/keys`,
      { keys: transformedKeys },
      { headers: this.headers }
    );
    return response.data;
  }

  async getExistingKeys() {
    const response = await axios.get(
      `${LOKALISE_API}/projects/${this.projectId}/keys`,
      { headers: this.headers }
    );
    return response.data.keys;
  }

  async uploadScreenshot(keyIds, base64Image, title = 'Screenshot') {
    // Lokalise expects base64 with data URI prefix
    const imageData = base64Image.startsWith('data:')
      ? base64Image
      : `data:image/png;base64,${base64Image}`;

    // Upload screenshot and link to keys
    const response = await axios.post(
      `${LOKALISE_API}/projects/${this.projectId}/screenshots`,
      {
        screenshots: [{
          data: imageData,
          title: title,
          key_ids: keyIds,
          tags: ['figma-export']
        }]
      },
      { headers: this.headers }
    );
    return response.data;
  }

  async bulkUploadScreenshots(screenshots) {
    const results = [];
    for (const screenshot of screenshots) {
      try {
        const result = await this.uploadScreenshot(
          screenshot.keyIds,
          screenshot.image,
          screenshot.title
        );
        results.push({ success: true, ...result });
      } catch (error) {
        console.error('Screenshot upload failed:', error.message);
        if (error.response) {
          console.error('Screenshot error details:', JSON.stringify(error.response.data, null, 2));
        }
        results.push({ success: false, error: error.message });
      }
    }
    return results;
  }

  generateKeyName(screenName, groupName, elementName) {
    // Clean up names to ensure valid key format
    const clean = (str) => str.replace(/[^a-zA-Z0-9]/g, '');
    return `${clean(screenName)}_${clean(groupName)}_${clean(elementName)}`;
  }

  async validateKeys(keys) {
    const existing = await this.getExistingKeys();
    const existingNames = existing.map(k => k.key_name.web);

    return keys.map(key => ({
      ...key,
      exists: existingNames.includes(key.key_name),
      isDuplicate: keys.filter(k => k.key_name === key.key_name).length > 1
    }));
  }
}

module.exports = LokaliseClient;
