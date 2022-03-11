import { InputEvent } from "./game.js";
import { GameObject } from "./gameObject.js";
import { GameState } from "./gameState.js";

export class WordPrompt extends GameObject {
    currentWord = "";

    constructor(game) {
        super(game);
        
        game.events.addEventListener(InputEvent.Character, ev => {
            if (this.state === GameState.Playing || this.state === GameState.Created)
                this.setCurrentWord(this.currentWord + ev.key);
        });
        game.events.addEventListener(InputEvent.Accept, () => this.onAccept());
        game.events.addEventListener(InputEvent.Backspace, () => this.setCurrentWord(this.currentWord.slice(0, -1)));
        game.events.addEventListener(InputEvent.Clear, () => this.setCurrentWord(""));
    }

    onAccept() {
        if (this.currentWord) {
            this.events.dispatchEvent(new WordEvent(WordEvents.Accepted, this.currentWord));
            this.setCurrentWord("");
        }
    }
    
    setCurrentWord(word) {
        this.currentWord = word;
        this.events.dispatchEvent(new WordEvent(WordEvents.Changed, this.currentWord));
    }
}

export const WordEvents = {
    Changed: "word.changed",
    Accepted: "word.accepted"
}

export class WordEvent extends Event {
    word;
    constructor(type, word) {
        super(type);
        this.word = word;
    }
}