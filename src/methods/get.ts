import auth from '../utilities/auth.js';
import { container } from '@sapphire/pieces';
import express, { Request as ExpressRequest, Response as ExpressResponse } from 'express';

const router = express.Router();

router.get('/:file/download', async (request: ExpressRequest, response: ExpressResponse) => {
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

router.get('/:file/info', async (request: ExpressRequest, response: ExpressResponse) => {
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

router.get('/:file', async (request: ExpressRequest, response: ExpressResponse) => {
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
		case 'application': {
			response.setHeader('Content-Disposition', `attachment; filename="${body.name}"`);
			return response.status(200).send(file);
		}
		case 'audio': {
			const audio = `<video controls="" autoplay="" style="height: 40px; width: 66%;"> <source src="data:${
				body.name
			};base64,${file.toString('base64')}" type="${
				body.mime
			}"> Your browser does not support the video tag. </video>`;

			const css =
				':root { background-color: black; height: 100%; -moz-user-focus: ignore; } video { position: absolute; inset: 0; margin: auto; max-width: 100%; max-height: 100%; user-select: none; -moz-user-focus: normal; } video:focus { outline-style: none; } ';

			const html = `<html><head><meta name="viewport" content="width=device-width; height=device-height;"><style>${css}</style><title>${body.name}</title></head><body>${audio}</body></html>`;

			return response.status(200).send(html);
		}
		case 'video': {
			const video = `<video controls="" autoplay=""> <source src="data:${body.name};base64,${file.toString(
				'base64'
			)}" type="${body.mime}"> Your browser does not support the video tag. </video>`;

			const css =
				':root { background-color: black; height: 100%; -moz-user-focus: ignore; } video { position: absolute; inset: 0; margin: auto; max-width: 100%; max-height: 100%; user-select: none; -moz-user-focus: normal; } video:focus { outline-style: none; } ';

			const html = `<html><head><meta name="viewport" content="width=device-width; height=device-height;"><style>${css}</style><title>${body.name}</title></head><body>${video}</body></html>`;

			return response.status(200).send(html);
		}
		case 'text': {
			const text = file.toString('utf-8');
			const textcss =
				'pre { white-space: pre-wrap; word-wrap: break-word; -moz-control-character-visibility: visible; } .nowrap pre { white-space: pre; } html:not([dir]) pre { unicode-bidi: plaintext; } @-moz-document unobservable-document() { :root { color-scheme: light dark; } } @media (width: 0) or (height: 0) { :root { display: none; } }';
			const html = `<html><head><style>${textcss}</style><title>${body.name}</title></head><body><pre>${text}</pre></body></html>`;

			return response.status(200).send(html);
		}
		case 'image': {
			const img = `<img src="data:${body.mime};base64,${file.toString('base64')}" alt="${
				body.name
			}" class="transparent">`;
			const css =
				'body { margin: 0; } @media not print { .fullZoomOut { cursor: zoom-out; } .fullZoomIn { cursor: zoom-in; } .shrinkToFit { cursor: zoom-in; } .overflowingVertical, .overflowingHorizontalOnly { cursor: zoom-out; } } .isInObjectOrEmbed { width: 100%; height: 100vh; } img { display: block; } ';
			const html = `<html><head><meta name="viewport" content="width=device-width; height=device-height;"><style>${css}</style><title>${body.name}</title></head><body>${img}</body></html>`;

			return response.status(200).send(html);
		}
		default: {
			response.setHeader('Content-Disposition', `attachment; filename="${body.name}"`);
			return response.status(200).send(file);
		}
	}
});

export default router;
