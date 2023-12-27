import { container } from '@sapphire/pieces';
import iLogger from './utilities/ilogger/index.js';
import version from './utilities/version.js';
import { execSync } from 'node:child_process';
import undici, { Client } from 'undici';
import dotenv from 'dotenv';
import { initialize } from './service.js';
import { Stopwatch } from '@sapphire/stopwatch';
import express, { Express } from 'express';
import { passwordStrength } from 'check-password-strength';
import auth from './utilities/auth.js';
import chalk from 'chalk';

declare module '@sapphire/pieces' {
	interface Container {
		logger: iLogger;
		stopwatch: Stopwatch;
		server: Express;
		client: Client;
	}
}

function getNPMVersion() {
	const version = execSync('npm -v').toString().trim();
	if (!version) return 'NOT FOUND';
	return version;
}

process.on('SIGINT', () => {
	container.logger.info();
	container.logger.warn('Application has received a SIGINT exit flag from the host machine.');
	container.logger.fatal('Exiting...');
	process.exit(143);
});

process.on('SIGTERM', () => {
	container.logger.info();
	container.logger.warn('Application has received a SIGTERM exit flag from the host machine.');
	container.logger.fatal('Exiting...');
	process.exit(143);
});

dotenv.config();
container.logger = new iLogger('SwiftCDN');
container.stopwatch = new Stopwatch();

const SwiftCDNLogo: Array<string> = [
	'  ********            **   ****   **     ******  *******   ****     **',
	' **//////            //   /**/   /**    **////**/**////** /**/**   /**',
	'/**        ***     ** ** ****** ****** **    // /**    /**/**//**  /**',
	'/*********//**  * /**/**///**/ ///**/ /**       /**    /**/** //** /**',
	'////////** /** ***/**/**  /**    /**  /**       /**    /**/**  //**/**',
	'       /** /****/****/**  /**    /**  //**    **/**    ** /**   //****',
	' ********  ***/ ///**/**  /**    //**  //****** /*******  /**    //***',
	'////////  ///    /// //   //      //    //////  ///////   //      /// ',
	'',
	'SwiftCDN a easy-to-deploy CDN made by Team Bracketed & ninjaninja140',
	`SwiftCDN Version: v${version} | Node Version: ${process.version} | NPM Version: v${getNPMVersion()}`,
	'',
	`Submit issues, error reports or features to be added at ${chalk.italic(
		'https://github.com/Bracketed/SwiftCDN/issues'
	)}!`,
	`Sponsor ninjaninja140 on github at ${chalk.italic('https://github.com/sponsors/ninjaninja140')}!`,
	`View more public projects by Team Bracketed at ${chalk.italic('https://github.com/bracketed')}!`,
];

console.clear();
SwiftCDNLogo.forEach((Fragment: string) => container.logger.info(chalk.bold(Fragment)));
container.logger.info();
container.logger.info('Initialising...');
container.logger.info();
container.logger.info('Checking ENV Values...');

if (process.env.EXPRESS_PORT) {
	container.logger.info(`ENV - Express Port: ${process.env.EXPRESS_PORT}... OK`);
} else {
	container.logger.info(`ENV - Express port: ${process.env.EXPRESS_PORT}... ERROR`);
	container.logger.error('Express Port ENV Value is not valid or readable.');
	container.logger.fatal('Exiting...');
	process.exit(143);
}

if (process.env.COUCHDB_PORT) {
	container.logger.info(`ENV - CouchDB Port: ${process.env.COUCHDB_PORT}... OK`);
} else {
	container.logger.info(`ENV - CouchDB port: ${process.env.COUCHDB_PORT}... ERROR`);
	container.logger.error('CouchDB Port ENV Value is not valid or readable.');
	container.logger.fatal('Exiting...');
	process.exit(143);
}

if (process.env.BACKEND_USERNAME) {
	container.logger.info(`ENV - CouchDB Username: ${process.env.BACKEND_USERNAME}... OK`);
} else {
	container.logger.info(`ENV - CouchDB Username: ${process.env.BACKEND_USERNAME}... ERROR`);
	container.logger.error('CouchDB Username ENV Value is not valid or readable.');
	container.logger.fatal('Exiting...');
	process.exit(143);
}

if (process.env.BACKEND_PASSWORD) {
	container.logger.info(`ENV - CouchDB Password: ${process.env.BACKEND_PASSWORD.replace(/./g, '*')}... OK`);
	container.logger.info('ENV - Testing strength of CouchDB Password...');
	container.logger.info(
		`ENV - CouchDB Password Strength is ${passwordStrength(process.env.BACKEND_PASSWORD).value.toUpperCase()}...`
	);
} else {
	container.logger.info(`ENV - CouchDB Password: ${process.env.BACKEND_PASSWORD.replace(/./g, '*')}... ERROR`);
	container.logger.error('CouchDB Password ENV Value is not valid or readable.');
	container.logger.fatal('Exiting...');
	process.exit(143);
}

