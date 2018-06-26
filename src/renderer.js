const COLOR_DEAD = '#260F26';
const COLOR_ALIVE = '#71B48D';
const COLOR_DIRTY = '#251F47';

export default class Renderer {
  constructor() {
    this.world = document.getElementById('world');
    this.ctx = this.world.getContext('2d');
    this.getCursorPosition = this.getCursorPosition.bind(this);
  }

  init({ rows, columns, cellSize: _cellSize }) {
    this.width = columns;
    this.height = rows;
    this.cellSize = _cellSize * window.devicePixelRatio;
    const { cellSize, world, height, width, ctx } = this;

    world.style.height = height * cellSize + 'px';
    world.style.width = width * cellSize + 'px';
    world.setAttribute('height', height * cellSize);
    world.setAttribute('width', width * cellSize);
    ctx.fillStyle = COLOR_DEAD;
    ctx.fillRect(0, 0, width * cellSize, height * cellSize);
  }

  draw(updateMap) {
    const { cellSize, ctx } = this;
    updateMap.forEach(([x, y, status]) => {
      ctx.fillStyle = status === 1 ? COLOR_ALIVE : COLOR_DIRTY;
      /* account for border */
      ctx.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 1 , cellSize - 1);
    });
  }

  getCursorPosition(event) {
    const { world, cellSize } = this;
    const rect = world.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / cellSize);
    const y = Math.floor((event.clientY - rect.top) / cellSize);
    return [x, y];
  }
}
