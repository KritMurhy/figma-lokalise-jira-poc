# Figma → Lokalise → JIRA POC

Automated workflow for design-to-dev handoff with translation management.

**Expected Impact:** 80-85% time reduction (45 min → 7-9 min per screen)

## Features

- 🔍 Scans Figma files for text layers
- 💡 Suggests semantic layer names for poorly named layers
- ✏️ Auto-renames layers with designer approval
- ✅ Validates naming conventions and detects duplicates
- 📤 Exports translation keys to Lokalise
- 🎫 Auto-creates JIRA tickets with implementation context

## Setup

### 1. Install Node.js

If you don't have Node.js installed:
```bash
brew install node
```

### 2. Install Dependencies

```bash
cd ~/projects/figma-lokalise-jira-poc
npm install
```

### 3. Configure API Tokens

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and add your API tokens:

**Get Figma Token:**
1. Go to https://www.figma.com/settings
2. Scroll to "Personal access tokens"
3. Click "Generate new token"
4. Copy to `.env` file

**Get Lokalise Token:**
1. Go to https://app.lokalise.com/profile
2. Click "API tokens" tab
3. Click "Generate new token"
4. Select "Read/Write" permissions
5. Copy to `.env` file

**Get Lokalise Project ID:**
1. Open your Lokalise project
2. Copy the project ID from the URL: `app.lokalise.com/project/{PROJECT_ID}`

**Get JIRA Token:**
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Copy to `.env` file

## Usage

### Option 1: Figma Plugin (Recommended for POC)

The full POC includes a Figma plugin with visual UI that runs inside Figma.

**See detailed instructions:** [plugin/README.md](plugin/README.md)

**Quick Start:**
1. Start the backend server:
   ```bash
   cd ~/projects/figma-lokalise-jira-poc/plugin
   node server.js
   ```

2. Load plugin in Figma:
   - **Menu** → **Plugins** → **Development** → **Import plugin from manifest**
   - Select: `~/projects/figma-lokalise-jira-poc/plugin/manifest.json`

3. Run the plugin on your Figma file
4. Follow the 6-screen workflow

### Option 2: Command Line

Run the workflow from command line:

```bash
node src/index.js <figma-file-key> <screen-name> <jira-project-key> [epic-key]
```

### Extract Figma File Key

From a Figma URL like:
```
https://www.figma.com/design/abc123def456/My-Design?node-id=...
```

The file key is: `abc123def456`

### Examples

**With Epic:**
```bash
node src/index.js abc123def456 "CashISA" MOBILE MOBILE-1234
```

**Without Epic (assigns to you):**
```bash
node src/index.js abc123def456 "OnboardingScreen" MOBILE
```

## Workflow Steps

1. **Scan Figma file** - Analyzes all text layers and calculates design quality score
2. **Generate suggestions** - Identifies poorly named layers (e.g., "Frame 123", "Text")
3. **Rename layers** - Auto-applies semantic names based on content/hierarchy
4. **Validate** - Checks naming conventions, duplicates, character limits
5. **Export to Lokalise** - Creates translation keys using pattern: `[Screen]_[Group]_[Element]`
6. **Create JIRA ticket** - Auto-generates ticket with keys table, Lokalise links, checklist

## Project Structure

```
figma-lokalise-jira-poc/
├── src/
│   ├── figma/
│   │   ├── scanner.js      # Scans Figma files, detects generic names
│   │   └── renamer.js      # Renames layers via Figma API
│   ├── lokalise/
│   │   └── client.js       # Creates keys, validates, generates key names
│   ├── jira/
│   │   └── client.js       # Creates tickets, searches epics
│   ├── plugin/             # (Future: Figma plugin UI)
│   └── index.js            # Main workflow orchestrator
├── .env.example            # Template for API credentials
├── .gitignore
├── package.json
└── README.md
```

## Output Example

```
🔍 Step 1: Scanning Figma file...
Found 24 text layers (Design score: 4.7/10)

💡 Step 2: Generating suggestions...
Generated 8 suggestions

Suggestions:
  Frame 2609301 → Header
  Text → Title
  Frame 1073714120 → RateInfo

✏️  Step 3: Renaming layers...
Successfully renamed 8/8 layers

✅ Step 4: Validating...
Generic layers remaining: 0
Naming compliance: 100.0%

📤 Step 5: Exporting to Lokalise...
  Total keys: 24
  Existing keys to link: 3
  Duplicate keys: 0
✓ Created 24 keys in Lokalise

🎫 Step 6: Creating JIRA ticket...

✨ Success! JIRA ticket created: MOBILE-1567
View at: https://your-domain.atlassian.net/browse/MOBILE-1567
```

## Next Steps for Full POC

- [ ] Build Figma plugin UI ([designs here](https://www.figma.com/design/VEsiJliH5nagV6UJxPdFLs))
- [ ] Add interactive approval flow for suggestions
- [ ] Implement character limit validation
- [ ] Add screenshot upload to Lokalise
- [ ] Create metrics dashboard
- [ ] Test with 5 diverse screens

## Resources

- [Full Analysis (Notion)](https://www.notion.so/plum/Lokalise-Plugin-vs-Claude-Code-Automation-Effort-vs-Benefit-318aa7b9da328135a10cdd7e87909a9f)
- [Workflow Diagram (FigJam)](https://www.figma.com/online-whiteboard/create-diagram/5c67d214-2db0-4cb2-9c87-b14cb43f5a92)
- [Plugin UI Designs (Figma)](https://www.figma.com/design/VEsiJliH5nagV6UJxPdFLs)

## Contributing

This is a proof-of-concept. For production use, additional error handling, rate limiting, and UI improvements are needed.

## License

ISC
