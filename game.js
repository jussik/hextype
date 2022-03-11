import { Keyboard } from "./keyboard.js";
import { Map } from "./map.js";
import { isWordChar } from "./utils.js";

export class Game {
    constructor(ui) {
        this.ui = ui;
        this.keyboard = new Keyboard(this);

        window.addEventListener("keydown", ev => this.onKeydown(ev));
    }

    start(columns, rows, seed) {
        this.map = new Map(this, columns, rows, seed);
    }

    onKeydown(ev) {
        if (!this.map || !this.map.player.alive)
            return;

        if (isWordChar(ev.key)) {
            // letter or hyphen
            this.keyboard.onWordChar(ev.key.toLowerCase());
        } else if (ev.code === "Space" || ev.key === "Enter") {
            // space or enter
            this.keyboard.onAccept();
        } else if (ev.key === "Delete" || (ev.ctrlKey && ev.key === "Backspace")) {
            // delete or ctrl+backspace - clear whole word
            this.keyboard.onClear();
        } else if (ev.key === "Backspace") {
            // backspace - remove last letter
            this.keyboard.onBackspace();

        }
        this.ui.currentWordElem.textContent = this.keyboard.currentWord;
    }
}