const toggle = document.getElementById('darkModeToggle');
const themeIcon = document.getElementById('themeIcon');

function updateIcon(theme) {
    themeIcon.textContent = theme === 'dark' ? '🌞' : '🌙';
}

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
let completionsShow = false;

let records = Array(29).fill(null);
let completionCounts = {};

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


function initializeRecordDisplay() {
    for (let i = 8; i <= 36; i++) {
        let recordLabel = document.getElementById(i.toString());

        if (!recordLabel) {
            recordLabel = document.createElement('div');
            recordLabel.id = i.toString();
            document.getElementById('record-list').appendChild(recordLabel);
        }

        recordLabel.classList.add('record-label');

        if (!recordLabel.querySelector('.trophy-btn')) {
            const trophyBtn = document.createElement('button');
            trophyBtn.textContent = "🏆";
            trophyBtn.classList.add('trophy-btn');

            trophyBtn.onclick = () => {
                const url = `leaderboards/difficultyLeaderboard.html?difficulty=${i}`;
                window.open(url, "_blank");
            };

            recordLabel.appendChild(trophyBtn);
        }

        if (!recordLabel.querySelector('.leaderboard-btn')) {
            const leaderboardBtn = document.createElement('button');
            leaderboardBtn.textContent = "📊";
            leaderboardBtn.classList.add('leaderboard-btn');

            leaderboardBtn.style.cursor = "pointer";
            leaderboardBtn.style.border = "none";
            leaderboardBtn.style.background = "transparent";
            leaderboardBtn.style.fontSize = "1em";

            leaderboardBtn.onclick = () => {
                const url = `leaderboards/completionsLeaderboard.html?difficulty=${i}`;
                window.open(url, "_blank");
            };

            recordLabel.appendChild(leaderboardBtn);
        }

        // text
        if (!recordLabel.querySelector('.record-text')) {
            const textSpan = document.createElement('span');
            textSpan.classList.add('record-text');
            textSpan.textContent = `${i}: --:--.---`;
            recordLabel.appendChild(textSpan);
        }
    }
}

function swap() {
    completionsShow = !completionsShow;
    if (completionsShow) {
        document.querySelector('.records-header h2').textContent = "Completions:";
        document.getElementById("swapRecordTypeBtn").textContent = "Records";
    } else {
        document.querySelector('.records-header h2').textContent = "Records (s):";
        document.getElementById("swapRecordTypeBtn").textContent = "Completions";
    }
    updateRecordDisplay();
}

function updateRecordDisplay() {
    for (let i = 8; i <= 36; i++) {
        const recordLabel = document.getElementById(i.toString());
        if (!recordLabel) continue;

        let textSpan = recordLabel.querySelector('.record-text');

        if (!textSpan) {
            textSpan = document.createElement('span');
            textSpan.classList.add('record-text');
            recordLabel.appendChild(textSpan);
        }

        if(!completionsShow) {
            rec = records[i - 8];
            textSpan.textContent = `${i}: ${rec ? (rec.time / 1000).toFixed(3) + 's' : '--:--.---'}`;
        } else {
            const comp = completionCounts[i] ?? 0;
            textSpan.textContent = `${i}: ${comp}`;
        }
    }
}

function attachGameListeners() {
    document.removeEventListener("keydown", keyHandler);
    document.removeEventListener("keydown", restartKey);

    document.addEventListener("keydown", keyHandler);
    document.addEventListener("keydown", restartKey);
}

for(let i = 8; i <= 36; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = i;
    dropdown.appendChild(option);
}

initializeRecordDisplay();

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

    attachGameListeners();
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
    if (event.key === "r"){
        document.removeEventListener("keydown", restartKey);
        document.removeEventListener("keydown", keyHandler);
        startGame();
    }
}

async function winGame() {
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

        let textSpan = recordLabel.querySelector('.record-text');

        if (!textSpan) {
            textSpan = document.createElement('span');
            textSpan.classList.add('record-text');
            recordLabel.appendChild(textSpan);
        }

        textSpan.textContent = `${mainString.length}: ${(elapsed / 1000).toFixed(3)}s`;
    }

    label1.textContent = `You win! Time: ${(elapsed / 1000).toFixed(3)} s. Record: ${(records[idx] ? records[idx] / 1000 : elapsed / 1000).toFixed(3)} s`;

    document.removeEventListener("keydown", keyHandler);
    document.addEventListener("keydown", restartKey);

    reveal.style.display = "inline-block";
    restart.textContent = "Play again";
    completionCounts[idx] = (completionCounts[idx] || 0) + 1;

    let previousRecord = records[idx];

    if (previousRecord === null || elapsed < previousRecord.time) {
        records[idx].time = elapsed;
    }

    let recordTime = records[idx].time / 1000;
    let isNewBest = previousRecord === null || elapsed < previousRecord.time;
    updateRecordDisplay();
    showWinPopup(
        mainString.length,
        elapsed / 1000,
        movesArr.length,
        seed,
        recordTime,
        isNewBest
    );
    await syncRunResult({
        time: elapsed,
        moves: movesArr.length,
        difficulty: mainString.length,
        seed: seed,
    });
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

window.openAuthModal = function(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("active");
  label1.style.marginTop = "4vw";
};

window.closeAuthModal = async function(id, loggedIn = false) {
    const el = document.getElementById(id);
    if (el) el.classList.remove("active");
    label1.style.marginTop = "0vw";
    if (loggedIn) {
        document.getElementById("loggedin").textContent = `Logged in as ${(await getUsername()).username}`;
        document.getElementById("loggedin").style.display = "block";
        document.getElementById("logout").style.display = "inline-block";
        const data = await syncUserData();

        const completionCountsMap = Object.fromEntries(
        (data?.completions || []).map(c => [c.difficulty, c.count ? c.count : 0])
        );

        completionCounts = completionCountsMap;
        records = data?.records || records;

        updateRecordDisplay();
    }
}

  // switch between login/signup
window.switchToSignup = function() {
    closeAuthModal("loginModal");
    openAuthModal("signupModal");
};

window.switchToLogin = function() {
    closeAuthModal("signupModal");
    openAuthModal("loginModal");
};

  // auto-open login modal if no user in localStorage
window.addEventListener("DOMContentLoaded", () => {
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (!loggedInUser) {
      openAuthModal("loginModal");
    }
    else {
        ign = loggedInUser;
    }
});

