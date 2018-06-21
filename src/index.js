/**
* RxOfLife
* Rules :
* dead && 3 living neighbors -> alive
* alive && 2 <= living <= 3 -> alive else dead
*/

import { interval, fromEvent, merge, animationFrameScheduler, NEVER, Subject } from 'rxjs';
import { map, filter, scan, switchMap, startWith, shareReplay, withLatestFrom } from 'rxjs/operators';
import { gliderGun } from './shapes';

const SEED_BUTTON = document.getElementById('randomSeed');
const WIDTH = 80;
const HEIGHT = 80;
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

/* create random grid */
const createGrid = (w, h, random = false) => [...Array(w).keys()]
	.map(() => [...Array(h).keys()]
		.map(() => (random ? Math.round(Math.random()) : 0)));

const findNeighbors = (w, h) => (x, y) => DELTA_X.map((dx, i) => [(x + dx + w) % w, (y + DELTA_Y[i] + h) % h]);
const neighbourSum = grid => neighbors => neighbors.reduce((total, [i, j]) => total + grid[j][i], 0);

const nextGeneration = grid =>
	grid.map((row, j) => row.map((state, i) => {
		const neighbors = findNeighbors(WIDTH, HEIGHT)(i, j);
		const score = neighbourSum(grid)(neighbors);
		return Number(score === 3 || (state === 1 && score === 2));
	}));

const cellToCoords = ({ target: { id }}) => id.split('-').slice(1).map(Number);

const translateCells = ([[x, y], { cells }]) =>
	cells.map(([i, j]) => [(x + i + WIDTH) % WIDTH, (y + j + HEIGHT) % HEIGHT]);

//const world$ = of(createGrid(80, 80)).pipe(share());
const world$ = new Subject();
const spawn$ = new Subject();

const pause$ = fromEvent(window, 'keypress')
	.pipe(
		filter(e => e.which === 32), /* space bar */
		startWith(true),
		scan(x => !x)
	);

const click$ = fromEvent(document, 'click')
	.pipe(
		filter(({ target }) => target && target.id && target.id.includes('cell')),
		map(cellToCoords),
		withLatestFrom(spawn$),
		map(translateCells)
	);

const tick$ = pause$.pipe(
	switchMap(val =>
		(val ? interval(0, animationFrameScheduler) : NEVER)));

const updateGrid = (grid, cells) => {
	const newGrid = grid.map(row => [...row]);
	cells.forEach(([x, y]) => newGrid[y][x] = 1);
	return newGrid;
};


const ticks$ = merge(tick$.pipe(map(() => [])), click$).pipe(shareReplay(1));

fromEvent(SEED_BUTTON, 'click')
	.pipe(map(() => createGrid(WIDTH, HEIGHT, true)))
	.subscribe(world$);

const state$ = world$
	.pipe(switchMap(grid =>
		ticks$.pipe(scan((prevGrid, cell) =>
			(cell.length ? updateGrid(prevGrid, cell): nextGeneration(prevGrid)), grid))));















world$.subscribe(grid => {
	// const world = document.getElementById('world');
	// world.innerHTML = '';
	// world.style.height = HEIGHT * 10 + 'px';
	// world.style.width = WIDTH * 10 + 'px';
  //
	// [...Array(grid[0].length).keys()]
	// 	.map((y) => [...Array(grid.length).keys()].map(x => ({ x, y }))
	// 		.forEach(({ x, y }) => {
	// 			const cell = document.createElement('div');
	// 			cell.classList.add('cell');
	// 			cell.style.top = y * 10 + 'px';
	// 			cell.style.left = x * 10 + 'px';
	// 			cell.id = `cell-${x}-${y}`;
	// 			world.appendChild(cell);
	// 		}));
});
let iteration = 0;
state$.subscribe(grid => {
  console.log(++iteration);
// 	grid.forEach((row, y) =>
// 		row.forEach((state, x) => {
// 			const cell = document.getElementById(`cell-${x}-${y}`);
// 			const alive = state > 0;
//
// 			if (alive) {
// 				cell.classList.add('dirty');
// 			}
//
// 			const fn = alive ? 'add' : 'remove';
// 			cell.classList[fn]('alive');
// 		}));
});

world$.next(createGrid(WIDTH, HEIGHT, false));
spawn$.next({
	type: 'single',
	cells: gliderGun
});
