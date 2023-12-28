import { container } from '@sapphire/pieces';

import express, { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import upload from 'express-fileupload';
import compression from 'compression';
import cors from 'cors';

import get from './methods/get.js';
import put from './methods/put.js';

import version from './utilities/version.js';
import auth from './utilities/auth.js';

function initialize(Application_Port: string, Upload_Limit: number) {
	const ExpressUploadOptions: upload.Options = {
		limits: {
			fileSize: Upload_Limit,
		},
		abortOnLimit: true,
		preserveExtension: true,
	};

	const CorsOptions: cors.CorsOptions = {
		origin: '*',
		optionsSuccessStatus: 200,
	};

	container.server.use(express.json());
	container.server.use(compression());
	container.server.use(upload(ExpressUploadOptions));
	container.server.use(cors(CorsOptions));

	container.server.use('/', get, (d) => container.logger.debug(String(d)));
	container.server.use('/upload', put, (d) => container.logger.debug(String(d)));

	container.server.all('/', async (_request: ExpressRequest, response: ExpressResponse) => {
		const couchdetails = await container.client
			.request({
				method: 'GET',
				path: '/',
				headers: {
					Authorization: auth(process.env.BACKEND_USERNAME, process.env.BACKEND_PASSWORD),
				},
			})
			.then((d) => {
				if (d.statusCode === 200) return d.body;
				return false;
			})
			.catch(() => false);

		if (typeof couchdetails === 'boolean') return response.status(404).json({});

		const body = (await couchdetails.json()) as any;

		return response.status(200).json({
			'SwiftCDN-Version': version,
			'CouchDB-Version': body.version,
		});
	});

	container.server.all('/all', async (_request: ExpressRequest, response: ExpressResponse) => {
		const couchdetails = await container.client
			.request({
				method: 'GET',
				path: '/content/_all_docs',
				headers: {
					Authorization: auth(process.env.BACKEND_USERNAME, process.env.BACKEND_PASSWORD),
				},
			})
			.then((d) => {
				if (d.statusCode === 200) return d.body;
				return false;
			})
			.catch(() => false);

		if (typeof couchdetails === 'boolean') return response.status(404).json({});

		const body = (await couchdetails.json()) as any;

		return response.status(200).json(body.rows);
	});

	container.server.listen(Application_Port, () => {
		container.logger.info(`Express Server: Now listening on port: ${Application_Port}`);
		container.logger.info(`Application started, awaiting requests!`);
		container.logger.info();
	});
}

export { initialize };
