import { Game } from './engine/Game.js';
import { MenuScene } from './scenes/MenuScene.js';

const canvas = document.getElementById('game');
const game = new Game(canvas);
game.setScene(new MenuScene(game));
game.start();
