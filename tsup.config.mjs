import { defineConfig } from "tsup";

export default defineConfig({
  entryPoints: ["src"],
  format: ["cjs"],
  bundle: false,
  dts: true,
});
