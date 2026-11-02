import { loadConfig, verifyApp } from './server.mjs';

try {
  const result = await verifyApp(loadConfig());
  process.stdout.write(`Verified GitHub App ${result.id} (${result.slug}); repository Metadata: read only.\n`);
} catch {
  process.stderr.write('GitHub App authentication or permission verification failed.\n');
  process.exitCode = 1;
}
