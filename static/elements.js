
class Elements {
    static #elementArgsProto = {
        tag: "div",
        className: "",
        id: "",
        name: "",
        parent: null
    };

    static createElement(args) {
        let _args = Object.create(this.#elementArgsProto);
        Object.assign(_args, args);

        let element = document.createElement(args.tag);
        element.className = _args.className;
        element.id = _args.id;
        element.name = _args.name;

        if (Elements.isElement(_args.parent)) {
            _args.parent.appendChild(element);
        }

        return element;
    }

    /** Returns true if element is an HTMLElement, else false. */
    static isElement(element) {
        return element instanceof HTMLElement;
    }


    static SPAN_LARGE = "large";
    static SPAN_OPTION = "option";
    static SPAN_UNAVAILABLE = "unavailable";

    /** Surrounds the string with a span element, and returns the result as a new string. */
    static addSpan(string, spanClassName="") {
        return "<span class='" + spanClassName + "'>" + string + "</span>";
    }
}



class Utils {
    /** Returns true if n is between min and max. Min is inclusive, max is exclusive. */
    static isInRange(n, min, max) {
        return (n >= min && n < max);
    }


    /** Returns the value n clamped to between min and max. Min is inclusive, max is exclusive. */
    static clamp(n, min, max) {
        return Math.max(Math.min(n, max), min);
    }
}
