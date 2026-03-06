require('dotenv').config();
const axios = require('axios');

const FIGMA_API = 'https://api.figma.com/v1';

class FigmaRenamer {
  constructor(accessToken) {
    this.token = accessToken;
    this.headers = { 'X-Figma-Token': this.token };
  }

  async renameNode(fileKey, nodeId, newName) {
    try {
      await axios.post(
        `${FIGMA_API}/files/${fileKey}/nodes/${nodeId}`,
        { name: newName },
        { headers: this.headers }
      );
      return { success: true, nodeId, newName };
    } catch (error) {
      return { success: false, nodeId, error: error.message };
    }
  }

  async batchRename(fileKey, renames) {
    const results = [];
    for (const rename of renames) {
      const result = await this.renameNode(fileKey, rename.nodeId, rename.newName);
      results.push(result);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return results;
  }
}

module.exports = FigmaRenamer;
