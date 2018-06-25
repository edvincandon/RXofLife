/**
 *  ____         ___   __ _     _  __
 * |  _ \ __  __/ _ \ / _| |   (_)/ _| ___
 * | |_) |\ \/ / | | | |_| |   | | |_ / _ \
 * |  _ <  >  <| |_| |  _| |___| |  _|  __/
 * |_| \_\/_/\_\\___/|_| |_____|_|_|  \___|
 *
 **/


import { interval, fromEvent, merge, animationFrameScheduler, NEVER, Subject } from 'rxjs';
import { map, scan, mapTo, switchMap, startWith, shareReplay, withLatestFrom } from 'rxjs/operators';
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
	const pause$ = fromEvent(PLAY_BUTTON, 'click').pipe(startWith(false), scan(x => !x));
	const resize$ = fromEvent(window, 'resize').pipe(
		startWith(null),
		map(() => getGridFromWindow(CELL_SIZE)),
		shareReplay(1)
	);

	const click$ = fromEvent(renderer.world, 'click')
		.pipe(
			map(renderer.getCursorPosition),
			withLatestFrom(spawn$, resize$),
			map(([[x, y], { cells }, { columns, rows }]) =>
				translateCells({ x, y, cells, columns, rows}))
		);

	const ticks$ = pause$
		.pipe(switchMap(val => (val ? interval(0, animationFrameScheduler) : NEVER)), shareReplay(1));

	// const ticks$ = merge(tick$.pipe(map(() => [])), click$)
	// 	.pipe(shareReplay(1));

	merge(seed$, clear$)
		.pipe(
			withLatestFrom(resize$),
			map(([random, { columns, rows }]) => createGrid({ columns, rows, random })))
		.subscribe(world$);

	const state$ = world$
		.pipe(switchMap(({ grid: initGrid, columns, rows }) =>
			ticks$.pipe(scan(({ grid }) => nextGeneration({ grid, columns, rows }),
				{ grid: initGrid }))));


	/* SUBSCRIPTIONS */
	state$.subscribe(({ updateMap }) => renderer.draw(updateMap));

	world$.subscribe(({ grid, columns, rows, clear }) => {
		if (clear) renderer.init({ columns, rows });
		renderer.draw(grid.filter(cell => cell[2] === 1));
	});

	click$
		.pipe(withLatestFrom(world$), map(([cells, { grid, columns, rows }]) => updateGrid({ grid, cells, columns, rows })))
		.subscribe(world$);

	resize$.pipe(map(createGrid)).subscribe(world$);

	pause$.subscribe(val => PLAY_BUTTON.innerHTML = val ? '❚❚' : '►');

	spawn$.next({
		type: 'single',
		cells: gliderGun
	});
});
