const defaultsPath = "data/default_values.json";
const localValuesPath = "data/values.local.json";
const valuesPath = "data/values.json";

async function readJson(path) {
	const response = await fetch(path, { cache: "no-store" });
	if (!response.ok) throw new Error(`Could not load ${path}: ${response.status}`);

	const text = await response.text();
	if (!text.trim()) throw new Error(`${path} is empty`);

	return JSON.parse(text);
}

function mergeValues(defaultValue, value) {
	if (Array.isArray(defaultValue)) {
		const valueArray = Array.isArray(value) ? value : [];
		const rowCount = Math.max(defaultValue.length, valueArray.length);
		return Array.from({ length: rowCount }, (_, index) =>
			mergeValues(defaultValue[index] || {}, valueArray[index] || {}),
		);
	}

	if (defaultValue && typeof defaultValue === "object") {
		const valueObject = value && typeof value === "object" && !Array.isArray(value) ? value : {};
		return Object.fromEntries(
			Object.entries(defaultValue).map(([key, fallback]) => [key, mergeValues(fallback, valueObject[key])]),
		);
	}

	if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) {
		return defaultValue;
	}

	return value;
}

function setText(selector, value) {
	const element = document.querySelector(selector);
	if (element && value !== undefined && value !== null) {
		element.textContent = String(value);
	}
}

function setImage(selector, path) {
	const image = document.querySelector(selector);
	if (image && typeof path === "string" && path.trim()) {
		image.src = path;
	}
}

function renderValues(data) {
	setText("#vs", data.vs);
	setText("#info-eventname", data.info?.eventName);
	setText("#info-groupname", data.info?.groupName);
	setText("#info-matchday", data.info?.matchday);
	setText("#info-casters-names", data.info?.castersNames);

	setImage("#icons .icon:first-of-type", data.images?.bob);
	setImage("#icons .icon:last-of-type", data.images?.opponent);

	for (const side of ["bob", "opponent"]) {
		const team = data.headToHead?.[side];
		if (!team) continue;

		const nameId = side === "bob" ? "#h2h-bob-name" : "#h2h-enemy-name";
		const shortId = side === "bob" ? "#h2h-bob-short" : "#h2h-enemy-short";
		const winLossId = side === "bob" ? "#h2h-bob-winloss" : "#h2h-enemy-winloss";

		setText(nameId, team.name);
		setText(shortId, team.short);
		setText(`${winLossId} .h2h-winloss-box-green`, team.wins);
		setText(`${winLossId} .h2h-winloss-box-red`, team.losses);
	}

	if (Array.isArray(data.standings)) {
		document.querySelectorAll("#table-list tbody .table-item").forEach((row, index) => {
			const team = data.standings[index];
			if (!team) return;

			setImage(`#${row.id} .table-icon`, team.image);
			setText(`#${row.id} .table-short`, team.short);
			setText(`#${row.id} .table-name`, team.name);
			setText(`#${row.id} .table-winloss-wins`, team.wins);
			setText(`#${row.id} .table-winloss-losses`, team.losses);
		});
	}
}

async function initializePage() {
	let defaults;

	try {
		defaults = await readJson(defaultsPath);
	} catch (error) {
		console.error("Unable to load default page values.", error);
		return;
	}

	let values = {};
	for (const path of [localValuesPath, valuesPath]) {
		try {
			const candidate = await readJson(path);
			if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
				throw new Error(`${path} must contain a JSON object`);
			}
			values = candidate;
			break;
		} catch (error) {
			console.info(`Could not use ${path}; trying the next values source.`, error);
		}
	}

	renderValues(mergeValues(defaults, values));
}

initializePage();
