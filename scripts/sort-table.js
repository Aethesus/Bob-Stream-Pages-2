const teamDataPath = "assets/enemy_info/fall_26-27_group_4-8.json";

function getNumericStat(team, key) {
	const value = team[key];
	if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) {
		return 0;
	}

	const number = Number(value);
	if (!Number.isFinite(number)) {
		throw new Error(`Team "${team.name}" has an invalid ${key} value`);
	}

	return number;
}

function compareWinLossRatio(left, right) {
	const leftRatio = left.losses === 0 ? (left.wins > 0 ? Infinity : 0) : left.wins / left.losses;
	const rightRatio = right.losses === 0 ? (right.wins > 0 ? Infinity : 0) : right.wins / right.losses;
	return rightRatio - leftRatio;
}

async function populateSortedStandings() {
	const response = await fetch(teamDataPath, { cache: "no-store" });
	if (!response.ok) {
		throw new Error(`Could not load ${teamDataPath}: ${response.status}`);
	}

	const teams = await response.json();
	if (!Array.isArray(teams)) {
		throw new Error(`${teamDataPath} must contain an array of teams`);
	}

	const standings = teams
		.map((team) => {
			if (!team || typeof team !== "object" || typeof team.name !== "string") {
				throw new Error(`${teamDataPath} contains a team without a valid name`);
			}

			return {
				name: team.name,
				image: team.pic ?? "",
				short: team.abbrev ?? "",
				wins: getNumericStat(team, "wins"),
				losses: getNumericStat(team, "losses"),
				points: getNumericStat(team, "points"),
			};
		})
		.sort((left, right) => {
			return (
				right.points - left.points ||
				compareWinLossRatio(left, right) ||
				left.name.localeCompare(right.name, undefined, { sensitivity: "base" })
			);
		})
		.map((team) => ({
			...team,
			wins: String(team.wins),
			losses: String(team.losses),
			points: String(team.points),
		}));

	window.PAGE_VALUES = {
		...(window.PAGE_VALUES || {}),
		standings,
	};
}

window.TEAM_STANDINGS_READY = populateSortedStandings().catch((error) => {
	console.warn("Could not populate standings from the team data; using values.local.js instead.", error);
});