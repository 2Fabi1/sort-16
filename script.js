const toggle = document.getElementById('darkModeToggle');
const themeIcon = document.getElementById('themeIcon');

function updateIcon(theme) {
    themeIcon.textContent = theme === 'dark' ? '🌞' : '🌙';
}

function gebi(id) { return document.getElementById(id); }

toggle.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateIcon(newTheme);
});

const savedTheme = localStorage.getItem('theme') || 'light';
document.body.setAttribute('data-theme', savedTheme);
updateIcon(savedTheme);

let timerInterval;
let startTime;

const template = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
let bracketPos = 0;
let moveNum = 0;
let bracketSize = 0;
let mainString = "";
let gameActive = false;
let seed = "";
let movesArr = [];

let records = Array(29).fill(null);
let completions = Array(29).fill(0);
let averageTimes = Array(29).fill(0);

const recordList = document.getElementById('record-list');
const dropdown = document.getElementById('choice');
const button = document.getElementById("play");
const restart = document.getElementById("restart");
const mainmenu = document.getElementById("menu");
const difficulty = document.getElementById("difficulty");
const sol = document.getElementById("solution");
const mobileControls = document.getElementById("mobileControls");
const reveal = document.getElementById("reveal");
const label1 = document.querySelector(".label1");
const tutorial = document.getElementById("tutorialBtn.");
const tutorialModal = document.getElementById("tutorialModal");
const closeTutorial = document.getElementById("closeTutorial");
const sort16header = document.getElementById("mainheader");
const seedparagraph = document.getElementById("popupSeed");


for(let i = 8; i <= 36; i++) {
    const p = document.createElement('p');
    p.id = i;
    p.textContent = `${i}: --:--.---`;
    recordList.appendChild(p);

    const option = document.createElement('option');
    option.value = i;
    option.textContent = i;
    dropdown.appendChild(option);
}

updateRecordDisplay();

function isMobile() {
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

function keyHandler(event) {
    if (!gameActive) return;
    let keyPressed = event.key;
    let stringLen = mainString.length;
    let shifting = mainString.slice(bracketPos, bracketPos + bracketSize);
    let label2 = document.getElementById("main");

    if (keyPressed === "a" && bracketPos > 0){
        bracketPos--;
        movesArr.push("BracketLeft")
    }
    else if (keyPressed === "d" && bracketPos + bracketSize < stringLen){ 
        bracketPos++;
        movesArr.push("BracketRight")
    }
    else if (keyPressed === "ArrowLeft" && shifting) {
        mainString = mainString.slice(0, bracketPos) + shiftByOne(shifting, "left") + mainString.slice(bracketPos + bracketSize);
        movesArr.push("CharsLeft");
    }
    else if (keyPressed === "ArrowRight" && shifting) {
        mainString = mainString.slice(0, bracketPos) + shiftByOne(shifting, "right") + mainString.slice(bracketPos + bracketSize);
        movesArr.push("CharsRight");
    }
    else if (keyPressed === "r"){
        startGame();
        bracketPos = 0;
    }
    else return;

    label2.textContent = bracket_first_x(mainString, bracketPos, bracketPos + bracketSize);

    if (mainString === template.slice(0, stringLen)) winGame();
}

function startGame() {
    let choice = parseInt(dropdown.value);
    
    difficulty.textContent = `Difficulty: ${choice} characters`;
    label1.style.color = "";

    
    if (choice < 8 || choice > 36) {  
        label1.textContent = "Select number from 8 to 36!";
        label1.style.color = "red";
        setTimeout(() => {
            label1.textContent = "Select character number (8-36): ";
            label1.style.color = "";
        }, 1000);
        return;
    }

    startTime = Date.now();
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        let elapsed = Date.now() - startTime;
        label1.textContent = `Time: ${(elapsed / 1000).toFixed(3)} s`;
    }, 10);

    dropdown.style.display = "none";
    button.style.display = "none";
    restart.style.display = "inline";
    mainmenu.style.display = "inline";
    restart.textContent = "Restart";
    tutorialBtn.style.display = "none";
    reveal.style.display = "none";
    sol.style.display = "none";
    sol.textContent = "";

    if (isMobile()){
        mobileControls.style.display = "inline";
    }

    gameActive = true;
    mainString = createString(choice);
    seed = mainString;
    movesArr = [];
    bracketSize = Math.ceil(choice / 2);
    bracketPos = 0;
    document.getElementById("main").textContent = bracket_first_x(mainString, 0, bracketSize);

    document.addEventListener("keydown", restartKey);
    document.addEventListener("keydown", keyHandler);
}

