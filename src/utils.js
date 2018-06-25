/* base to find neighbors */
const DELTA_X = [
	-1, +0, +1,
	-1,     +1,
	-1, +0, +1
];

const DELTA_Y = [
	-1, -1, -1,
	+0,     +0,
	+1, +1, +1
];

export function getGridFromWindow(cellSize) {
	return ({
		columns: Math.ceil(window.innerWidth / cellSize),
		rows: Math.ceil(window.innerHeight / cellSize)
	});
}

/* create random grid of cells [x,y,state] */
export function createGrid({ columns, rows, random = true, clear = true }) {
	const grid = [...Array(rows).keys()]
		.map((j) => [...Array(columns).keys()]
			.map((i) => [i, j, random ? Math.round(Math.random()) : 0]))
		.reduce((grid, row) => [...grid, ...row], []);

	return ({ grid, columns, rows, clear });
}

/* find neighbors modulo width & height */
export function findNeighbors({ cell: [x, y], columns, rows}) {
	return	DELTA_X.map((dx, i) => [(x + dx + columns) % columns, (y + DELTA_Y[i] + rows) % rows]);
}

/* calculate next generation and updateMap - mutate original grid for performance :( */
export function nextGeneration({ grid, columns, rows }) {
	const prevGeneration = [...grid];
	const updateMap = [];

	prevGeneration.forEach(([x, y, state], i) => {
		const score = findNeighbors({ cell: [x, y], columns, rows })
			.reduce((total, [i, j]) =>total + prevGeneration[(j * columns) + i][2], 0);

		const newState = Number(score === 3 || (state === 1 && score === 2));
		const cell = [x, y, newState];

		if (newState !== state) updateMap.push(cell);
		grid[i] = cell;
	});

	return ({ grid, updateMap });
}

/* update grid with specific cells */
export function updateGrid({ grid, cells = [], columns, rows }) {
	cells.forEach(([x, y]) => {
		grid[(y * columns) + x] = [x, y, 1];
	});

	return ({ grid, columns, rows, clear: false });
}

/* translate shape coords to (x,y) coords */
export function translateCells({ x, y, cells, columns, rows}) {
	return cells.map(([i, j]) => [(x + i + columns) % columns, (y + j + rows) % rows]);
}
