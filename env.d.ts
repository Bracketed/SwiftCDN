declare global {
	namespace NodeJS {
		interface ProcessEnv {
			EXPRESS_PORT: string;
			BACKEND_USERNAME: string;
			BACKEND_PASSWORD: string;
			COUCHDB_PORT: string;
			UPLOAD_LIMIT: number | undefined;
		}
	}
}

export {};
