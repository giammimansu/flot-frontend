/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_COGNITO_USER_POOL_ID: string;
  readonly VITE_COGNITO_CLIENT_ID: string;
  readonly VITE_COGNITO_DOMAIN: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
  readonly VITE_STAGE: string;
  readonly VITE_FAKE_DOOR_MODE: string;
  readonly VITE_CDN_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
