let tutorialString = "";
let tutorialBracketPos = 0;
let tutorialActive = false;
let tutorialCompleted = localStorage.getItem("tutorialCompleted") === "true";

const tutorialBracketSize = 2;
const label = document.getElementById("tutorial_string");
const here = document.getElementById("try");

function tutorialKeyHandler(event) {
    if (!tutorialActive) return;

    let key = event.key;
    let shifting = tutorialString.slice(tutorialBracketPos, tutorialBracketPos + tutorialBracketSize);

    if (key === "a" && tutorialBracketPos > 0) tutorialBracketPos--;
    else if (key === "d" && tutorialBracketPos + tutorialBracketSize < tutorialString.length) tutorialBracketPos++;
    else if (key === "ArrowLeft" && shifting) tutorialString = tutorialString.slice(0, tutorialBracketPos) + shiftByOne(shifting, "left") + tutorialString.slice(tutorialBracketPos + tutorialBracketSize);
    else if (key === "ArrowRight" && shifting) tutorialString = tutorialString.slice(0, tutorialBracketPos) + shiftByOne(shifting, "right") + tutorialString.slice(tutorialBracketPos + tutorialBracketSize);
    else return;

    label.textContent = bracket_first_x(tutorialString, tutorialBracketPos, tutorialBracketPos + tutorialBracketSize);

    if (tutorialString === "0123") {
        label.textContent = "Good job!";
        tutorialActive = false;
        tutorialCompleted = true;
        localStorage.setItem("tutorialCompleted", "true");
        here.style.display = "none";
        document.removeEventListener("keydown", tutorialKeyHandler);
    }
}

function tutorial() {
    if (tutorialCompleted) {
        label.textContent = "Tutorial already completed!";
        here.style.display = "none";
    } else {
        tutorialString = "3021";
        tutorialBracketPos = 0;
        tutorialActive = true;
        label.textContent = bracket_first_x(tutorialString, tutorialBracketPos, tutorialBracketPos + tutorialBracketSize);
        here.style.display = "block";
        document.addEventListener("keydown", tutorialKeyHandler);
    }
}

function shiftByOne(text, direction) {
    if (!text) return text;
    return direction === "left" ? text.slice(1) + text[0] : text.slice(-1) + text.slice(0, -1);
}

function bracket_first_x(text, start, x) {
    let chars = text.split("");
    let spaced_list = chars.join("  ").split("  ");
    x = Math.min(x, text.length);
    let first_part = spaced_list.slice(0, start).join("  ") + " [ " + spaced_list.slice(start, x).join("  ") + " ]";
    let second_part = spaced_list.slice(x).join("  ");
    return first_part + (second_part ? "  " + second_part : "");
}
