let tutorialStr = "";
let tutorialBracketPos = 0;
let tutorialActive = false;
let tutorial1Completed = localStorage.getItem("tutorial1Completed") === "true";
let tutorial2Completed = localStorage.getItem("tutorial2Completed") === "true";
let tutorialBracketSize = 2;

const label = document.getElementById("tutorial_string");
const here = document.getElementById("try");

function tutorialKeyHandler(event) {
    if (!tutorialActive) return;

    let key = event.key;
    let shifting = tutorialStr.slice(tutorialBracketPos, tutorialBracketPos + tutorialBracketSize);

    if (key === "a" && tutorialBracketPos > 0) tutorialBracketPos--;
    else if (key === "d" && tutorialBracketPos + tutorialBracketSize < tutorialStr.length) tutorialBracketPos++;
    else if (key === "ArrowLeft" && shifting) tutorialStr = tutorialStr.slice(0, tutorialBracketPos) + shiftByOne(shifting, "left") + tutorialStr.slice(tutorialBracketPos + tutorialBracketSize);
    else if (key === "ArrowRight" && shifting) tutorialStr = tutorialStr.slice(0, tutorialBracketPos) + shiftByOne(shifting, "right") + tutorialStr.slice(tutorialBracketPos + tutorialBracketSize);
    else return;

    label.textContent = bracket_first_x(tutorialStr, tutorialBracketPos, tutorialBracketPos + tutorialBracketSize);

    if (tutorialStr === "0123") {
        label.textContent = "Good job, now try this!";
        tutorial1Completed = true;
        localStorage.setItem("tutorial1Completed", "true");
        here.style.display = "none";
        tutorialStr = "502413";
        tutorialBracketPos = 0;
        tutorialActive = true;
        tutorialBracketSize = 3;
        label.textContent = bracket_first_x(tutorialStr, tutorialBracketPos, tutorialBracketPos + tutorialBracketSize);
        here.style.display = "block";
        document.addEventListener("keydown", tutorialKeyHandler);
    }
    if (tutorialStr === "012345"){
        label.textContent = "Tutorial completed! Now go ahead and try 8 characters! If you're stuck, search sort16 solution on YouTube!";
        tutorial2Completed = true;
        localStorage.setItem("tutorial2Completed", "true");
        here.style.display = "none";
        label.style.fontSize = "14px";
    }
}

function tutorial_func() {
    if (tutorial2Completed) {
        label.textContent = "Tutorial already completed!";
        here.style.display = "none";
        label.style.fontSize = "14px";
        label.style.marginTop = "10px";
    }
    else if (tutorial1Completed){
        tutorialStr = "502413";
        tutorialBracketPos = 0;
        tutorialActive = true;
        tutorialBracketSize = 3;
        label.textContent = bracket_first_x(tutorialStr, tutorialBracketPos, tutorialBracketPos + tutorialBracketSize);
        here.style.display = "block";
        document.addEventListener("keydown", tutorialKeyHandler);
    }
    else {
        tutorialStr = "3021";
        tutorialBracketPos = 0;
        tutorialActive = true;
        label.textContent = bracket_first_x(tutorialStr, tutorialBracketPos, tutorialBracketPos + tutorialBracketSize);
        here.style.display = "block";
        document.addEventListener("keydown", tutorialKeyHandler);
    }
}
