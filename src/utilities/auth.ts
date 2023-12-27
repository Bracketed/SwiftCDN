export default function (name: string, pass: string) {
	const separator = pass ? ':' : '';
	pass = pass || '';
	return 'Basic ' + Buffer.from(name + separator + pass).toString('base64');
}
