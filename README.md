# 👾👾👾 RXofLife 👾👾👾
Game of life implementation in RXJS using canvas rendering. Could probably be optimized. **No for loops**.

<img src="https://user-images.githubusercontent.com/11134131/41848085-8f7674ec-787c-11e8-95b1-58fc6f570a17.png" data-canonical-src="https://user-images.githubusercontent.com/11134131/41848085-8f7674ec-787c-11e8-95b1-58fc6f570a17.png" width="450"/>


## Baking the cake
```shell
npm install
npm run dev # start the dev server
```

*Chrome might throw a fit and warn you about requestAnimationFrame handler violations - he's a nasty little lad*

## Deep dive
```shell
src   
│
│--  index.js # streams and what not
│--  renderer.js # canvas rendering
│--  utils.js # all of them nasty functions
│--  shapes.js # custom shapes represented as lists of coords

```

### Everything is a stream
Think of the game of life as a stream `reducing` over itself. The implementation is a little more complicated in order to optimize the rendering, but you get the idea.
```shell
------x-----------------------x----------------x->
[ 0, 0, 1, 0,          [ 0, 0, 0, 0,
  0, 0, 1, 0,   --->     0, 1, 1, 1,   --->   ...
  0, 0, 1, 0,            0, 0, 0, 0,
  0, 0, 0, 0 ]           0, 0, 0, 0 ]
 ```



Oh and **no unit-tests**, sooooorry.
> "Testing is a poor substitute for proof" - Bartosz Milewski

## Todo
- [ ] Add dropdown menu to select shapes
