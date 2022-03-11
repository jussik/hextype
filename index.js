import { Ui } from "./ui.js";
import { Game } from "./game.js";

new Game(new Ui()).start(12, 10, Date.now());
