export class Keyboard {
    currentWord = "";
    helpVisible = true;
    game;

    constructor(game) {
        this.game = game;
    }

    onWordChar(key) {
        this.currentWord += key;
        this.game.map?.startTimer();
    }

    onAccept() {
        if (this.currentWord) {
            const targetCoords = this.game.map.nextWordCoords[this.currentWord];
            if (targetCoords)
                this.game.map.tryMovePlayer(...targetCoords);
            else
                this.game.map.player.damagePlayer(1);
            this.currentWord = "";
        }

        if (this.helpVisible) {
            this.game.ui.help.style.display = "none";
            this.helpVisible = false;
            this.game.map.startTimer();
        }
    }

    onClear() {
        this.currentWord = "";
    }

    onBackspace() {
        if (this.currentWord)
            this.currentWord = this.currentWord.slice(0, -1);
    }
}