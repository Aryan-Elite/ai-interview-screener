Scan the entire codebase for any hardcoded API keys or secrets.

Look for these patterns inside .ts, .tsx, .js, .json files (skip node_modules, dist, .next):
- Strings starting with: sk-ant-, sk-, Bearer
- Variable names containing: password, secret, token, api_key, apikey

Report the exact file path and line number for anything found.
If nothing is found, confirm: "Codebase is clean — no exposed secrets found."
