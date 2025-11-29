#!/usr/bin/env zx

// SSPC cli commands
//
// Usage: `node scripts/cli.mjs <command> [options]`
// Commands:
// - `build`: Build the project
// - `deploy`: Deploy the project to servers
// - `version`: Show the current version on the server

// Build
// Usage: `node scripts/cli.mjs build [options]`
// Options:
// - `--pptr`: Build only the pptr application
// - `--queue`: Build only the queue application
// - `--all`: Build both applications (default)

// Deploy
// Usage: `node scripts/cli.mjs deploy [options]`
// Options:
// - `--pptr`: Deploy only the pptr application
// - `--queue`: Deploy only the queue application
// - `--all`: Deploy both applications (default)
// - `--server <server>`: Specify a server to deploy to, optional, if not specified, will prompt for server selection

const SERVERS = [
  { remote: "cx_vision", concurrent: 8 },
  { remote: "cx_vision2", concurrent: 14 },
]