container.logger.info('ENV Values checked!');
container.logger.info();
container.logger.info('Checking Backend server state...');
const couchdb_state = await undici
	.request(`http://host.docker.internal:${process.env.COUCHDB_PORT}`, {
		headers: { Authorization: auth(process.env.BACKEND_USERNAME, process.env.BACKEND_PASSWORD) },
	})
	.then((d) => {
		if (d.statusCode === 200) return true;
		return false;
	})
	.catch(() => false);

if (!couchdb_state) {
	container.logger.error('Backend server has returned error or has not started yet.');
	container.logger.fatal('Exiting...');
	process.exit(143);
}
container.logger.info('Backend server is OK');
container.client = new Client(`http://host.docker.internal:${process.env.COUCHDB_PORT}`);
container.logger.info('Updating Backend Server databases...');
const couchdb_put = await container.client
	.request({
		method: 'PUT',
		path: '/content',
		headers: { Authorization: auth(process.env.BACKEND_USERNAME, process.env.BACKEND_PASSWORD) },
	})
	.then((d) => {
		if (d.statusCode === 201) return true;
		return false;
	})
	.catch(() => false);

if (couchdb_put) {
	container.logger.info('Backend Server Updated!');
} else {
	container.logger.info('Backend Server already up to date...');
}
container.logger.info();
container.logger.info('Initialization complete, starting application...');
container.server = express();

let UploadLimit: number;
if (!process.env.UPLOAD_LIMIT) {
	UploadLimit = Infinity;
	container.logger.warn('The optional ENV Value "UPLOAD_LIMIT" has not been set, defaulting to Infinity...');
} else {
	UploadLimit = process.env.UPLOAD_LIMIT * 10000;
	container.logger.info(
		`Option ENV Value "UPLOAD_LIMIT" has been configured to ${process.env.UPLOAD_LIMIT} Megabytes.`
	);
}

initialize(process.env.EXPRESS_PORT, UploadLimit);

container.logger.info(`Started SwiftCDN in ${container.stopwatch.stop().toString()}!`);

