
const KEY_1 = 49;
const KEY_9 = 57;
const KEY_A = 65;
const KEY_Z = 90;
const KEY_ENTER = 13;
const KEY_SPACE = 32;
const KEY_BACKSPACE = 8;


class TextDisplay {
    static DEFAULT_FONT_SIZE = 14;
    static MAX_FONT_SIZE = 20;
    static MIN_FONT_SIZE = 8;

    static #BLINK_DELAY = 600;

    #dialogueSystem = new DialogueSystem();
    #textElement = document.createElement("div");
    #containerElement = document.createElement("div");

    #acceptInput = false;
    #textInput = "";
    #blinkIntervalId = null;
    #blinkOn = false;

    #active = this.#dialogueSystem.getActive();
    #textCache = "";

    #fontSize = TextDisplay.DEFAULT_FONT_SIZE;

    #ready = false;

    constructor() {
        this.selectedOption = 0;
    }

    init(dialogueSystem, textElement, containerElement) {
        if (dialogueSystem instanceof DialogueSystem && 
            textElement instanceof HTMLElement && 
            containerElement instanceof HTMLElement) 
        {
            this.#dialogueSystem = dialogueSystem;
            this.#textElement = textElement;
            this.#containerElement = containerElement;

            this.#ready = true;
        }
    }

    onChangeActive() {
        if (!this.#ready) return;

        const active = this.#dialogueSystem.getActive();

        if (active instanceof DialogueNode) 
        {
            const previous = this.#active;
            this.#active = active;

            if (this.selectedOption > 0 && !previous.isKeyListener) {
                this.#textElement.innerHTML += Elements.addSpan(
                    "(" + this.selectedOption.toString() + ") " + previous.options[this.selectedOption - 1].text + "\n\n",
                    Elements.SPAN_UNAVAILABLE
                );
            }

            this.#textCache = active.clearDisplay ? "" : this.#textElement.innerHTML;
            
            this.#acceptInput = this.#active.isKeyListener;
            if (this.#acceptInput) { 
                this.#startBlinking();
            }
            else {
                this.#stopBlinking();
            }
            this.#textInput = "";

            this.#updateText();
        }
    }

    #updateText() {
        let newText = this.#textCache + this.#active.getDisplayString();

        if (this.#acceptInput) {
            newText += this.#textInput;

            if (this.#blinkOn && this.#dialogueSystem.getActive().validInput(this.#textInput)) {
                newText += "_";
            }
        }

        this.#textElement.innerHTML = newText;

        this.#containerElement.scrollTop = this.#containerElement.scrollHeight;
    }

    changeFontSize(increase) {
        const newFontSize = this.#fontSize + increase;
        this.#fontSize = Utils.clamp(newFontSize, TextDisplay.MIN_FONT_SIZE, TextDisplay.MAX_FONT_SIZE);

        this.#onFontSizeChange();
    }

    getFontSize() {
        return this.#fontSize;
    }

    #onFontSizeChange() {
        this.#textElement.style.fontSize = this.#fontSize.toString() + "px"; 
    }

    /** Returns a substring to string which excludes only the last character. */
    static getSubstringOneLess(string) {
        if (typeof(string) === "string") {
            return string.substring(0, Math.max(0, string.length - 1));
        }

        return "";
    }

    acceptsInput() {
        return this.#acceptInput;
    }

    typeChar(c) {
        if (this.#acceptInput && this.#dialogueSystem.getActive().validInput(this.#textInput)) {
            this.#textInput += c;
            this.#updateText();
        }
    }

    removeChar() {
        if (this.#acceptInput) {
            this.#textInput = TextDisplay.getSubstringOneLess(this.#textInput);
            this.#updateText();
        }
    }

    enterInput() {
        if (this.#acceptInput) {
            this.#dialogueSystem.getActive().submitInput(this.#textInput);
        }
    }

    #startBlinking() {
        if (this.#blinkIntervalId != null) {
            window.clearInterval(this.#blinkIntervalId);
        }

        this.#blinkIntervalId = window.setInterval(() => 
        {
            this.#blinkOn = !this.#blinkOn;
            this.#updateText();

        }, TextDisplay.#BLINK_DELAY);
    }

    #stopBlinking() {
        if (this.#blinkIntervalId != null) {
            window.clearInterval(this.#blinkIntervalId);
            this.#blinkIntervalId = null;

            if (this.#blinkOn) {
                this.#blinkOn = false;
            }

            this.#updateText();
        }
    }
}

const textDisplay = new TextDisplay();
const dialogueSystem = new DialogueSystem(() => { textDisplay.onChangeActive(); });

const gameVars = new Map([
    ["__fontSize__", textDisplay.getFontSize()],
    ["__playerName__", "Player"],
    ["__playerHealth__", 100],
    ["__playerSkill__", "none"],
    ["__playerSkillDesc__", "a jack of all trades but master of none"],
    ["__playerTechOpinion__", "neutral"],
]);


function keyPressed(e) {
    const code = e.keyCode;

    if (textDisplay.acceptsInput()) 
    {
        if ((code >= KEY_A && code <= KEY_Z) || 
            (code >= KEY_1 && code <= KEY_9) || 
            (code == KEY_SPACE))
        {
            textDisplay.typeChar(e.key);
        }
        else if (code == KEY_BACKSPACE) 
        {
            textDisplay.removeChar();
        }
        else if (code == KEY_ENTER) 
        {
            textDisplay.enterInput();
        }        
    }
    else if (code >= KEY_1 && code <= KEY_9) {
        let optionIndex = code - KEY_1;

        textDisplay.selectedOption = optionIndex + 1;
        dialogueSystem.chooseOption(optionIndex);

        e.stopPropagation();
        e.preventDefault();
    }
}


// Called after body loads
function initGame() {
    let textElement = document.getElementById("gameText");
    let containerElement = document.getElementById("textContainer")
    textDisplay.init(dialogueSystem, textElement, containerElement);

    dialogueSystem.buildPrefab();

    document.getElementsByTagName("body")[0].onkeydown = keyPressed;
}
