const secretKey = "Sort16SecretKey123";
const popup = document.getElementById('winPopup');
const closePopup = document.getElementById("closePopup");
const mobile = document.getElementById("mobileControls");

function showWinPopup(difficulty, time, moves, seed, record, isNewBest) {
    document.getElementById('popupDifficulty').textContent = difficulty;
    document.getElementById('popupTime').textContent = time.toFixed(3);
    document.getElementById('popupMoves').textContent = moves;
    document.getElementById('popupSeed').textContent = seed;
    document.getElementById('popupRecord').textContent = record.toFixed(3) + "s";
    document.getElementById('newBest').style.display = isNewBest ? 'inline-block' : 'none';
    
    popup.classList.remove('hidden');
}

function hideWinPopup() {
    popup.classList.add('hidden');
}

function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
}
  
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
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

function showMoves() {
    sol.textContent = movesArr.join(",");
    sol.style.display = "block";
}

function exportRecords() {

    const data = {
        records: records,
        completions: completions,
        averageTimes: averageTimes
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
            completions = data.completions;
            averageTimes = data.averageTimes;
            updateRecordDisplay();
            alert("Records imported successfully!");
        } else {
            alert("Invalid data!");
        }
    } catch (e) {
        alert("Failed to import records. The string may be invalid.");
    }
}