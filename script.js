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
let moveNum = 0;
let seed = "";
let ign = "Anonymous";

let records = Array(29).fill(null);
let completions = Array(29).fill(0);
let averageTimes = Array(29).fill(0);

const recordList = document.getElementById('record-list');
const dropdown = document.getElementById('choice');
const button = document.getElementById("play");
const restart = document.getElementById("restart");
const mainmenu = document.getElementById("menu");
const difficulty = document.getElementById("difficulty");
const main = document.getElementById("main");
const label1 = document.querySelector(".label1");
const mobileControls = document.getElementById("mobileControls");
const sort16header = document.getElementById("mainheader");

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

    if (keyPressed === "a" && bracketPos > 0) {
        bracketPos--;
        moveNum++;
    }
    else if (keyPressed === "d" && bracketPos + bracketSize < stringLen) {
        bracketPos++;
        moveNum++;
    }
    else if (keyPressed === "ArrowLeft" && shifting) {
        mainString = mainString.slice(0, bracketPos) + shiftByOne(shifting, "left") + mainString.slice(bracketPos + bracketSize);
        moveNum++;
    }
    else if (keyPressed === "ArrowRight" && shifting) {
        mainString = mainString.slice(0, bracketPos) + shiftByOne(shifting, "right") + mainString.slice(bracketPos + bracketSize);
        moveNum++;
    }
    else return;

    label2.textContent = bracket_first_x(mainString, bracketPos, bracketPos + bracketSize);

    if (mainString === template.slice(0, stringLen)) winGame();
}

function startGame() {
    let choice = parseInt(dropdown.value);
    
    difficulty.textContent = `Difficulty: ${choice} characters`;
    label1.style.color = "";
    moveNum = 0;
    seed="";
    
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
    }, 1);

    dropdown.style.display = "none";
    button.style.display = "none";
    restart.style.display = "inline";
    mainmenu.style.display = "inline";
    if (isMobile()){
        mobileControls.style.display = "inline";
    }
    gameActive = true;
    mainString = createString(choice);
    seed = mainString;
    bracketSize = Math.ceil(choice / 2);
    bracketPos = 0;
    document.getElementById("main").textContent = bracket_first_x(mainString, 0, bracketSize);

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
    mobileControls.style.display = "none";
    difficulty.textContent = "";
    main.textContent = "";
    document.removeEventListener("keydown", keyHandler);
}

function winGame() {
    clearInterval(timerInterval);
    let elapsed = Date.now() - startTime;
    label1.style.color = "green";
    bracketPos = 0;
    document.getElementById("main").textContent = "";
    mobileControls.style.display = "none";
    restart.style.display = "none";
    mainmenu.style.display = "none";
    gameActive = false;
    let idx = mainString.length - 8;
    if (records[idx] === null || elapsed < records[idx]) {
        records[idx] = elapsed;
    }
    label1.textContent = `You win! Time: ${(elapsed / 1000).toFixed(3)} s. Record: ${(records[idx] / 1000).toFixed(3)} s`;
    document.removeEventListener("keydown", keyHandler);

    //stats update
    completions[idx]++;
    averageTimes[idx] = ((averageTimes[idx] * (completions[idx] - 1)) + elapsed) / completions[idx];
    sendResult(ign, mainString.length, elapsed, seed, moveNum);
    let recordTime = records[mainString.length - 8] / 1000;
    let isNewBest = elapsed / 1000 <= recordTime;
    

    updateRecordDisplay();
    mainMenu();

    showWinPopup(
        mainString.length,
        elapsed / 1000,
        moveNum,
        seed,
        recordTime,
        isNewBest
    );
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

async function sendResult(playerName, difficulty, best_time, seed, moves) {
    try {
        // Get the user ID
        const { data: userData, error: userError } = await database
            .from('users')
            .select('id')
            .eq('username', playerName)
            .maybeSingle();

        if (userError) {
            console.error('Error fetching user:', userError);
            return;
        }

        if (!userData) {
            console.error('User not found');
            return;
        }

        const userId = userData.id;

        // Helper function to insert or update a table
        async function upsert(table, match, insertData, updateData) {
            const { data: existing, error: fetchError } = await database
                .from(table)
                .select('*')
                .match(match)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error(`Error fetching ${table}:`, fetchError);
                return null;
            }

            if (!existing) {
                const { data, error } = await database
                    .from(table)
                    .insert([insertData]);
                if (error) console.error(`Error inserting into ${table}:`, error);
                return data;
            } else {
                const { data, error } = await database
                    .from(table)
                    .update(updateData)
                    .eq('id', existing.id);
                if (error) console.error(`Error updating ${table}:`, error);
                return data;
            }
        }

        // Scores: only update if better
        const existingScore = await database
            .from('scores')
            .select('*')
            .match({ player: playerName, difficulty })
            .single();

        if (!existingScore.data || best_time < existingScore.data.best_time) {
            await upsert(
                'scores',
                { player: playerName, difficulty },
                { player: playerName, difficulty, best_time, moves, seed, created_at: new Date().toISOString() },
                { best_time, moves, seed, created_at: new Date().toISOString() }
            );
        } else {
            console.warn('Score not updated: not better than existing.');
        }

        // Completions: include both FK and username
        const currentCompletions = completions[difficulty - 8];
        await upsert(
            'completions',
            { user_id: userId, difficulty },
            { user_id: userId, username: playerName, difficulty, completions: currentCompletions },
            { username: playerName, completions: currentCompletions }
        );

        console.log('Result processed successfully.');
    } catch (err) {
        console.error(err);
    }
}




