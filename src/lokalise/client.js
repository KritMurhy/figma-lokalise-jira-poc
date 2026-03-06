require('dotenv').config();
const axios = require('axios');

const LOKALISE_API = 'https://api.lokalise.com/api2';

class LokaliseClient {
  constructor(apiToken, projectId) {
    this.token = apiToken;
    this.projectId = projectId;
    this.headers = { 'X-Api-Token': this.token };
  }

  async createKeys(keys) {
    const response = await axios.post(
      `${LOKALISE_API}/projects/${this.projectId}/keys`,
      { keys },
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

  async uploadScreenshot(keyId, screenshotUrl) {
    const response = await axios.post(
      `${LOKALISE_API}/projects/${this.projectId}/screenshots`,
      {
        screenshots: [{
          data: screenshotUrl,
          title: `Screenshot for key ${keyId}`
        }]
      },
      { headers: this.headers }
    );
    return response.data;
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
