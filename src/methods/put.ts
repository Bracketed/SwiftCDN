import auth from '../utilities/auth.js';
import { uuids } from '../utilities/interfaces.js';
import { container } from '@sapphire/pieces';
import express, { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { UploadedFile } from 'express-fileupload';

const router = express.Router();

enum STATUSES {
	OK = '200-OK',
	ERROR = '422-ERROR',
}

router.put('/upload', async (request: ExpressRequest, response: ExpressResponse) => {
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
				container.logger.info(`${file.name} was not uploaded successfully, server returned error code 422.`);
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
			return response.status(422).json(`${request.protocol}://${request.headers.host}/${ids.uuids[0]}`);
		} else {
			container.logger.info(`${files.name} was not uploaded successfully, server returned error code 422.`);
			return response.status(422).json({ name: files.name, status: STATUSES.ERROR, uuid: ids.uuids[0] });
		}
	}
});

export default router;
