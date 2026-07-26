#!/usr/bin/env node
/** Quick Level 3 local verify: run vitest suite. */
import { spawnSync } from 'node:child_process';

const result = spawnSync('npm', ['test'], { stdio: 'inherit', shell: true });
process.exit(result.status ?? 1);
