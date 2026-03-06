require('dotenv').config();
const axios = require('axios');

const FIGMA_API = 'https://api.figma.com/v1';

class FigmaScanner {
  constructor(accessToken) {
    this.token = accessToken;
    this.headers = { 'X-Figma-Token': this.token };
  }

  async getFile(fileKey) {
    const response = await axios.get(`${FIGMA_API}/files/${fileKey}`, {
      headers: this.headers
    });
    return response.data;
  }

  async scanLayers(fileKey, nodeId = null) {
    const file = await this.getFile(fileKey);
    const layers = [];

    const traverse = (node, path = []) => {
      const currentPath = [...path, node.name];

      // Check if layer has text content
      if (node.type === 'TEXT') {
        layers.push({
          id: node.id,
          name: node.name,
          path: currentPath.join(' / '),
          content: node.characters,
          isGeneric: this.isGenericName(node.name)
        });
      }

      // Traverse children
      if (node.children) {
        node.children.forEach(child => traverse(child, currentPath));
      }
    };

    traverse(file.document);
    return layers;
  }

  isGenericName(name) {
    const genericPatterns = [
      /^Frame\s*\d+$/,
      /^Text$/i,
      /^Group\s*\d+$/,
      /^Rectangle\s*\d+$/
    ];
    return genericPatterns.some(pattern => pattern.test(name));
  }

  suggestSemanticName(layer) {
    // Simple heuristic: use text content if short enough
    if (layer.content && layer.content.length < 30) {
      return layer.content.replace(/[^a-zA-Z0-9]/g, '');
    }
    return 'UnnamedLayer';
  }

  calculateScore(layers) {
    if (layers.length === 0) return 10;
    const genericCount = layers.filter(l => l.isGeneric).length;
    return Math.max(0, 10 - (genericCount / layers.length) * 10);
  }
}

module.exports = FigmaScanner;
