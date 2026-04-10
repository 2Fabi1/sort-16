const secretKey = "Sort16SecretKey123";
const popup = document.getElementById('winPopup');
const closePopup = document.getElementById("closePopup");
const mobile = document.getElementById("mobileControls");

function showWinPopup(difficulty, time, moves, seed, record, isNewBest) {
    document.getElementById('popupDifficulty').textContent = difficulty;
    document.getElementById('popupTime').textContent = time.toFixed(3);
    document.getElementById('popupMoves').textContent = moves;
    document.getElementById('popupSeed').textContent = seed;
    document.getElementById('popupRecord').textContent = record ? record.toFixed(3) + "s" : time.toFixed(3) + "s";
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

function showAuthNotification(message, type = "green") {
  const notif = document.getElementById("authNotification");
  notif.textContent = message;
  notif.className = ""; // reset classes
  notif.classList.add(type);
  
  notif.style.backgroundColor = type;
  notif.style.opacity = "1";
  notif.style.transform = "translateX(-50%) translateY(0)";
  
  // Hide after 3s
  setTimeout(() => {
    notif.style.opacity = "0";
    notif.style.transform = "translateX(-50%) translateY(-20px)";
  }, 3000);
}
