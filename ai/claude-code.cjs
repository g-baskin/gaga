'use strict';
// Uses the Claude Code app already installed and signed in on this Mac ("claude -p").
// Storyloom never reads or copies Claude's login: it runs the official program, which uses its own sign-in.
// Every tool, setting file, MCP server, and slash command is switched off, and it runs in an empty folder,
// so it can only answer with text.
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const MAX_OUTPUT = 5_000_000;

async function isExecutable(file) {
  try {
    const stat = await fs.stat(file);
    if (!stat.isFile()) return false;
    await fs.access(file, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

// Apps opened from the Dock get a short PATH, so also look where Claude Code's installers put it.
async function candidates(home) {
  const list = [];
  for (const dir of (process.env.PATH || '').split(path.delimiter)) if (dir) list.push(path.join(dir, 'claude'));
  list.push(path.join(home, '.local/bin/claude'), path.join(home, '.claude/local/claude'), '/opt/homebrew/bin/claude', '/usr/local/bin/claude');
  try {
    const versions = (await fs.readdir(path.join(home, '.nvm/versions/node'))).sort().reverse();
    for (const v of versions) list.push(path.join(home, '.nvm/versions/node', v, 'bin/claude'));
  } catch { /* no nvm */ }
  return [...new Set(list)];
}

function createClaudeCode({ getPath, home = os.homedir(), timeout = 300000 }) {
  async function locate() {
    const chosen = (await getPath()) || '';
    if (chosen) {
      // Settings already insist on this; checked again here because this is where the program is run.
      if (!path.isAbsolute(chosen) || path.basename(chosen) !== 'claude' || !(await isExecutable(chosen))) throw new Error('The Claude Code location in Account → AI services isn’t a program on this Mac');
      return chosen;
    }
    for (const file of await candidates(home)) if (await isExecutable(file)) return file;
    throw new Error('Claude Code isn’t installed on this Mac. Install it from claude.com/claude-code, then sign in by running “claude” in Terminal.');
  }

  // A small, fixed environment: no API keys from the shell, so Claude Code uses its own sign-in.
  function environment(program) {
    const keep = ['HOME', 'USER', 'LOGNAME', 'LANG', 'LC_ALL', 'TMPDIR', 'CLAUDE_CONFIG_DIR'];
    const env = {};
    for (const name of keep) if (process.env[name]) env[name] = process.env[name];
    env.HOME ||= home;
    env.PATH = [path.dirname(program), path.dirname(process.execPath), '/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin'].join(':');
    return env;
  }

  function run(program, args, { input = '', cwd, limit = timeout } = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(program, args, { cwd, env: environment(program), stdio: ['pipe', 'pipe', 'pipe'] });
      let out = '';
      let err = '';
      let size = 0;
      const timer = setTimeout(() => { child.kill('SIGTERM'); reject(new Error('Claude Code took too long to answer')); }, limit);
      child.stdout.on('data', (d) => {
        size += d.length;
        if (size > MAX_OUTPUT) { child.kill('SIGTERM'); reject(new Error('Claude Code’s answer was too large')); return; }
        out += d;
      });
      child.stderr.on('data', (d) => { if (err.length < 20000) err += d; });
      child.on('error', (error) => { clearTimeout(timer); reject(new Error(`Could not start Claude Code (${error.code || error.message})`)); });
      child.on('close', (code) => { clearTimeout(timer); resolve({ code, out, err }); });
      child.stdin.on('error', () => {}); // the program may exit before reading everything
      child.stdin.end(input);
    });
  }

  async function status() {
    let program;
    try { program = await locate(); } catch (error) { return { installed: false, signedIn: false, message: error.message }; }
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'storyloom-claude-'));
    try {
      const version = await run(program, ['--version'], { cwd, limit: 30000 }).catch(() => null);
      const auth = await run(program, ['auth', 'status'], { cwd, limit: 30000 }).catch(() => null);
      let info = {};
      try { info = JSON.parse(auth?.out || '{}'); } catch { /* older versions print text */ }
      return {
        installed: true, path: program,
        version: (version?.out || '').trim().split(/\s+/)[0] || '',
        signedIn: info.loggedIn === true,
        method: info.authMethod === 'claude.ai' ? 'subscription' : info.authMethod ? 'api-key' : '',
      };
    } finally {
      await fs.rm(cwd, { recursive: true, force: true });
    }
  }

  async function ask({ system, user, model }) {
    const program = await locate();
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'storyloom-claude-'));
    try {
      const args = [
        '-p', '--output-format', 'json', '--no-session-persistence',
        '--tools', '', '--setting-sources', '', '--strict-mcp-config', '--disable-slash-commands',
        '--system-prompt', system,
        ...(model ? ['--model', model] : []),
      ];
      const { code, out, err } = await run(program, args, { input: user, cwd });
      let result;
      try { result = JSON.parse(out); } catch {
        if (/log ?in|sign ?in|authenticat|\/login/i.test(`${out} ${err}`)) throw new Error('Claude Code isn’t signed in. Open Terminal, run “claude”, and sign in.');
        throw new Error(`Claude Code didn’t answer (exit ${code})`);
      }
      if (result.is_error || typeof result.result !== 'string') {
        const text = String(result.result || result.api_error_status || '').slice(0, 300);
        if (/limit|quota|usage/i.test(text)) throw new Error('You’ve reached your Claude plan’s usage limit for now — try again later.');
        if (/log ?in|authenticat|invalid api key/i.test(text)) throw new Error('Claude Code isn’t signed in. Open Terminal, run “claude”, and sign in.');
        throw new Error(`Claude Code returned an error${text ? `: ${text}` : ''}`);
      }
      return { content: result.result, model: Object.keys(result.modelUsage || {})[0] || model || '' };
    } finally {
      await fs.rm(cwd, { recursive: true, force: true });
    }
  }

  return { status, ask, locate };
}

module.exports = { createClaudeCode };
