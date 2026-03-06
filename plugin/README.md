# Figma Plugin: Lokalise Export Automation

This Figma plugin automates the design-to-dev handoff workflow.

## Setup Instructions

### 1. Start the Backend API Server

The plugin needs a backend server running to communicate with Lokalise and JIRA.

```bash
cd ~/projects/figma-lokalise-jira-poc/plugin
node server.js
```

You should see:
```
🚀 Plugin backend API running on http://localhost:3000
Ready to receive export requests from Figma plugin
```

**Keep this terminal window open while using the plugin.**

---

### 2. Load the Plugin into Figma

#### Option A: Load from File System (Development)

1. Open Figma Desktop App
2. Go to **Menu** → **Plugins** → **Development** → **Import plugin from manifest...**
3. Navigate to: `~/projects/figma-lokalise-jira-poc/plugin/`
4. Select `manifest.json`
5. Click **Open**

The plugin is now loaded!

#### Option B: Quick Access

Once loaded, you can run it from:
- **Menu** → **Plugins** → **Development** → **Lokalise Export Automation**

Or use the quick run shortcut:
- Mac: `Cmd + /` then type "Lokalise"
- Windows: `Ctrl + /` then type "Lokalise"

---

## Using the Plugin

### Step 1: Open a Figma File

Open the Figma file you want to export (e.g., your Perks screen).

### Step 2: Run the Plugin

**Menu** → **Plugins** → **Development** → **Lokalise Export Automation**

### Step 3: Configure Export

The plugin UI will appear with 3 fields:

1. **Screen Name** - Name for this screen (e.g., "Perks", "CashISA")
2. **JIRA Project Key** - Your JIRA project (e.g., "PLAT", "MOBILE")
3. **Epic Key** (Optional) - Link to epic (e.g., "PLAT-1917")

Or check "No epic" to create a standalone ticket assigned to you.

### Step 4: Review Suggestions

The plugin will:
- Scan all text layers in the current page
- Identify poorly named layers (e.g., "Text", "Frame 123")
- Suggest semantic names based on content

Review the suggestions and check/uncheck which ones to apply.

### Step 5: Validate

After renaming, the plugin shows:
- Validation results
- Preview of all translation keys to be exported
- Any warnings (duplicates, generic names)

### Step 6: Export

Click "Export to Lokalise" to:
- Create all translation keys in Lokalise
- Auto-generate JIRA ticket with:
  - Translation keys table
  - Lokalise links
  - Implementation checklist

### Step 7: Success!

The plugin shows:
- Number of keys exported
- Link to JIRA ticket
- Link to Lokalise project

Click "Open JIRA Ticket" to view the ticket immediately.

---

## Workflow Summary

```
1. Enter screen details + epic (optional)
   ↓
2. Plugin scans Figma layers
   ↓
3. Review rename suggestions
   ↓
4. Apply selected renames
   ↓
5. Validate keys
   ↓
6. Export to Lokalise
   ↓
7. Create JIRA ticket
   ↓
8. Success! View ticket
```

---

## Troubleshooting

### "Export failed" Error

**Cause:** Backend server not running or API credentials invalid

**Fix:**
1. Check backend server is running: `node server.js`
2. Verify `.env` file has correct API tokens
3. Check console for error messages

### "No layers found"

**Cause:** Current page has no text layers

**Fix:** Switch to a page with text content

### Duplicate Keys Warning

**Cause:** Multiple layers have the same name

**Fix:**
- Review the duplicate layers in validation screen
- Manually rename layers in Figma to make them unique
- Re-run the plugin

### JIRA Ticket Creation Failed

**Cause:** Epic key doesn't exist or is in different project

**Fix:**
- Verify epic key is correct (e.g., "PLAT-1917")
- Ensure epic is in the same project as your Project Key
- Or uncheck "No epic" to create standalone ticket

---

## Development Mode

The plugin is currently in development mode, which means:
- Only visible to you in **Plugins → Development**
- Changes to code require reloading plugin
- Not published to Figma Community

### Reloading After Code Changes

If you modify `code.js` or `ui.html`:

1. In Figma: **Menu** → **Plugins** → **Development** → **Reload plugin**
2. Or close and re-run the plugin

---

## File Structure

```
plugin/
├── manifest.json    # Plugin configuration
├── code.js          # Main plugin code (runs in Figma sandbox)
├── ui.html          # Plugin UI (6 screens)
├── server.js        # Backend API for Lokalise/JIRA
└── README.md        # This file
```

---

## Next Steps

Once the POC is successful, you can:

1. **Publish the plugin** (Figma Community or private org)
2. **Add more features:**
   - Character limit validation
   - Screenshot upload to Lokalise
   - Batch process multiple screens
   - Translation status tracking

3. **Automate further:**
   - Webhook integration
   - Auto-sync on design changes
   - CI/CD integration

---

## Support

For issues or questions:
- Check the main README: `../README.md`
- Review the Notion doc: [Full Analysis](https://www.notion.so/plum/Lokalise-Plugin-vs-Claude-Code-Automation-Effort-vs-Benefit-318aa7b9da328135a10cdd7e87909a9f)
- View workflow diagram: [FigJam](https://www.figma.com/online-whiteboard/create-diagram/5c67d214-2db0-4cb2-9c87-b14cb43f5a92)
