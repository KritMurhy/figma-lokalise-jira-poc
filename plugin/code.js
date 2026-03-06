// Figma Plugin Code (runs in Figma's sandbox)

// Show the plugin UI
figma.showUI(__html__, {
  width: 400,
  height: 600,
  themeColors: true
});

// Helper functions
function isGenericName(name) {
  const genericPatterns = [
    /^Frame\s*\d+$/,
    /^Text$/i,
    /^Group\s*\d+$/,
    /^Rectangle\s*\d+$/,
    /^Component\s*\d+$/
  ];
  return genericPatterns.some(pattern => pattern.test(name));
}

function suggestSemanticName(node) {
  // For text nodes, use content if short enough
  if (node.type === 'TEXT' && node.characters && node.characters.length < 30) {
    return node.characters.replace(/[^a-zA-Z0-9]/g, '');
  }
  return 'UnnamedLayer';
}

function getNodePath(node) {
  const path = [];
  let current = node;
  while (current && current.parent) {
    path.unshift(current.name);
    current = current.parent;
    if (current.type === 'PAGE') break;
  }
  return path.join(' / ');
}

function scanLayers(node = figma.currentPage) {
  const layers = [];

  function traverse(n) {
    // Only process text nodes
    if (n.type === 'TEXT') {
      layers.push({
        id: n.id,
        name: n.name,
        path: getNodePath(n),
        content: n.characters,
        isGeneric: isGenericName(n.name)
      });
    }

    // Traverse children
    if ('children' in n) {
      for (const child of n.children) {
        traverse(child);
      }
    }
  }

  traverse(node);
  return layers;
}

function calculateScore(layers) {
  if (layers.length === 0) return 10;
  const genericCount = layers.filter(l => l.isGeneric).length;
  return Math.max(0, 10 - (genericCount / layers.length) * 10);
}

// Handle messages from UI
figma.ui.onmessage = async (msg) => {
  try {
    switch (msg.type) {
      case 'scan-file':
        const layers = scanLayers();
        const score = calculateScore(layers);

        const suggestions = layers
          .filter(layer => layer.isGeneric)
          .map(layer => ({
            id: layer.id,
            oldName: layer.name,
            newName: suggestSemanticName(figma.getNodeById(layer.id)),
            path: layer.path,
            content: layer.content
          }));

        figma.ui.postMessage({
          type: 'scan-complete',
          data: {
            totalLayers: layers.length,
            score: score.toFixed(1),
            suggestions,
            layers
          }
        });
        break;

      case 'apply-renames':
        const { renames } = msg;
        const results = [];

        for (const rename of renames) {
          const node = figma.getNodeById(rename.id);
          if (node) {
            node.name = rename.newName;
            results.push({ id: rename.id, success: true, newName: rename.newName });
          } else {
            results.push({ id: rename.id, success: false, error: 'Node not found' });
          }
        }

        figma.ui.postMessage({
          type: 'rename-complete',
          data: { results }
        });
        break;

      case 'get-updated-layers':
        const updatedLayers = scanLayers();
        figma.ui.postMessage({
          type: 'updated-layers',
          data: { layers: updatedLayers }
        });
        break;

      case 'export-complete':
        // Show notification
        figma.notify('✨ Export complete! JIRA ticket created.');
        break;

      case 'close-plugin':
        figma.closePlugin();
        break;

      case 'notify':
        figma.notify(msg.message);
        break;

      default:
        console.log('Unknown message type:', msg.type);
    }
  } catch (error) {
    figma.ui.postMessage({
      type: 'error',
      data: { message: error.message }
    });
  }
};
