/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface VisaUctpSdk {
	initialize: (args: Record<string, unknown>) => Promise<void>;
	getCards: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
	checkout: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
	initiateIdentityValidation?: (args?: Record<string, unknown>) => Promise<Record<string, unknown>>;
	unbindAppInstance?: () => Promise<void>;
}

interface Window {
	VSDK?: VisaUctpSdk;
}

interface ImportMetaEnv {
	readonly PUBLIC_VISA_UCTP_DPA_ID?: string;
	readonly PUBLIC_VISA_UCTP_CARD_BRANDS?: string;
	readonly PUBLIC_VISA_UCTP_DPA_CLIENT_ID?: string;
	readonly PUBLIC_VISA_UCTP_USE_PRODUCTION?: string;
	/** Cybersource UCTP: URL from sessions response `data.clientLibrary` */
	readonly PUBLIC_VISA_UCTP_CLIENT_LIBRARY?: string;
	/** SRI hash from `data.clientLibraryIntegrity` */
	readonly PUBLIC_VISA_UCTP_CLIENT_LIBRARY_INTEGRITY?: string;
	/** Capture context JWT for vsdk.initialize (POC only; use backend in production) */
	readonly PUBLIC_VISA_UCTP_CAPTURE_CONTEXT?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
