// Export all tool instances
export { get_repo_structure } from './repo-structure';
export { read_file_content } from './file-reader';
export { create_issue, create_pull_request } from './github';
export { get_database_schema, get_table_details } from './database';
export { query_steward_stats } from './sensors';

// Import all tools for the unified object
import { get_repo_structure } from './repo-structure';
import { read_file_content } from './file-reader';
import { create_issue, create_pull_request } from './github';
import { get_database_schema, get_table_details } from './database';
import { query_steward_stats } from './sensors';

/**
 * Export all tools as a single object for easy import
 * Used by the Steward API route for tool registration
 */
export const stewardTools = {
  get_repo_structure,
  read_file_content,
  create_issue,
  create_pull_request,
  get_database_schema,
  get_table_details,
  query_steward_stats,
};
