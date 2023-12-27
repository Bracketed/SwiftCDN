import moment from 'moment';
import EventEmitter from './events.js';
import chalk, { ChalkInstance } from 'chalk';

class Level {
	level: string;
	str: string;
	int: number;
	printStackTraces: boolean;
	colorModifier: ChalkInstance | null;
	constructor(
		level: string,
		str: string,
		int: number,
		printStackTraces: boolean,
		colorModifier: ChalkInstance | null
	) {
		this.level = level;
		this.str = str;
		this.int = int;
		this.printStackTraces = printStackTraces;
		this.colorModifier = colorModifier;
	}
}

const levels = {
	DEBUG: new Level('debug', 'DEBUG', 1000, false, null),
	INFO: new Level('info', 'INFO', 1500, false, chalk.blueBright),
	WARN: new Level('warn', 'WARNING', 2000, false, chalk.yellow),
	ERROR: new Level('error', 'ERROR', 4000, true, chalk.red),
	FATAL: new Level('fatal', 'FATAL', 5000, true, chalk.red),
};

function realLog(level: Level, message: string | undefined, source: string, levelString?: string | undefined) {
	if (level.colorModifier) {
		levelString = level.colorModifier(level.str);
	} else {
		levelString = level.str;
	}

	if (!message) message = '';

	console.log(
		chalk.blueBright(moment().format('YYYY-MM-DD HH:mm:ss.SSS')),
		chalk.greenBright('[', source, ']'),
		'-',
		levelString,
		'-',
		message
	);
	EventEmitter.emit('$' + level.level, {
		type: level,
		message: message,
		source: source,
		process: process.title,
	});
}

class Logger {
	source!: string;
	static Level: typeof Level = Level;
	static EventEmitter: typeof EventEmitter = EventEmitter;

	constructor(source: string | undefined) {
		if (!(this instanceof Logger)) {
			return new Logger(source);
		}

		if (source === undefined) {
			this.source = 'main';
		} else {
			this.source = source;
		}
	}

	debug(message?: string | undefined) {
		realLog(levels.DEBUG, message, this.source);
	}

	info(message?: string | undefined) {
		realLog(levels.INFO, message, this.source);
	}

	warn(message?: string | undefined) {
		realLog(levels.WARN, message, this.source);
	}

	error(message?: string | undefined) {
		realLog(levels.ERROR, message, this.source);
	}

	fatal(message?: string | undefined) {
		realLog(levels.FATAL, message, this.source);
	}
}

export default Logger;
