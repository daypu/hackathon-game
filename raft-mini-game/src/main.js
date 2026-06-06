import { Game } from './engine/Game.js';
import { StartScene } from './scenes/StartScene.js';

const canvas = document.getElementById('game');
const game = new Game(canvas);
game.setScene(new StartScene(game));
game.start();

