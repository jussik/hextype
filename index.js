import { Game } from "./game.js";
import { seedRand } from "./utils.js";

let seed = null;

const seedPar = new URLSearchParams(location.search).get("seed");
if (seedPar) {
    if(/^[0-9a-f]{1,8}$/i.test(seedPar)) {
        seed = parseInt(seedPar, 16);
        console.log("Using specified seed " + seedPar);
    } else {
        console.error("Invalid seed format: " + seedPar);
    }
}

if (seed === null) {
    seed = (seedRand(Date.now())() * 4294967296) >>> 0;
    console.log("Using random seed " + seed.toString(16));
}

window.game = new Game();
game.start(12, 10, seed);
