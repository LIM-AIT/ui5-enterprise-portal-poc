import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
export default defineConfig({ root:resolve("non-sap/react-procurement"), plugins:[react()], base:"/non-sap/react-procurement/", build:{outDir:resolve("non-sap/react-procurement/dist"),emptyOutDir:true} });
