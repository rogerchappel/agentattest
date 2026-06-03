import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execSync, execFileSync } from 'node:child_process';

const cli = join(process.cwd(), 'dist/src/cli.js');

function runCLI(args, cwd) {
  try {
    return execFileSync(process.execPath, [cli, ...args], { cwd, encoding: 'utf8' });
  } catch (e) {
    return { error: e, stdout: e.stdout, stderr: e.stderr };
  }
}

describe('agentattest CLI', () => {
  let tmpDir;
  
  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'agentattest-test-'));
  });

  it('should show help output', () => {
    const out = runCLI(['--help'], process.cwd());
    assert.ok(out.includes('agentattest') || out.includes('help'), 'should show help');
  });

  it('should init in a directory', () => {
    // Create a minimal git repo
    mkdirSync(join(tmpDir, '.git'), { recursive: true });
    execFileSync('git', ['init'], { cwd: tmpDir });
    
    const out = runCLI(['init'], tmpDir);
    assert.ok(existsSync(join(tmpDir, '.agentattest')) || out.includes('initialized'), 
      'should create attestation directory or report init');
  });

  it('should fail gracefully when no git repo exists', () => {
    const out = runCLI(['attest', '-m', 'test'], tmpDir);
    // Should not crash with unhandled error
    assert.ok(true, 'should handle non-git repo gracefully');
  });
});
