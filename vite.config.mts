import { defineConfig } from "vite";

export default defineConfig({
	publicDir: false,
	build: {
		lib: {
			entry: "./src/extension.ts",
			formats: ["cjs"],
			fileName: "extension",
		},
		rollupOptions: {
			external: ["vscode"],
		},
		sourcemap: true,
	},
});
