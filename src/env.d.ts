// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
/// <reference types="vite/client" />
/// <reference types="../vendor/integration/types.d.ts" />

interface Window {
  /** Present only when analytics.vendors.googleAnalytics.requireConsent is true. Defined
   *  by src/components/common/Analytics.astro; consumed by a client-layer consent banner. */
  awAnalytics?: {
    grant: () => void;
    deny: () => void;
    status: () => 'granted' | 'denied' | 'unset';
  };
}
