/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPBOX_TOKEN:    string;
  readonly VITE_TOKEN_ADDRESS:   string;
  readonly VITE_PROTOCOL_ADDRESS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
