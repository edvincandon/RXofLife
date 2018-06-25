/**
 *  ____         ___   __ _     _  __
 * |  _ \ __  __/ _ \ / _| |   (_)/ _| ___
 * | |_) |\ \/ / | | | |_| |   | | |_ / _ \
 * |  _ <  >  <| |_| |  _| |___| |  _|  __/
 * |_| \_\/_/\_\\___/|_| |_____|_|_|  \___|
 *
 **/


import { interval, fromEvent, merge, animationFrameScheduler, NEVER, Subject } from 'rxjs';
import { map, scan, mapTo, switchMap, startWith, shareReplay, share, withLatestFrom } from 'rxjs/operators';
import { createGrid, nextGeneration, updateGrid, translateCells, getGridFromWindow } from './utils';
import Renderer from './renderer';
import { gliderGun } from './shapes';

const SEED_BUTTON = document.getElementById('randomSeed');
const PLAY_BUTTON = document.getElementById('togglePlay');
const CLEAR_BUTTON = document.getElementById('clear');
const CELL_SIZE = 3;


document.addEventListener('DOMContentLoaded', () => {
	const renderer = new Renderer({ cellSize: CELL_SIZE });
	const world$ = new Subject();
	const spawn$ = new Subject();

	const seed$ = fromEvent(SEED_BUTTON, 'click').pipe(mapTo(true));
	const clear$ = fromEvent(CLEAR_BUTTON, 'click').pipe(mapTo(false));
	const pause$ = fromEvent(PLAY_BUTTON, 'click').pipe(startWith(false), scan(x => !x), shareReplay(1));

	const resize$ = fromEvent(window, 'resize').pipe(
		startWith(null),
		map(() => createGrid(getGridFromWindow(CELL_SIZE))),
		shareReplay(1)
	);

	const click$ = fromEvent(renderer.world, 'click')
		.pipe(
			map(renderer.getCursorPosition),
			withLatestFrom(spawn$, world$),
			map(([[x, y], { cells }, { columns, rows, grid }]) =>
				updateGrid({
					grid,
					cells: translateCells({ x, y, cells, columns, rows}),
					columns,
					rows
				}))
		);

	const reset$ = merge(seed$, clear$)
		.pipe(
			withLatestFrom(resize$),
			map(([random, { columns, rows }]) => createGrid({ columns, rows, random })));

	const ticks$ = pause$
		.pipe(switchMap(val => (val ? interval(0, animationFrameScheduler) : NEVER)));

	const state$ = world$
		.pipe(switchMap(({ grid: initGrid, columns, rows }) =>
			ticks$.pipe(scan(({ grid }) => nextGeneration({ grid, columns, rows }),
				{ grid: initGrid }))));


	/* SUBSCRIPTIONS */
	/* draw initial frame and reinit renderer */
	world$.subscribe(({ grid, columns, rows, clear }) => {
		if (clear) renderer.init({ columns, rows });
		renderer.draw(grid.filter(cell => cell[2] === 1));
	});
	/* redraw */
	state$.subscribe(({ updateMap }) => renderer.draw(updateMap));

	/* world source streams */
	merge(click$, resize$, reset$).subscribe(world$);

	pause$.subscribe(val => PLAY_BUTTON.innerHTML = val ? '❚❚' : '►');

	spawn$.next({
		type: 'single',
		cells: gliderGun
	});
});
