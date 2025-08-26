import js from "@eslint/js"
import globals from "globals"
import { defineConfig } from "eslint/config"

export default defineConfig([
	{
		files: ["**/*.{js,mjs,cjs}"],
		plugins: { js },
		extends: ["js/recommended"],
		languageOptions: {
			globals: globals.node
		},
		rules: {
			indent: ["error", "tab"],
			"no-mixed-spaces-and-tabs": "error",
			curly: ["error", "all"],
			quotes: ["error", "double"]
		},
		env: {
			"node": true,
			"es6": true,
			"jest": true
		}
	},
])
