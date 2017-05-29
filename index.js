global.Promise = require("bluebird");
const superagent = require("superagent");
const cheerio = require("cheerio");
let gets = 0;

async function finish() {
	console.log(`--------------------------------\nFound word after ${gets} GET requests`);
	process.exit(0);
}

async function pageGET(url) {
	console.log(`Sending GET request to ${url}`);
	try {
		const res = await superagent.get(url);
		gets++;
		return { url, text: res.text };
	} catch(err) {
		return false;
	}
}

function getLinks(content) {
	const $ = cheerio.load(content.text); // eslint-disable-line id-length
	const links = $("a").map((i, ele) => $(ele).attr("href")).get();

	links.forEach((link, i) => {
		if(!(link.startsWith("https://") || link.startsWith("http://"))) {
			links[i] = content.url + link;
		}
	});
	return links;
}

async function startScraping(links) {
	const pages = await Promise.all(links.map(link => pageGET(link)));
	pages.filter(page => page).forEach(page => {
		if(~page.text.indexOf(word)) {
			finish();
		} else {
			startScraping(getLinks(page));
		}
	});
}

async function init() {
	if(!word) {
		console.error("No word to search for specified");
		process.exit(0);
	} else if(!start) {
		console.error("No site to start on specified");
		process.exit(0);
	} else {
		console.log(`Searching for ${word}, starting on ${start}\n--------------------------------`);
		const firstContent = await pageGET(start);
		if(!firstContent) {
			console.error("Invalid start site, could not get content");
			process.exit(0);
		} else if(~firstContent.text.indexOf(word)) {
			finish(true);
		} else {
			const links = getLinks(firstContent);
			if(!links || !links.length) {
				console.log(`--------------------------------\nStart page has no links`);
				process.exit(0);
			}
			startScraping(links);
		}
	}
}

const word = process.argv[process.argv.indexOf("--word") + 1];
const start = process.argv[process.argv.indexOf("--start") + 1];
init();
