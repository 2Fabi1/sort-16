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
let bracketSize = 0;
let mainString = "";
let gameActive = false;

let records = Array(29).fill(null);

const recordList = document.getElementById('record-list');
const dropdown = document.getElementById('choice');
const button = document.getElementById("play");
const restart = document.getElementById("restart");
const mainmenu = document.getElementById("menu");

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

function keyHandler(event) {
    if (!gameActive) return;
    let keyPressed = event.key;
    let stringLen = mainString.length;
    let shifting = mainString.slice(bracketPos, bracketPos + bracketSize);
    let label2 = document.getElementById("main");

    if (keyPressed === "a" && bracketPos > 0) bracketPos--;
    else if (keyPressed === "d" && bracketPos + bracketSize < stringLen) bracketPos++;
    else if (keyPressed === "ArrowLeft" && shifting) 
        mainString = mainString.slice(0, bracketPos) + shiftByOne(shifting, "left") + mainString.slice(bracketPos + bracketSize);
    else if (keyPressed === "ArrowRight" && shifting) 
        mainString = mainString.slice(0, bracketPos) + shiftByOne(shifting, "right") + mainString.slice(bracketPos + bracketSize);
    else return;

    label2.textContent = bracket_first_x(mainString, bracketPos, bracketPos + bracketSize);

    if (mainString === template.slice(0, stringLen)) winGame();
}

function startGame() {
    let choice = parseInt(dropdown.value);
    let label1 = document.querySelector(".label1");

    if (choice < 8 || choice > 36) {  
        label1.textContent = "Select number from 8 to 36!";
        label1.style.color = "red";
        setTimeout(() => {
            label1.textContent = "Select character number (8-36): ";
            label1.style.color = "black";
        }, 1000);
        return;
    }

    startTime = Date.now();
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        let elapsed = Date.now() - startTime;
        label1.textContent = `Time: ${(elapsed / 1000).toFixed(3)} s`;
    }, 1);

    dropdown.style.display = "none";
    button.style.display = "none";
    restart.style.display = "inline";
    mainmenu.style.display = "inline";

    gameActive = false;
    mainString = createString(choice);
    bracketSize = Math.ceil(choice / 2);
    bracketPos = 0;
    document.getElementById("main").textContent = bracket_first_x(mainString, 0, bracketSize);

    document.addEventListener("keydown", keyHandler);
}

function mainMenu() {
    clearInterval(timerInterval);
    document.querySelector(".label1").textContent = "Select character number (8-36): ";
    dropdown.style.display = "inline";
    button.style.display = "inline";
    restart.style.display = "none";
    mainmenu.style.display = "none";
    document.getElementById("main").textContent = "";
    document.removeEventListener("keydown", keyHandler);
}

function winGame() {
    clearInterval(timerInterval);
    let elapsed = Date.now() - startTime;
    let label1 = document.querySelector(".label1");
    label1.style.color = "green";
    bracketPos = 0;
    document.getElementById("main").textContent = "";
    gameActive = false;
    let recordLabel = document.getElementById(mainString.length.toString());
    if (records[mainString.length - 8] === null || elapsed < records[mainString.length - 8]) {
        records[mainString.length - 8] = elapsed;
        recordLabel.textContent = `${mainString.length}: ${(elapsed / 1000).toFixed(3)}s`;
    }

    label1.textContent = `You win! Time: ${(elapsed / 1000).toFixed(3)} s. Record: ${(records[mainString.length - 8] / 1000).toFixed(3)} s`;
    document.removeEventListener("keydown", keyHandler);
}

function createString(len) {
    let arr = template.slice(0, len).split("");
    for (let i = arr.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join("");
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

const secretKey = "Sort16SecretKey123";

function exportRecords() {

    const data = {
        records: records
    };
    const jsonStr = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonStr, secretKey).toString();
    const encoded = btoa(encrypted);
    navigator.clipboard.writeText(encoded).then(() => {
        alert("Game records copied to clipboard!");
    }).catch(() => {
        alert("Failed to copy. Here’s the string:\n" + encoded);
    });
}

function importRecords() {
    const input = prompt("Paste your saved records string:");
    if (!input) return;
    try {
        const encrypted = atob(input);
        const bytes = CryptoJS.AES.decrypt(encrypted, secretKey);
        const data = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        if (data.records && Array.isArray(data.records)) {
            records = data.records;
            updateRecordDisplay();
            alert("Records imported successfully!");
        } else {
            alert("Invalid data!");
        }
    } catch (e) {
        alert("Failed to import records. The string may be invalid.");
    }
}

function updateRecordDisplay() {
    for (let i = 8; i <= 36; i++) {
        const recordLabel = gebi(i.toString());
        const rec = records[i - 8];
        recordLabel.textContent = `${i}: ${rec ? (rec / 1000).toFixed(3) + 's' : '--:--.---'}`;
    }
}

gebi("exportBtn").onclick = exportRecords;
gebi("importBtn").onclick = importRecords;
