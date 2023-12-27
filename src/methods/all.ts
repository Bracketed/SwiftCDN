import version from '../utilities/version.js';
import auth from '../utilities/auth.js';
import { container } from '@sapphire/pieces';
import express, { Request as ExpressRequest, Response as ExpressResponse } from 'express';

const router = express.Router();

router.all('/', async (_request: ExpressRequest, response: ExpressResponse) => {
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

router.all('/all', async (_request: ExpressRequest, response: ExpressResponse) => {
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

export default router;