const tutorialBtn = document.getElementById("tutorialBtn");
const tutorialModal = document.getElementById("tutorialModal");
const closeTutorial = document.getElementById("closeTutorial");

tutorialBtn.addEventListener("click", () => {
    tutorialModal.style.display = "block";
    tutorialModal.className = "modal active";
});

closeTutorial.addEventListener("click", () => {
    tutorialModal.style.display = "none";
    tutorialModal.className = "modal inactive";
});

// Close if user clicks outside modal
window.addEventListener("click", (e) => {
    if (e.target === tutorialModal) {
        tutorialModal.style.display = "none";
    }
});


function initializeRecordDisplay() {

    for (let i = 8; i <= 36; i++) {
        let recordLabel = document.getElementById(i.toString());

        // If it doesn't exist, create it and append to container
        if (!recordLabel) {
            recordLabel = document.createElement('div');
            recordLabel.id = i.toString();
            document.getElementById('record-list').appendChild(recordLabel);
        }

        recordLabel.classList.add('record-label');

        // Trophy button: only create if not already present
        if (!recordLabel.querySelector('.trophy-btn')) {
            const trophyBtn = document.createElement('button');
            trophyBtn.textContent = "🏆";
            trophyBtn.classList.add('trophy-btn');
            trophyBtn.onclick = () => {
                const url = `leaderboards/difficultyLeaderboard.html?difficulty=${i}`;
                window.open(url, "_blank");
            };
            recordLabel.appendChild(trophyBtn);
            // Create leaderboard button
            const leaderboardBtn = document.createElement('button');
            leaderboardBtn.textContent = "📊";
            leaderboardBtn.classList.add('leaderboard-btn'); // optional class for styling
            leaderboardBtn.style.cursor = "pointer";
            leaderboardBtn.style.border = "none";
            leaderboardBtn.style.background = "transparent";
            leaderboardBtn.style.fontSize = "1em";

            leaderboardBtn.onclick = () => {
                const url = `leaderboards/completionsLeaderboard.html?completions=${i}`;
                window.open(url, "_blank");
            };

            // Append it to the label, next to the trophy button
            recordLabel.appendChild(leaderboardBtn);

        }

        // Text span: only create if not already present
        if (!recordLabel.querySelector('.record-text')) {
            const textSpan = document.createElement('span');
            textSpan.classList.add('record-text');
            textSpan.textContent = `${i}: --:--.---`;
            recordLabel.appendChild(textSpan);
        }
    }
}



// Update only the text content without adding new elements
function updateRecordDisplay() {
    for (let i = 8; i <= 36; i++) {
        const recordLabel = document.getElementById(i.toString());
        if (!recordLabel) continue; // skip missing elements

        let textSpan = recordLabel.querySelector('.record-text');
        let trophyBtn = recordLabel.querySelector('.trophy-btn');

        // Create trophy button if missing
        if (!trophyBtn) {
            trophyBtn = document.createElement('button');
            trophyBtn.textContent = "🏆";
            trophyBtn.classList.add('trophy-btn');
            trophyBtn.onclick = () => {
                const url = `leaderboards/leaderboard.html?difficulty=${i}`;
                window.open(url, "_blank");
            };
            recordLabel.insertBefore(trophyBtn, textSpan);
        }

        // Create text span if missing
        if (!textSpan) {
            textSpan = document.createElement('span');
            textSpan.classList.add('record-text');
            recordLabel.appendChild(textSpan);
        }

        // Update the text
        const rec = records[i - 8];
        textSpan.textContent = `${i}: ${rec ? (rec / 1000).toFixed(3) + 's' : '--:--.---'}`;
    }
}





