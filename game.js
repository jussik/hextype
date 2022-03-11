import { WordPrompt } from "./wordPrompt.js";
import { Map } from "./map.js";
import { isWordChar } from "./utils.js";
import { Ui } from "./ui.js";
import { GameState } from "./gameState.js";

export class Game {
    events;
    ui;
    prompt;
    map;
    state = GameState.Loading;
    
    constructor() {
        this.events = new EventTarget();
    }

    start(columns, rows, seed) {
        this.ui = new Ui(this);
        this.prompt = new WordPrompt(this);
        this.map = new Map(this, columns, rows, seed);
        this.map.create();
        
        window.addEventListener("keydown", ev => this.onKeydown(ev));
    }

    onKeydown(ev) {
        if (isWordChar(ev.key)) {
            // letter or hyphen
            this.events.dispatchEvent(new InputCharacterEvent(ev.key.toLowerCase()));
        } else if (ev.code === "Space" || ev.key === "Enter") {
            // space or enter
            this.events.dispatchEvent(new Event(InputEvent.Accept));
        } else if (ev.key === "Delete" || (ev.ctrlKey && ev.key === "Backspace")) {
            // delete or ctrl+backspace - clear whole word
            this.events.dispatchEvent(new Event(InputEvent.Clear));
        } else if (ev.key === "Backspace") {
            // backspace - remove last letter
            this.events.dispatchEvent(new Event(InputEvent.Backspace));
        }
    }

    setState(state) {
        this.state = state;
        this.events.dispatchEvent(new Event(GameEvents.StateChanged));
    }
}

export const GameEvents = {
    StateChanged: "game.stateChanged"
};

export const InputEvent = {
    Character: "input.character",
    Accept: "input.accept",
    Backspace: "input.backspace",
    Clear: "input.clear"
};

export class InputCharacterEvent extends Event {
    key;
    constructor(key) {
        super(InputEvent.Character);
        this.key = key;
    }
}