function mainMenu() {
    clearInterval(timerInterval);
    document.querySelector(".label1").textContent = "Select character number (8-36): ";
    label1.style.color = "";
    dropdown.style.display = "inline";
    button.style.display = "inline";
    restart.style.display = "none";
    mainmenu.style.display = "none";
    reveal.style.display = "none";
    tutorialBtn.style.display = "inline";
    sol.style.display = "none";
    sol.textContent = "";
    difficulty.textContent = "";
    document.getElementById("main").textContent = "";
    document.removeEventListener("keydown", keyHandler);
}

function restartKey(event){
    let keyPressed = event.key;
    if (keyPressed === "r"){
        startGame();
    }
}

function winGame() {
    clearInterval(timerInterval);
    let elapsed = Date.now() - startTime;
    label1.style.color = "green";
    bracketPos = 0;
    document.getElementById("main").textContent = "";
    gameActive = false;
    let recordLabel = document.getElementById(mainString.length.toString());
    let idx = mainString.length - 8;
    if (records[idx] === null || elapsed < records[idx]) {
        records[idx] = elapsed;
        recordLabel.textContent = `${mainString.length}: ${(elapsed / 1000).toFixed(3)}s`;
    }
    label1.textContent = `You win! Time: ${(elapsed / 1000).toFixed(3)} s. Record: ${(records[idx] / 1000).toFixed(3)} s`;
    document.removeEventListener("keydown", keyHandler);
    document.addEventListener("keydown", restartKey);
    difficulty.textContent += "\nSeed: "+seed+"\nMoves: "+movesArr.length;
    reveal.style.display = "inline-block";
    restart.textContent = "Play again";

    completions[idx]++;
    averageTimes[idx] = ((averageTimes[idx] * (completions[idx] - 1)) + elapsed) / completions[idx];

    let recordTime = records[mainString.length - 8] / 1000;
    let isNewBest = elapsed / 1000 <= recordTime;
    
    showWinPopup(
        mainString.length,
        elapsed / 1000,
        movesArr.length,
        seed,
        recordTime,
        isNewBest
    );

    updateRecordDisplay();
}

tutorialBtn.addEventListener("click", () => {
    tutorialModal.style.display = "block";
    tutorialModal.className = "modal active";
});

closeTutorial.addEventListener("click", () => {
    tutorialModal.style.display = "none";
    tutorialModal.className = "modal inactive";
});

window.addEventListener("click", (e) => {
    if (e.target === tutorialModal) {
        tutorialModal.style.display = "none";
    }
});

closePopup.addEventListener("click", () => {
    popup.style.display = "none";
});

const tooltip = document.getElementById('tooltip');

function updateRecordDisplay() {
    for (let i = 8; i <= 36; i++) {
        const recordLabel = document.getElementById(i.toString());
        const rec = records[i - 8];
        const avg = averageTimes[i - 8];
        const comp = completions[i - 8];

        recordLabel.textContent = `${i}: ${rec ? (rec / 1000).toFixed(3) + 's' : '--:--.---'}`;

        recordLabel.onmouseenter = null;
        recordLabel.onmousemove = null;
        recordLabel.onmouseleave = null;

        recordLabel.addEventListener('mouseenter', (e) => {
            tooltip.style.display = 'block';
            tooltip.textContent = rec !== null
                ? `Completions: ${comp} | Average: ${(avg / 1000).toFixed(3)}s`
                : "No completions yet";
        });

        recordLabel.addEventListener('mousemove', (e) => {
            tooltip.style.left = (e.pageX + 10) + 'px';
            tooltip.style.top = (e.pageY + 10) + 'px';
        });

        recordLabel.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
        });
    }
}

