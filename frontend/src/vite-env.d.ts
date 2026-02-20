/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FUNCTION_APP_URL: string;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
