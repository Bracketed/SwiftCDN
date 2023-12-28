import { container } from '@sapphire/pieces';

import express, { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import upload, { UploadedFile } from 'express-fileupload';
import compression from 'compression';
import cors from 'cors';

import version from './utilities/version.js';
import auth from './utilities/auth.js';
import { uuids } from './utilities/interfaces.js';

enum STATUSES {
	OK = '200-OK',
	ERROR = '422-ERROR',
}

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

	container.server.put('/upload', async (request: ExpressRequest, response: ExpressResponse) => {
		if (!request.files) return response.status(404).json({});

		const files = request.files.file;
		const FileArrayState = Array.isArray(files);
		const responses: Array<string> = [];

		if (FileArrayState) {
			const idRequest = await container.client
				.request({
					method: 'GET',
					path: '/_uuids',
					query: {
						count: files.length,
					},
					headers: {
						Authorization: auth(process.env.BACKEND_USERNAME, process.env.BACKEND_PASSWORD),
					},
				})
				.then((d) => {
					if (d.statusCode === 200) return d.body;
					return false;
				})
				.catch(() => false);

			if (typeof idRequest === 'boolean') return response.status(520).json({});

			const ids = (await idRequest.json()) as uuids;

			const putRequests = files.map(async (file: UploadedFile, index) => {
				const putRequest = await container.client
					.request({
						method: 'PUT',
						path: `/content/${ids.uuids[index]}`,
						headers: {
							Authorization: auth(process.env.BACKEND_USERNAME, process.env.BACKEND_PASSWORD),
						},
						body: JSON.stringify({
							buffer: file.data,
							encoding: file.encoding,
							checksum: file.md5,
							name: file.name,
							type: file.mimetype,
							mime: file.mimetype,
							uploaded: new Date().toISOString(),
						}),
					})
					.then((d) => {
						if (d.statusCode === 201) return true;
						return false;
					})
					.catch(() => false);

				if (putRequest) {
					responses.push(`${request.protocol}://${request.headers.host}/${ids.uuids[index]}`);
					container.logger.info(`${file.name} was uploaded successfully as ${ids.uuids[index]}!`);
				} else {
					container.logger.info(
						`${file.name} was not uploaded successfully, server returned error code 422.`
					);
				}
			});

			await Promise.all(putRequests);

			return response.status(200).json(responses);
		} else {
			const { statusCode, body } = await container.client.request({
				method: 'GET',
				path: '/_uuids',
				headers: {
					Authorization: auth(process.env.BACKEND_USERNAME, process.env.BACKEND_PASSWORD),
				},
			});

			if (!(statusCode === 200)) return response.status(520).json({});

			const ids = (await body.json()) as uuids;

			const putRequest = await container.client
				.request({
					method: 'PUT',
					path: `/content/${ids.uuids[0]}`,
					headers: {
						Authorization: auth(process.env.BACKEND_USERNAME, process.env.BACKEND_PASSWORD),
					},
					body: JSON.stringify({
						buffer: files.data,
						encoding: files.encoding,
						checksum: files.md5,
						name: files.name,
						type: files.mimetype.split('/')[0],
						mime: files.mimetype,
					}),
				})
				.catch(() => false)
				.then(() => true);

			if (putRequest) {
				container.logger.info(`${files.name} was uploaded successfully as ${ids.uuids[0]}!`);
				return response.status(200).json(`${request.protocol}://${request.headers.host}/${ids.uuids[0]}`);
			} else {
				container.logger.info(`${files.name} was not uploaded successfully, server returned error code 422.`);
				return response.status(422).json({ name: files.name, status: STATUSES.ERROR, uuid: ids.uuids[0] });
			}
		}
	});

	container.server.get('/:file/download', async (request: ExpressRequest, response: ExpressResponse) => {
		if (!request.params['file']) return response.status(404);

		const webFile = await container.client
			.request({
				path: `/content/${request.params['file']}`,
				method: 'GET',
				headers: { Authorization: auth(process.env.BACKEND_USERNAME, process.env.BACKEND_PASSWORD) },
			})
			.then((d) => {
				if (d.statusCode === 200) return d;
				return false;
			})
			.catch(() => false);

		if (typeof webFile === 'boolean') return response.status(404);

		const body: any = await webFile.body.json();
		const file = Buffer.from(body.buffer, body.encoding);

		response.setHeader('Content-Disposition', `attachment; filename="${body.name}"`);
		return response.status(200).send(file);
	});

	container.server.get('/:file/info', async (request: ExpressRequest, response: ExpressResponse) => {
		if (!request.params['file']) return response.status(404);

		const webFile = await container.client
			.request({
				path: `/content/${request.params['file']}`,
				method: 'GET',
				headers: { Authorization: auth(process.env.BACKEND_USERNAME, process.env.BACKEND_PASSWORD) },
			})
			.then((d) => {
				if (d.statusCode === 200) return d;
				return false;
			})
			.catch(() => false);

		if (typeof webFile === 'boolean') return response.status(404);

		const body: any = await webFile.body.json();

		return response.status(200).send(body);
	});

	container.server.get('/:file', async (request: ExpressRequest, response: ExpressResponse) => {
		if (!request.params['file']) return response.status(404);
		if (request.params['file'].startsWith('favicon')) return response.status(404);

		const webFile = await container.client
			.request({
				path: `/content/${request.params['file']}`,
				method: 'GET',
				headers: { Authorization: auth(process.env.BACKEND_USERNAME, process.env.BACKEND_PASSWORD) },
			})
			.then((d) => {
				if (d.statusCode === 200) return d;
				return false;
			})
			.catch(() => false);

		if (typeof webFile === 'boolean') return response.status(404);

		const body: any = await webFile.body.json();
		const file = Buffer.from(body.buffer, body.encoding);

		switch (body.type) {
			case 'audio': {
				response.set('Content-Type', body.mime);
				return response.status(200).end(file);
			}
			case 'video': {
				response.set('Content-Type', body.mime);
				return response.status(200).end(file);
			}
			case 'text': {
				const text = file.toString('utf-8');
				const attachmentDetails = `<meta property="twitter:card" content="summary"><meta property="twitter:title" content="Text File - ${body.name}"><meta property="og:title" content="Text File - ${body.name}"><meta property="og:description" content="Text File - ${body.name}">`;
				const html = `<html><head>${attachmentDetails}<meta name="robots" content="noindex"><title>${body.name}</title></head><body><pre>${text}</pre></body></html>`;

				return response.status(200).send(html);
			}
			case 'image': {
				response.set('Content-Type', body.mime);
				return response.status(200).end(file);
			}
			default: {
				response.setHeader('Content-Disposition', `attachment; filename="${body.name}"`);
				return response.status(200).send(file);
			}
		}
	});

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

	container.server.listen(Application_Port, () => {
		container.logger.info(`Express Server: Now listening on port: ${Application_Port}`);
		container.logger.info(`Application started, awaiting requests!`);
		container.logger.info();
	});
}

export { initialize };
