import util from 'node:util';
import events from 'node:events';

class EventEmitter extends events {
	constructor() {
		super();
	}
}

util.inherits(EventEmitter, events);

export default new EventEmitter();
