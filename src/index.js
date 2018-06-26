/**
 *  ____         ___   __ _     _  __
 * |  _ \ __  __/ _ \ / _| |   (_)/ _| ___
 * | |_) |\ \/ / | | | |_| |   | | |_ / _ \
 * |  _ <  >  <| |_| |  _| |___| |  _|  __/
 * |_| \_\/_/\_\\___/|_| |_____|_|_|  \___|
 *
 * by Edvin CANDON
 * 2018
 **/


import { interval, fromEvent, merge, animationFrameScheduler, NEVER, Subject } from 'rxjs';
import { map, scan, mapTo, switchMap, startWith, shareReplay, withLatestFrom } from 'rxjs/operators';
import { createGrid, nextGeneration, updateGrid, translateCells, getGridFromWindow } from './utils';
import Renderer from './renderer';
import { gliderGun } from './shapes';

const SEED_BUTTON = document.getElementById('randomSeed');
const PLAY_BUTTON = document.getElementById('togglePlay');
const CLEAR_BUTTON = document.getElementById('clear');
const CELL_SIZE = 2;


document.addEventListener('DOMContentLoaded', () => {
  const renderer = new Renderer({ cellSize: CELL_SIZE });

  const world$ = new Subject();
  const spawn$ = new Subject();

  /* control streams */
  const seed$ = fromEvent(SEED_BUTTON, 'click').pipe(mapTo(true));
  const clear$ = fromEvent(CLEAR_BUTTON, 'click').pipe(mapTo(false));
  const pause$ = fromEvent(PLAY_BUTTON, 'click').pipe(startWith(false), scan(x => !x), shareReplay(1));

  /* map each resize to a new grid
	 * resize$ starts with null to trigger initial resize */
  const resize$ = fromEvent(window, 'resize').pipe(
    startWith(null),
    map(() => createGrid(getGridFromWindow(CELL_SIZE))),
    shareReplay(1)
  );

  /* map each click to cells to update based on spawn type */
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

  /* handle grid resets via seed or clear button */
  const reset$ = merge(seed$, clear$)
    .pipe(
      withLatestFrom(resize$),
      map(([random, { columns, rows }]) => createGrid({ columns, rows, random })));

  /* main game ticker */
  const ticks$ = pause$
    .pipe(switchMap(val => (val ? interval(50, animationFrameScheduler) : NEVER)));

  /* main game loop */
  const state$ = world$
    .pipe(switchMap(({ grid: initGrid, columns, rows }) =>
      ticks$.pipe(scan(({ grid }) => nextGeneration({ grid, columns, rows }),
        { grid: initGrid }))));


  /* SUBSCRIPTIONS */
  /* draw initial frame and reinit renderer if needed */
  world$.subscribe(({ grid, columns, rows, clear }) => {
    if (clear) renderer.init({ columns, rows });
    renderer.draw(grid.filter(cell => cell[2] === 1));
  });
  /* redraw */
  state$.subscribe(({ updateMap }) => renderer.draw(updateMap));

  /* merge source streams */
  merge(click$, resize$, reset$).subscribe(world$);

  pause$.subscribe(val => PLAY_BUTTON.innerHTML = val ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>');

  spawn$.next({
    type: 'single',
    cells: gliderGun
  });
});