function showWinPopup(difficulty, time, moves, seed, record, isNewBest) {
    document.getElementById('popupDifficulty').textContent = difficulty;
    document.getElementById('popupTime').textContent = time.toFixed(3);
    document.getElementById('popupMoves').textContent = moves;
    document.getElementById('popupSeed').textContent = seed;
    document.getElementById('popupRecord').textContent = record.toFixed(3) + "s";
    document.getElementById('newBest').style.display = isNewBest ? 'inline-block' : 'none';
    mobileControls.style.display = "none";
    
    popup.classList.remove('hidden');
}

const popup = document.getElementById('winPopup');
const closePopup = document.getElementById("closePopup");

function hideWinPopup() {
    popup.classList.add('hidden');
}

closePopup.addEventListener("click", () => {
    popup.style.display = "none";
});

function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

window.openAuthModal = function(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("active");
  sort16header.style.marginTop = "2.5vw";
  label1.style.marginTop = "4vw";
};

window.closeAuthModal = function(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("active");
  sort16header.style.marginTop = "0vw";
  label1.style.marginTop = "0vw";
};

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
        syncData(ign);   
    }
});

// Signup
window.signup = async function() {
    const username = document.getElementById("signupUsername").value;
    const password = document.getElementById("signupPassword").value;

    if (!username || !password) return showAuthNotification("Enter username and password", "red");

    const { data: existing, error: fetchError } = await database
        .from('users')
        .select('*')
        .eq('username', username);

    if (fetchError) return showAuthNotification(fetchError.message, "red");
    if (existing.length > 0) return showAuthNotification("Username already exists", "red");

    const { data, error } = await database
        .from('users')
        .insert([{ username, password, created_at: new Date().toISOString() }]);

    if (error) return showAuthNotification(error.message, "red");

    showAuthNotification("Account created successfully!", "green");
    closeAuthModal('signupModal');
    openAuthModal('loginModal');
};

const logged = document.getElementById("loggedin");
const logoutBtn = document.getElementById("logout");

async function syncData(username){
    const { data: scoresData, error: scoresError } = await database
        .from('scores')
        .select('*')
        .eq('player', username);

    if (scoresError) {
        console.error('Error fetching scores:', scoresError);
    } else {
        console.log('User scores:', scoresData);
        scoresData.forEach(element => {
            const idx = element.difficulty - 8;
            records[idx] = element.best_time; // update the records array
        });
        updateRecordDisplay(); // refresh the UI
    }
}

// Login
window.login = async function() {
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;

    if (!username || !password) return showAuthNotification("Enter username and password", "red");

    const { data, error } = await database
        .from('users')
        .select('*')
        .eq('username', username);

    if (error) return showAuthNotification(error.message, "red");
    if (!data || data.length === 0) return showAuthNotification("User not found", "red");

    const user = data[0];

    if (user.password !== password) return showAuthNotification("Incorrect password", "red");
    
    localStorage.setItem("loggedInUser", username);
    showAuthNotification("Logged in successfully!", "green");
    logged.style.display = "flex";
    logoutBtn.style.display = "flex";
    logged.textContent += username;

    syncData(username);

    closeAuthModal('loginModal');
};

function logOut() {
    localStorage.removeItem("loggedInUser", ign);
    showAuthNotification("Logged out!", "green");
    logged.style.display = "none";
    sort16header.style.marginTop = "2.5vw";
    label1.style.marginTop = "4vw";
    logged.textContent = logged.textContent.slice(0,14);
    logoutBtn.style.display = "none";
    records = Array(29).fill(null);
    updateRecordDisplay();
    openAuthModal('loginModal');
}

window.addEventListener("DOMContentLoaded", () => {
  const loggedInUser = localStorage.getItem("loggedInUser");
  if (!loggedInUser) {
    openAuthModal("loginModal");
  }
  else {
    logged.style.display = "flex";
    logoutBtn.style.display = "flex";
    logged.textContent += loggedInUser;
  }
});

function showAuthNotification(message, type = "success") {
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
