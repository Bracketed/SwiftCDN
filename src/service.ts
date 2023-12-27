import express from 'express';
import cors from 'cors';
import compression from 'compression';
import upload from 'express-fileupload';
import { container } from '@sapphire/pieces';

import get from './methods/get.js';
import post from './methods/post.js';
import put from './methods/put.js';

function initialize(Application_Port: string, Upload_Limit: number) {
	container.server.use(express.json());
	container.server.use(compression());
	container.server.use(
		upload({
			limits: {
				fileSize: Upload_Limit,
			},
			abortOnLimit: true,
			preserveExtension: true,
		})
	);
	container.server.use(
		cors({
			origin: '*',
			optionsSuccessStatus: 200,
		})
	);

	container.server.use('/', get);
	container.server.use('/', post);
	container.server.use('/', put);

	container.logger.info(`Express Server: Now listening on port: ${Application_Port}`);
	container.server.listen(Application_Port, () => container.logger.info(`Application started, awaiting requests!`));
}

export { initialize };
