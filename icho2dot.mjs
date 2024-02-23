'use strict';

import fs from 'fs';

const ichoPath = './icho.json';

const json = fs.readFileSync(ichoPath, 'utf-8');
const db = JSON.parse(json);

console.log('digraph {');
console.log('\tgraph [ layout = fdp ]');
for (let i = 0; i < db.pages.length; i++) {
	const url = db.pages[i];
	const dom = url.split('/')[2];
	const enc = new TextEncoder();
	const k = enc.encode(dom);
	const h = k.reduce((c, e) => c+e&0xFF, 0) / 256;
	const v = 2 / (url.split('/').length - 4);

	console.log(`\t${i} [ href="${url}", tooltip="${url}" style="filled" fillcolor="${h} ${v} ${v}" ]`);
}
const links = Object.keys(db.links);
for (let i = 0; i < links.length; i++) {
	const redir = db.links[links[i]] === 'redirect';
	console.log(`\t${links[i]} [ color="${redir ? 'red' : 'blue'}" ]`);
}
console.log('}');
