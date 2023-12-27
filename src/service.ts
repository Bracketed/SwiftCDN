import { container } from '@sapphire/pieces';

import express from 'express';
import upload from 'express-fileupload';
import compression from 'compression';
import cors from 'cors';

import all from './methods/all.js';
import get from './methods/get.js';
import post from './methods/post.js';
import put from './methods/put.js';

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

	container.server.use('/', all);
	container.server.use('/', get);
	container.server.use('/', post);
	container.server.use('/', put);

	container.server.listen(Application_Port, () => {
		container.logger.info(`Express Server: Now listening on port: ${Application_Port}`);
		container.logger.info(`Application started, awaiting requests!`);
		container.logger.info();
	});
}

export { initialize };
