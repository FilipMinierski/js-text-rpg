
class DialogueOption {
    constructor(text, nextId, canChoose, onChoose) {
        this.text = text;

        /** ID of node which will become the new currently active node if this 
         * option is chosen successfully. */
        this.nextId = nextId;

        /** A function which runs after this option has successfully been chosen. */
        this.onChoose = onChoose;

        /** A function which returns true if this option can be chosen, else false. */
        this.canChoose = canChoose;
    }
} 


class DialogueNode {
    static #MAX_OPTIONS = 9;

    constructor(text, clearDisplay) {
        this.text = text;
        this.options = [];
        this.validOptions = [];
        this.id = -1;
        
        this.clearDisplay = clearDisplay;

        this.isKeyListener = false;
        this.validInput = (args) => { return false; };
        this.submitInput = (args) => {};
    }

    #addOption(option) {
        if (this.options.length < DialogueNode.#MAX_OPTIONS) {
            this.options.push(option);
            return true;
        }
        else {
            console.log("Cannot have more than " + DialogueNode.#MAX_OPTIONS.toString() + " options.");
            return false;
        }
    }

    addNewOption(text, next, canChoose, onChoose) {
        let option = new DialogueOption(text, next, canChoose, onChoose);

        if (this.#addOption(option)) {
            return option;
        }

        return null;
    }

    getDisplayString() {
        let displayString = this.text;

        for (const key of gameVars.keys()) {
            displayString = displayString.replaceAll(key, gameVars.get(key));
        }
        
        // Don't show options if we're waiting for user input
        if (this.isKeyListener) {
            return displayString;
        }

        //displayString += "\n" + Elements.addSpan("You decide to...", Elements.SPAN_LARGE) + "\n";
        displayString += "\n<hr>";

        this.validOptions = [];

        let index = 0;
        for (let i = 0; i < this.options.length; i++) {
            if (this.options[i].canChoose())
            {
                this.validOptions.push(this.options[i]);
                let optionString = "(" + (index + 1).toString() + ") " + this.options[i].text;
                let spanString = this.options[i].canChoose()? Elements.SPAN_OPTION : Elements.SPAN_UNAVAILABLE;
                displayString += Elements.addSpan(optionString, spanString) + "\n";
                index++;
            }
        }

        displayString += "\n";
        return displayString;
    }
}


class DialogueSystem {

    /** Currently active dialogue node. */
    #active = new DialogueNode("active", true);

    /** List of all dialogue nodes. */
    #nodes = [];

    /** Function to run after changing active node. */
    #onChangeActive;

    constructor(onChangeActive = () => {}) {
        this.#onChangeActive = onChangeActive;
    }

    /** Returns the currently active dialogue node. */
    getActive() {
        return this.#active;
    }

    addNewNode(text, clearDisplay=false) {
        let node = new DialogueNode(text, clearDisplay);
        node.id = this.#nodes.length;

        this.#nodes.push(node);

        return node;
    }

    addNewOption(srcNode, dstNode, optionText = "Continue", canChoose = () => { return true; }, onChoose = () => {}) {
        let src = this.getNode(srcNode.id);
        let dst = this.getNode(dstNode.id);

        if (!(src instanceof DialogueNode && dst instanceof DialogueNode )) {
            return;
        }

        return src.addNewOption(optionText, dstNode.id, canChoose, onChoose);
    }

    getNode(nodeId) {
        if (typeof(nodeId) !== "number") {
            console.log("Parameter 'nodeId' should be a number, is instead '" + typeof(nodeId) + "'.");
            return null;
        }

        if (Utils.isInRange(nodeId, 0, this.#nodes.length)) {
            return this.#nodes[nodeId];
        }

        console.log("Node with id '" + nodeId.toString() + "' does not exist.");
        return null;
    }

    #setActive(node, onChoose = () => {}) {
        if (typeof(node) === "number") node = this.getNode(node);
        else if (!(node instanceof DialogueNode)) {
            console.log("Parameter 'node' should be a number or a DialogueNode, is instead '" + typeof(node) + "'.");
            return false;
        }

        if (node != null) {
            this.#active = node;
            onChoose();
            this.#onChangeActive();
            
            return true;
        }

        return false;
    }

