require('dotenv').config();
const axios = require('axios');

class JiraClient {
  constructor(baseUrl, email, apiToken) {
    this.baseUrl = baseUrl;
    this.auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
    this.headers = {
      'Authorization': `Basic ${this.auth}`,
      'Content-Type': 'application/json'
    };
  }

  async createIssue(project, summary, description, epicKey = null, assignee = null) {
    const issue = {
      fields: {
        project: { key: project },
        summary,
        description: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: description }]
            }
          ]
        },
        issuetype: { name: 'Task' },
        labels: ['i18n', 'translations', 'lokalise']
      }
    };

    if (epicKey) {
      issue.fields['customfield_10014'] = epicKey;
    }

    if (assignee) {
      issue.fields.assignee = { id: assignee };
    }

    const response = await axios.post(
      `${this.baseUrl}/rest/api/3/issue`,
      issue,
      { headers: this.headers }
    );

    return response.data;
  }

  async searchEpics(projectKey) {
    const jql = `project = ${projectKey} AND type = Epic ORDER BY updated DESC`;
    const response = await axios.get(
      `${this.baseUrl}/rest/api/3/search`,
      {
        params: { jql, maxResults: 10 },
        headers: this.headers
      }
    );
    return response.data.issues;
  }

  generateTicketDescription(keys, lokaliseProjectUrl, figmaUrl, screenName) {
    let desc = `Translation Implementation Required\n\n`;
    desc += `Figma Screen: ${screenName}\n`;
    desc += `Figma URL: ${figmaUrl}\n`;
    desc += `Lokalise Project: ${lokaliseProjectUrl}\n\n`;
    desc += `Translation Keys\n\n`;
    desc += `Total Keys: ${keys.length}\n\n`;

    keys.forEach(key => {
      const keyUrl = `${lokaliseProjectUrl}/editor`;
      desc += `• ${key.name} - "${key.text}" (${keyUrl})\n`;
    });

    desc += `\n\nImplementation Checklist\n\n`;
    desc += `☐ Review all translation keys in Lokalise\n`;
    desc += `☐ Verify character limits match UI constraints\n`;
    desc += `☐ Implement keys in codebase\n`;
    desc += `☐ Test with EN locale\n`;
    desc += `☐ Test with longest locale for UI overflow\n`;
    desc += `☐ PR review and merge\n`;

    return desc;
  }
}

module.exports = JiraClient;
