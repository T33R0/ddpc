const fs = require('fs');
const data = JSON.parse(fs.readFileSync('openapi.json', 'utf8'));

const targetTables = [
  'maintenance_log', 'service_intervals', 'service_categories', 'service_items', 'job_plans', 'job_steps',
  'jobs', 'job_tasks', 'inventory', 'job_parts', 'master_parts'
];

let schemas = '';
for (const table of targetTables) {
  const schema = data.definitions?.[table];
  if (schema) {
    schemas += `\n--- TABLE: ${table} ---\n`;
    for (const [prop, details] of Object.entries(schema.properties || {})) {
      schemas += `${prop}: ${details.type} ${details.format ? '(' + details.format + ')' : ''} ${details.description ? '- ' + details.description : ''}\n`;
    }
  } else {
    schemas += `\n--- TABLE: ${table} NOT FOUND ---\n`;
  }
}
fs.writeFileSync('schemas_extracted.txt', schemas);