    chooseOption(index) {
        if (!(this.#active instanceof DialogueNode)) {
            return false;
        }

        let options = this.#active.validOptions;

        if (Utils.isInRange(index, 0, options.length)) {
            let option = options[index];

            if (option instanceof DialogueOption && option.canChoose()) {
                return this.#setActive(option.nextId, option.onChoose);
            }
        }
    }


    buildPrefab() {
        if (this.#nodes.length > 0) {
            return;
        }

        const alwaysTrue = () => { return true; };
        const alwaysFalse = () => { return false; };

        // Intro + character creation
        const start = this.addNewNode("Use keys 1-9 to navigate.", true);
        const nameCharacter = this.addNewNode("Choose a name: ");
        nameCharacter.isKeyListener = true;
        nameCharacter.validInput = (textInput) => {
            return Utils.isInRange(textInput.length, 0, 20);
        };
        nameCharacter.submitInput = (textInput) => {
            gameVars.set("__playerName__", textInput);
            this.#setActive(personality1);
        };

        const intro1 = this.addNewNode("");
        const intro2 = this.addNewNode("");

        // Exposition dump
        const lore1 = this.addNewNode(
            "Lorem ipsum dolor sit amet 1"
        );
        const lore2 = this.addNewNode(
            "Lorem ipsum dolor sit amet 2"
        );
        const lore3 = this.addNewNode(
            "Lorem ipsum dolor sit amet 3"
        );

        this.addNewOption(start, intro1);
        //this.addNewOption(intro1, intro2);

        const personality1 = this.addNewNode("\n\nWhat's your strongest skill?");
        const personality2 = this.addNewNode("What's your view on technology?");
        const characterFinish = this.addNewNode(
            "You are __playerName__, __playerSkillDesc__ who views technology as __playerTechOpinion__. " + 
            "Is this the character you want to play as?"
        );
        const characterConfirm = this.addNewNode("Are you sure? You won't be able to change your character from now on.")

        this.addNewOption(intro1, lore1, "Read the exposition");
        this.addNewOption(intro1, nameCharacter, "Create your character");
        this.addNewOption(lore1, lore2);
        this.addNewOption(lore1, intro1, "Skip exposition");
        this.addNewOption(lore2, lore3);
        this.addNewOption(lore2, intro1, "Skip exposition");
        this.addNewOption(lore3, nameCharacter, "Create your character");

        this.addNewOption(nameCharacter, personality1, "This should not be visible");
        this.addNewOption(personality1, personality2, 
            '"Convincing people to do what I want."', alwaysTrue, () => {
            gameVars.set("__playerSkill__", "social");
            gameVars.set("__playerSkillDesc__", "a smoothtalker");
        });
        this.addNewOption(personality1, personality2, 
            '"Hacking, coding, and anything that involves a computer."', alwaysTrue, () => {
            gameVars.set("__playerSkill__", "computers");
            gameVars.set("__playerSkillDesc__", "a computer whizz");
        });
        this.addNewOption(personality1, personality2, 
            '"Medicine; healing people."', alwaysTrue, () => {
            gameVars.set("__playerSkill__", "medical");
            gameVars.set("__playerSkillDesc__", "a doctor");
        });
        this.addNewOption(personality1, personality2, 
            '"I know how to handle myself in a gunfight."', alwaysTrue, () => {
            gameVars.set("__playerSkill__", "guns");
            gameVars.set("__playerSkillDesc__", "a sharpshooter");
        });
        this.addNewOption(personality1, personality2, 
            '"Nothing in particular. I\'m decent at most common tasks."', alwaysTrue, () => {
            
        });
        this.addNewOption(personality2, characterFinish, 
            '"Technology is what differentiates us from animals. Through it, we can achieve the impossible."', 
            alwaysTrue, () => {
                gameVars.set("__playerTechOpinion__", "very positive");
        });
        this.addNewOption(personality2, characterFinish, 
            '"Technology can be used for both good and evil, but ultimately we must recognize that the good outweighs the bad."', 
            alwaysTrue, () => {
                gameVars.set("__playerTechOpinion__", "positive");
        });
        this.addNewOption(personality2, characterFinish, 
            '"Technology is but a tool; it is the wielder who shapes morality."', 
            alwaysTrue, () => {
                gameVars.set("__playerTechOpinion__", "neutral");
        });
        this.addNewOption(personality2, characterFinish, 
            '"Technology has brought us to great heights, and to even greater lows. I believe that technology can be a force ' +
            'for good, but we must be careful with it lest we repeat the mistakes of our past."', 
            alwaysTrue, () => {
                gameVars.set("__playerTechOpinion__", "negative");
        });
        this.addNewOption(personality2, characterFinish, 
            '"Technology is what caused humanity\'s downfall. Our reliance on it made us fragile, as proven by the collapse. ' + 
            '"', 
            alwaysTrue, () => {
                gameVars.set("__playerTechOpinion__", "very negative");
        });

        this.addNewOption(characterFinish, characterConfirm, "Yes");
        this.addNewOption(characterFinish, nameCharacter, "Change character");


        // Story starts
        const outside1 = this.addNewNode("You are outside a temple.");
        this.addNewOption(characterConfirm, outside1, "Yes");
        this.addNewOption(characterConfirm, nameCharacter, "Change character");

        const outside2 = this.addNewNode("Outside the temple you see two guards. They stare at you with disdain.");
        this.addNewOption(outside1, outside2, "Approach the temple");

        const outside3talk = this.addNewNode("You approach the guards and ask if you can enter.");
        const outside3shoot = this.addNewNode("[Gunslinger] You quickly pull out your trusty pistol, and before they can react you shoot both of the guards. The remaining inhabitants of the temple have surely heard the gunfire.");
        const outside3dead = this.addNewNode("You pull out your pistol and shoot one of the guards. Because you're not skilled with guns, you don't manage to shoot the second guard in time. He aims his rifle at you and fires. The last thing you see before death is the gray sky above.");
        
        this.addNewOption(outside2, outside3talk, "Talk to them");
        this.addNewOption(outside2, outside3shoot, "[Gunslinger] Shoot them", () => {return gameVars.get("__playerSkill__") == "guns"});
        this.addNewOption(outside2, outside3dead, "Shoot them", () => {return gameVars.get("__playerSkill__") != "guns"});
        
        // Font menu
        const fontSizeMenu = this.addNewNode("Change text size. Currently: __fontSize__", true);
        //this.addNewOption(start, fontSizeMenu, "Change text size");
        this.addNewOption(fontSizeMenu, fontSizeMenu, "Increase", 
            () => { 
                return textDisplay.getFontSize() < TextDisplay.MAX_FONT_SIZE; 
            }, 
            () => { 
                textDisplay.changeFontSize(1);
                gameVars.set("__fontSize__", textDisplay.getFontSize()); 
                textDisplay.onChangeActive(); 
            });
        this.addNewOption(fontSizeMenu, fontSizeMenu, "Decrease", 
            () => { 
                return textDisplay.getFontSize() > TextDisplay.MIN_FONT_SIZE; 
            }, 
            () => { 
                textDisplay.changeFontSize(-1); 
                gameVars.set("__fontSize__", textDisplay.getFontSize()); 
                textDisplay.onChangeActive();  
            });
        this.addNewOption(fontSizeMenu, start, "Done");

        // Ending
        const end = this.addNewNode("This is a proof of concept. The rest of the story has not been written yet.");
        const death = this.addNewNode("You died.");
        this.addNewOption(outside3talk, end, "Continue");
        this.addNewOption(outside3shoot, end, "Continue");
        this.addNewOption(outside3dead, end, "Continue");
        this.addNewOption(end, start, "Restart");
        this.addNewOption(death, start, "Restart");

        this.#setActive(start.id);
    }
}
