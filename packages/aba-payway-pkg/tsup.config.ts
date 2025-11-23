import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/PaywayClient.ts', 'src/utils/security.ts'], // Your main files
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['next', 'react'], // Don't bundle Next.js/React
});