/* cSpell:disable */
/*

                                                ..                                                  
                   ..::^^~~!7?JYYYYYYYYYYYJJJJJJJJJJJJJJJJJYYYYYYJJJ?7!!~^^:::...                   
                  ~!!!!777??JJYYYYYYYJJJJ?????777777??????JJJJYYYYYYYJJ??7777!!!~                   
                  :~~~~!!!!7777??????77777777777777777777777777??????777!!!!~~~!.                   
                  :!!!!!!!!7777????????JJJJJJJJJJJJJJJJ??????????????777!!!!!!!!.                   
                  :!~~!!!!!777?JY5PGGGBBBBBGGPPPPPPPPPPGGGGGGPP55YJ??777!!!!!~~!.                   
                  :!~~!!!!7?J5GB#&##BP5Y?!~~~~^^^^^^^^~~!7?5PGB####BPYJ77!!!!~~!.                   
                  :!~~!!!J5PB##GY7!~~!!:~5PPPP~:GG^.JBY::JJ::!~~7JPB##GP57!!!~~!.                   
                  :!~~!!!J5G&?^:!YJ:!&&~^#@?!!:^B#^:P&&7^&G:7BGG5?^^?&BPY!!!!~~!.                   
                  :!~~!!!!YP#B^:7@@??#@P:5@B5J:^BB^^BGGB5@?::^?&@P^~##G57!!!!~~!.                   
                  :!~~!!!!75P&G^:J@@PJ#@!7@G!!7^B#^!&Y~#@#^^JB#Y~::P&GP?!!!!!~~!:                   
                  :!~~!!!!!?PG&5::P@J.7@5^P5YYJ^??:!J!.?GJ~#@&J!^:5&BG?7!!!!!~~!:                   
                  :777777???5GB@7:~PY^^~^^^::::^::^:::^:^:^!7JPY:!@#GPJJJ??7777!:                   
                  :?JJY55PGGB##B~^^::::::~7~7~~~~:~~7~!~!::::::::~P####BGPP5YJ?!:                   
                  :7JJPJ!77777!:::^^:::::::::::::::::::::::::::::::~!!!!!!JGYJ!!:                   
                  :!?JPY.:.!JJY5Y7^:?55555?:::7YYJ::::?YY^:~55!~PPP5557::.YPJ?~!:                   
                  :!7JYG^::J@@55@@Y:Y@@G5P5:::G&&#!:::Y&&P^^&@7!P55G@@P::^G5J7~!:                   
                  :!!JJG?::J@@7!&@Y:Y@@7^~^::7&GY&P:::Y&&@5^&@7:::~B@P^::?GYJ!~!:                   
                  :!~?JP5:.J@@#&@G!:Y@@&#&!::G&?^B#!::Y&GG@5&@7::7&@5::::PPY?~~!:                   
                  :!~7JYG~.J@&7^P@@!Y@@7^~::7&#GG#&G:.Y&P^G@@@7:?@@J::::!B5Y7~~!:                   
                  :!~!JYGJ.Y@@??B@&~5@@Y?J?:G&Y!!?&&?.Y@G:~#@@7?@@#JJJ?:YBYJ!~~!:                   
                  :!~~?YPG:JGGGBPJ~:YGGGGGJ!P5^.::YPY^?PY::~PG77GGGGGG?:GPY?!~~!:                   
                  :!~~7Y5B7:^!^^::^^^^~^:~~::^:::^::::~::^:^::^^:^^^^::!B5Y7!~~!:                   
                  :!~~!JYGY.!PY5!7G!??YYJYY7~J?Y?JJJJYY7YJ^5JY5YYYYYP!.YB5Y!!~~!:                   
                  :!~~!?YPG:^~~~^~!~~^~~~^^^:~^~^^^^~^^^~^:~~~~~~~~^~^^BP5?!!~~!:                   
                  :!~~!7Y5B!::^^^^^^^^^^^^:::::::::::::::^^^^^^^^^~~^:?&P57!!~~!:                   
                  :!~~!!J5BY:^?PPPPPPJ5P55YYJJJJJJJ77?JJYY5PPPGGGGP?^:G#5J!!!~~!:                   
                  :!~~!!?5GB^::YBBGGB~YPJ?YJ??777?Y~^7J7Y??JJGGGBBJ^:!&G5?!!!~~!:                   
                  ^!~~!!7YP&7:?PGGGGPJYGP555YJJJJJJ77?JJYY55PPGGGPP?:Y&P5!!!!~~!:                   
                  :!~~!!!Y5#P:~~~~~~~~~^^^^^^^~!7!~^^::::^^^^^^^^^^^^##PJ!!!!~~!:                   
                  ^!~~!!!?5G#~:^^^^:::::::::!YPPPY?!~?JJ7!^:::::^^^:?@GP7!!!!~~!:                   
                  ^!~~!!!75P&J::^^^^!7!^~!!?YYYYJJJ??Y5555J!::::^^^:G&G57!!!!~~!:                   
                  ^!~~!!!!YP#G?7~~JGBG5PBG5Y?7?JJJJY555Y?7?Y7^^^^:^!&BGJ!!!!!~~!:                   
                  ^!~~!!!!JPPGBBGB#BPY555Y??Y5555YJ???J?7!JJYPPPY??5BGGY7!!!!~~!:                   
                  ^!~~!!!?YPP5GBBBBGP5YJ77?5P555YJJ7!!!7JJJJ5GGGGG5YPGP5J7!!!~~!:                   
                  ^!~~!!!??5G55PPP5YYY55J?7?J????7!!7JY5P55J7?YYYYJJGG5Y?7!!!~~!:                   
                  ^!~~!!!!!JGP?JJJJJ5BBBGPY?7!!!!77??JJJJ???????JJJ5BP??7!!!!~~!:                   
                  ^!~~!!!!!75PPGG5??5PGGGP5Y?!!!?JJJJJJJYY5555PPPPPPPJ77!!!!!~~!:                   
                  ^!~~!!!!!777?????7?JJYYYJ?7~^!777777777777777??????7?7!!!!!~~!:                   
                  ^!~~!!!!!7777?????777??7~~~~!!!!!!!7777777777??????777!!!!!~~!:                   
                  ^!~~!!!!!7777???????7?J~!7!7!!!!!!!!777777777??????777!!!!!~~!:                   
                  ^!~~!!!!!7777??????7?77!7!!!!~!!!7!!777777777??????777!!!!!~~!:                   
                  ^!~~!!!!!7777??????7777777!!!!7!7!!!777777777??????777!!!!!!!!:                   
                  :!~~!!!!7777????????7777777!!!!!!!77777777777??????777!!!!~~~!:                   
                  ^~~!!!!!777???JJJ??????77777777777777777?????JJJJJJJ??777!!!!!~                   
                  ...:::^^~~!77??JJ???????????77777777????????JJJJ??77!!~^^^:::..                   
                                        .............                                               

*/
/* cSpell:enable */
