<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { getContext } from 'svelte';
  import {
    TEMPLATE,
    createShuffledString,
    shiftByOne,
    formatBracketDisplay,
    checkWin
  } from '$lib/game/engine';

  const notify = getContext<(msg: string, type?: 'success' | 'error') => void>('notify');

  // --- Props from server ---
  let { data } = $props();

  // --- Auth state ---
  let user = $derived(data.user);
  let authMode = $state<'login' | 'signup'>('login');
  const initialNoUser = !data.user;
  let showAuthModal = $state(initialNoUser);
  let authUsername = $state('');
  let authPassword = $state('');
  let authLoading = $state(false);

  // --- Records state ---
  let localRecords = $state<Record<number, { time: number; moves: number; seed: string }>>({});
  let localCompletions = $state<Record<number, number>>({});
  let showCompletions = $state(false);

  // Sync server data into local state
  $effect(() => {
    const recs: Record<number, { time: number; moves: number; seed: string }> = {};
    for (const r of data.records as any[]) {
      recs[r.difficulty] = { time: r.time, moves: r.moves, seed: r.seed ?? '' };
    }
    localRecords = recs;

    const comps: Record<number, number> = {};
    for (const c of data.completions as any[]) {
      comps[c.difficulty] = c.count;
    }
    localCompletions = comps;
  });

  // --- Game state ---
  type GameState = 'menu' | 'playing' | 'won';
  let gameState = $state<GameState>('menu');
  let difficulty = $state(16);
  let gameString = $state('');
  let bracketPos = $state(0);
  let bracketSize = $derived(Math.ceil(difficulty / 2));
  let moves = $state(0);
  let seed = $state('');
  let startTime = $state(0);
  let elapsed = $state(0);
  let timerInterval = $state<ReturnType<typeof setInterval> | undefined>(undefined);

  // --- Win state ---
  let showWinPopup = $state(false);
  let winTime = $state(0);
  let winMoves = $state(0);
  let isNewRecord = $state(false);

  // --- Tutorial state ---
  let showTutorial = $state(false);
  let tutorialStage = $state(0);
  let tutorialCompleted = $state(false);
  let tutString = $state('');
  let tutBracketPos = $state(0);
  let tutBracketSize = $state(2);
  let tutMoves = $state(0);

  // --- Mobile detection ---
  let isMobile = $state(false);
  $effect(() => {
    isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  });

  // --- Formatted display ---
  let displayString = $derived(
    gameState === 'playing' ? formatBracketDisplay(gameString, bracketPos, bracketSize) : ''
  );

  let formattedTime = $derived(formatTime(elapsed));

  function formatTime(ms: number): string {
    const totalSec = ms / 1000;
    const mins = Math.floor(totalSec / 60);
    const secs = (totalSec % 60).toFixed(3);
    return `${mins.toString().padStart(2, '0')}:${secs.padStart(6, '0')}`;
  }

  function formatRecordTime(timeMs: number): string {
    const totalSec = timeMs / 1000;
    return `${totalSec.toFixed(3)}s`;
  }

  // --- Auth functions ---
  async function handleLogin() {
    authLoading = true;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUsername, password: authPassword })
      });
      const json = (await res.json()) as { error?: string; username?: string };
      if (!res.ok) {
        notify(json.error || 'Login failed', 'error');
        return;
      }
      showAuthModal = false;
      authUsername = '';
      authPassword = '';
      await invalidateAll();
      notify(`Logged in as ${json.username}`, 'success');
    } catch {
      notify('Network error', 'error');
    } finally {
      authLoading = false;
    }
  }

  async function handleSignup() {
    authLoading = true;
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUsername, password: authPassword })
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        notify(json.error || 'Registration failed', 'error');
        return;
      }
      notify('Account created! Logging in...', 'success');
      await handleLogin();
    } catch {
      notify('Network error', 'error');
    } finally {
      authLoading = false;
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await invalidateAll();
      notify('Logged out', 'success');
    } catch {
      notify('Logout failed', 'error');
    }
  }

  // --- Game functions ---
  function startGame() {
    const shuffled = createShuffledString(difficulty);
    gameString = shuffled;
    seed = shuffled;
    bracketPos = 0;
    moves = 0;
    elapsed = 0;
    startTime = Date.now();
    gameState = 'playing';
    showWinPopup = false;
    isNewRecord = false;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      elapsed = Date.now() - startTime;
    }, 10);
  }

  function restartGame() {
    gameString = seed;
    bracketPos = 0;
    moves = 0;
    elapsed = 0;
    startTime = Date.now();
    showWinPopup = false;
    isNewRecord = false;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      elapsed = Date.now() - startTime;
    }, 10);
  }

  function goToMenu() {
    gameState = 'menu';
    showWinPopup = false;
    if (timerInterval) clearInterval(timerInterval);
  }

  function revealSolution() {
    gameString = TEMPLATE.slice(0, difficulty);
    bracketPos = 0;
    if (timerInterval) clearInterval(timerInterval);
  }

  function moveBracketLeft() {
    if (gameState !== 'playing' || showWinPopup) return;
    if (bracketPos > 0) bracketPos--;
  }

  function moveBracketRight() {
    if (gameState !== 'playing' || showWinPopup) return;
    if (bracketPos + bracketSize < gameString.length) bracketPos++;
  }

  function shiftLeft() {
    if (gameState !== 'playing' || showWinPopup) return;
    const start = bracketPos;
    const end = bracketPos + bracketSize;
    const before = gameString.slice(0, start);
    const inside = gameString.slice(start, end);
    const after = gameString.slice(end);
    const shifted = shiftByOne(inside, 'left');
    gameString = before + shifted + after;
    moves++;
    if (checkWin(gameString, difficulty)) {
      handleWin();
    }
  }

  function shiftRight() {
    if (gameState !== 'playing' || showWinPopup) return;
    const start = bracketPos;
    const end = bracketPos + bracketSize;
    const before = gameString.slice(0, start);
    const inside = gameString.slice(start, end);
    const after = gameString.slice(end);
    const shifted = shiftByOne(inside, 'right');
    gameString = before + shifted + after;
    moves++;
    if (checkWin(gameString, difficulty)) {
      handleWin();
    }
  }

  async function handleWin() {
    if (timerInterval) clearInterval(timerInterval);
    winTime = elapsed / 1000;
    winMoves = moves;
    gameState = 'won';

    // Check if new record (compare in ms)
    const existing = localRecords[difficulty];
    if (!existing || elapsed < existing.time) {
      isNewRecord = true;
      localRecords[difficulty] = { time: elapsed, moves: winMoves, seed };
      localRecords = { ...localRecords };
    }

    // Increment local completion
    localCompletions[difficulty] = (localCompletions[difficulty] || 0) + 1;
    localCompletions = { ...localCompletions };

    showWinPopup = true;

    // Submit to server if logged in
    if (user) {
      try {
        await Promise.all([
          fetch('/api/records/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ time: elapsed, difficulty, moves: winMoves, seed })
          }),
          fetch('/api/completions/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ difficulty })
          })
        ]);
      } catch {
        // Silent fail for server submission
      }
    }
  }

  // --- Keyboard handler ---
  function handleKeydown(e: KeyboardEvent) {
    if (showAuthModal || showTutorial) return;
    if (gameState !== 'playing') return;

    switch (e.key.toLowerCase()) {
      case 'a':
        e.preventDefault();
        moveBracketLeft();
        break;
      case 'd':
        e.preventDefault();
        moveBracketRight();
        break;
      case 'arrowleft':
        e.preventDefault();
        shiftLeft();
        break;
      case 'arrowright':
        e.preventDefault();
        shiftRight();
        break;
      case 'r':
        e.preventDefault();
        restartGame();
        break;
    }
  }

  // --- Tutorial functions ---
  function openTutorial() {
    const done = localStorage.getItem('tutorialCompleted');
    tutorialCompleted = done === 'true';
    if (tutorialCompleted) {
      showTutorial = true;
      return;
    }
    tutorialStage = 1;
    tutString = '3021';
    tutBracketPos = 0;
    tutBracketSize = 2;
    tutMoves = 0;
    showTutorial = true;
  }

  function tutMoveBracketLeft() {
    if (tutBracketPos > 0) tutBracketPos--;
  }

  function tutMoveBracketRight() {
    if (tutBracketPos + tutBracketSize < tutString.length) tutBracketPos++;
  }

  function tutShiftLeft() {
    const start = tutBracketPos;
    const end = tutBracketPos + tutBracketSize;
    const before = tutString.slice(0, start);
    const inside = tutString.slice(start, end);
    const after = tutString.slice(end);
    tutString = before + shiftByOne(inside, 'left') + after;
    tutMoves++;
    checkTutorialWin();
  }

  function tutShiftRight() {
    const start = tutBracketPos;
    const end = tutBracketPos + tutBracketSize;
    const before = tutString.slice(0, start);
    const inside = tutString.slice(start, end);
    const after = tutString.slice(end);
    tutString = before + shiftByOne(inside, 'right') + after;
    tutMoves++;
    checkTutorialWin();
  }

  function checkTutorialWin() {
    if (tutorialStage === 1 && tutString === '0123') {
      setTimeout(() => {
        tutorialStage = 2;
        tutString = '502413';
        tutBracketPos = 0;
        tutBracketSize = 3;
        tutMoves = 0;
      }, 500);
    } else if (tutorialStage === 2 && tutString === '012345') {
      tutorialCompleted = true;
      localStorage.setItem('tutorialCompleted', 'true');
    }
  }

  function handleTutorialKeydown(e: KeyboardEvent) {
    if (!showTutorial || tutorialCompleted) return;
    switch (e.key.toLowerCase()) {
      case 'a':
        e.preventDefault();
        tutMoveBracketLeft();
        break;
      case 'd':
        e.preventDefault();
        tutMoveBracketRight();
        break;
      case 'arrowleft':
        e.preventDefault();
        tutShiftLeft();
        break;
      case 'arrowright':
        e.preventDefault();
        tutShiftRight();
        break;
    }
  }

  let tutDisplayString = $derived(
    showTutorial && !tutorialCompleted
      ? formatBracketDisplay(tutString, tutBracketPos, tutBracketSize)
      : ''
  );

  // Difficulty levels
  const difficulties = Array.from({ length: 29 }, (_, i) => i + 8);
</script>

<svelte:window
  onkeydown={(e) => {
    if (showTutorial) handleTutorialKeydown(e);
    else handleKeydown(e);
  }}
/>

<!-- Auth Modals -->
{#if showAuthModal}
  <div class="auth-modal active" role="presentation">
    <!-- svelte-ignore a11y_interactive_supports_focus -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="auth-modal-content" role="dialog" aria-modal="true" onclick={(e) => e.stopPropagation()}>
      <h2>{authMode === 'login' ? 'Login' : 'Create Account'}</h2>
      <form
        onsubmit={(e) => {
          e.preventDefault();
          authMode === 'login' ? handleLogin() : handleSignup();
        }}
      >
        <input
          type="text"
          placeholder="Username"
          bind:value={authUsername}
          autocomplete="username"
        />
        <input
          type="password"
          placeholder="Password"
          bind:value={authPassword}
          autocomplete={authMode === 'login' ? 'current-password' : 'new-password'}
        />
        <button type="submit" disabled={authLoading}>
          {authLoading ? 'Loading...' : authMode === 'login' ? 'Login' : 'Create Account'}
        </button>
      </form>
      <p>
        {#if authMode === 'login'}
          Don't have an account?
          <!-- svelte-ignore a11y_interactive_supports_focus -->
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <span class="link" role="button" onclick={() => (authMode = 'signup')}>Create one</span>
        {:else}
          Already have an account?
          <!-- svelte-ignore a11y_interactive_supports_focus -->
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <span class="link" role="button" onclick={() => (authMode = 'login')}>Login</span>
        {/if}
      </p>
    </div>
  </div>
{/if}

<!-- Records Sidebar -->
<div class="records">
  <div class="records-header">
    <h2>{showCompletions ? 'Completions:' : 'Records (s):'}</h2>
    <button onclick={() => (showCompletions = !showCompletions)}>
      {showCompletions ? 'Records' : 'Completions'}
    </button>
  </div>
  <div id="record-list">
    {#each difficulties as d}
      <p class="record-label">
        <button
          class="trophy-btn"
          onclick={() => window.open(`/leaderboard?difficulty=${d}`, '_blank')}
          title="Leaderboard for difficulty {d}"
        >&#x1F3C6;</button>
        <button
          class="leaderboard-btn"
          onclick={() => window.open(`/completions?difficulty=${d}`, '_blank')}
          title="Completions for difficulty {d}"
        >&#x1F4CA;</button>
        <span>
          {#if showCompletions}
            {d}: {localCompletions[d] || 0}
          {:else if localRecords[d]}
            {d}: {formatRecordTime(localRecords[d].time)}
          {:else}
            {d}: --:--.---
          {/if}
        </span>
      </p>
    {/each}
  </div>
</div>

<!-- Main Menu / Game Area -->
<div class="mainmenu">
  <div class="mainmenu-header">
    {#if user}
      <p id="loggedin">Logged in as <strong>{user.username}</strong></p>
      <button id="logout" class="logout-btn" onclick={handleLogout}>Log out</button>
    {:else}
      <button onclick={() => { authMode = 'login'; showAuthModal = true; }}>Log in</button>
    {/if}
    <h1 id="mainheader">Sort16</h1>
  </div>

  {#if gameState === 'menu'}
    <h2 id="difficulty">Difficulty</h2>
    <h3 class="label1">Select character number (8-36):</h3>
    <select bind:value={difficulty}>
      {#each difficulties as d}
        <option value={d}>{d}</option>
      {/each}
    </select>
    <button onclick={startGame} id="play">Play</button>
    <button onclick={openTutorial} id="tutorialBtn">Tutorial</button>
  {:else}
    <h2>{formattedTime}</h2>
    <p id="main">{displayString}</p>
    <div id="button-container">
      <button onclick={restartGame}>Restart</button>
      <button onclick={goToMenu}>Main menu</button>
      <button onclick={revealSolution}>Reveal solution</button>
    </div>
    <span id="solution"></span>

    {#if isMobile}
      <div class="mobileControls">
        <h2>Mobile Controls:</h2>
        <div>
          <p>Brackets:</p>
          <button onclick={moveBracketLeft}>Left</button>
          <button onclick={moveBracketRight}>Right</button>
          <p>Characters:</p>
          <button onclick={shiftLeft}>Shift left</button>
          <button onclick={shiftRight}>Shift right</button>
        </div>
      </div>
    {/if}
  {/if}

  <!-- Tutorial Modal -->
  {#if showTutorial}
    <div class="modal" style="display: block;" role="presentation">
      <!-- svelte-ignore a11y_interactive_supports_focus -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div class="modal-content" role="dialog" aria-modal="true" onclick={(e) => e.stopPropagation()}>
        <!-- svelte-ignore a11y_interactive_supports_focus -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <span class="close" role="button" onclick={() => (showTutorial = false)}>&times;</span>
        <h2>How to Play</h2>

        {#if tutorialCompleted}
          <p id="tutorial_string" style="font-size: 14px;">
            {#if tutorialStage === 0}
              Tutorial already completed!
            {:else}
              Tutorial completed! Now go ahead and try 8 characters! If you're stuck, search sort16 solution on YouTube!
            {/if}
          </p>
        {:else}
          <p>Welcome to <strong>Sort16</strong>!</p>
          <div class="tutorial-row">
            <span class="key">A</span>
            <span class="text">Moves the bracket to the left</span>
          </div>
          <div class="tutorial-row">
            <span class="key">D</span>
            <span class="text">Moves the bracket to the right</span>
          </div>
          <div class="tutorial-row">
            <span class="key">&#8592;</span>
            <span class="text">Shift characters inside the bracket left</span>
          </div>
          <div class="tutorial-row">
            <span class="key">&#8594;</span>
            <span class="text">Shift characters inside the bracket right</span>
          </div>

          <h2 id="goal">Goal</h2>
          <p id="scrambled">Sort the scrambled into the original form - 0-9,A-Z!</p>
          <p id="try">Here, try it out:</p>
          <p id="tutorial_string">{tutDisplayString}</p>

          {#if isMobile}
            <div class="mobileControls" style="margin-top: 20px;">
              <div>
                <button onclick={tutMoveBracketLeft}>A</button>
                <button onclick={tutMoveBracketRight}>D</button>
              </div>
              <div>
                <button onclick={tutShiftLeft}>&#8592;</button>
                <button onclick={tutShiftRight}>&#8594;</button>
              </div>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  {/if}

  <!-- Win Popup -->
  {#if showWinPopup}
    <div class="popup" role="presentation">
      <div class="popup-content" role="dialog" aria-modal="true">
        <!-- svelte-ignore a11y_interactive_supports_focus -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <span class="close" role="button" onclick={() => { showWinPopup = false; goToMenu(); }}>&times;</span>
        <h1>YOU WIN!</h1>
        <table class="popup-stats">
          <tbody>
            <tr>
              <th class="left">Difficulty</th>
              <th class="right">Time</th>
            </tr>
            <tr>
              <td class="left">{difficulty}</td>
              <td class="right">{winTime.toFixed(3)}s</td>
            </tr>
            <tr>
              <th class="left">Moves</th>
              <th class="right">Seed</th>
            </tr>
            <tr>
              <td class="left">{winMoves}</td>
              <td class="right">{seed}</td>
            </tr>
            <tr>
              <th class="left" colspan="2">Record</th>
            </tr>
            <tr>
              <td colspan="2">
                {#if isNewRecord}
                  <span>{winTime.toFixed(3)}s</span>
                  <span class="new-best">New best!</span>
                {:else}
                  <span>
                    {localRecords[difficulty]
                      ? formatRecordTime(localRecords[difficulty].time)
                      : winTime.toFixed(3) + 's'}
                  </span>
                {/if}
              </td>
            </tr>
          </tbody>
        </table>
        <div class="popup-buttons">
          <button onclick={() => { showWinPopup = false; startGame(); }}>Play again</button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  /* ====== Records Sidebar ====== */
  .records {
    width: 20vw;
    height: 90vh;
    margin-right: 20px;
    background: var(--panel-bg);
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    padding: 20px;
    overflow-y: auto;
    transition: background 0.3s;
  }

  .records h2 {
    font-size: 1.3em;
    margin-bottom: 15px;
    padding-left: 35px;
    color: var(--text-color);
  }

  .records :global(p) {
    font-size: 1em;
    margin: 8px 0;
    padding: 6px 10px;
    border-radius: 6px;
    transition: background 0.2s, color 0.2s;
  }

  .records :global(p:hover) {
    background: var(--hover-bg);
    cursor: pointer;
  }

  .records-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 5px;
  }

  .records-header button:hover {
    opacity: 0.8;
  }

  .record-label {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .trophy-btn, .leaderboard-btn {
    cursor: pointer;
    border: none;
    background: transparent;
    font-size: 1em;
    padding: 0;
  }

  .trophy-btn:hover, .leaderboard-btn:hover {
    transform: scale(1.3);
    background: transparent;
  }

  .records::-webkit-scrollbar {
    width: 8px;
  }

  .records::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  .records::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
  }

  .records::-webkit-scrollbar-thumb:hover {
    background: #a0a0a0;
  }

  /* ====== Main Menu ====== */
  .mainmenu {
    flex: 1;
    background: var(--panel-bg);
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    transition: background 0.3s;
  }

  .mainmenu h1, .mainmenu h3 {
    color: var(--text-color);
  }

  .mainmenu-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    position: relative;
    margin-top: 20px;
  }

  .mainmenu-header h1 {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    margin: 0;
    font-size: 2em;
    text-align: center;
  }

  .mainmenu-header button {
    margin-right: auto;
    margin-bottom: 20px;
  }

  .logout-btn {
    height: 2em;
    line-height: 0.5em;
    font-size: 0.8em;
    margin-top: 1.2vw;
    margin-left: 1vw;
  }

  #loggedin {
    margin-top: 1.2vw;
    font-size: 0.9em;
  }

  /* ====== Game String Display ====== */
  #main {
    font-size: 2em;
    font-family: 'Courier New', Courier, monospace;
    margin-top: 30px;
    word-break: break-word;
    color: var(--text-color);
    white-space: pre-wrap;
  }

  #button-container {
    display: flex;
    gap: 10px;
  }

  /* ====== Mobile Controls ====== */
  .mobileControls {
    margin-top: 150px;
    width: 100%;
    display: flex;
    flex-direction: column;
    text-align: center;
    gap: 10px;
  }

  .mobileControls div {
    display: flex;
    justify-content: center;
    gap: 10px;
  }

  .mobileControls button {
    height: 100px;
    width: 150px;
    font-size: 20px;
  }

  .mobileControls p {
    margin: 0;
    color: var(--text-color);
    font-size: 28px;
    justify-content: center;
    align-self: center;
  }

  /* ====== Tutorial Modal ====== */
  .modal {
    display: none;
    position: fixed;
    z-index: 200;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background: rgba(0, 0, 0, 0.6);
  }

  .modal-content {
    background: var(--panel-bg);
    color: var(--text-color);
    margin: 10% auto;
    padding: 20px;
    border-radius: 12px;
    display: block;
    width: 80%;
    max-width: 500px;
    box-shadow: 0 6px 15px rgba(0,0,0,0.2);
    animation: fadeIn 0.3s ease;
  }

  .modal-content h2 {
    margin-top: 0;
    color: var(--primary-color);
  }

  .close {
    float: right;
    font-size: 1.5em;
    cursor: pointer;
    color: var(--text-color);
  }

  .close:hover {
    color: var(--primary-color);
  }

  .tutorial-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 8px 0;
  }

  .key {
    background-color: #666a72;
    border: 3px solid #1f2937;
    border-radius: 4px;
    padding: 4px 8px;
    min-width: 24px;
    text-align: center;
    color: white;
    font-weight: bold;
    flex-shrink: 0;
  }

  .text {
    flex: 1;
  }

  #tutorial_string {
    text-align: center;
    font-weight: 700;
    font-size: 1.5em;
    margin: 0;
    white-space: pre-wrap;
    margin-top: 10px;
  }

  #goal {
    margin-top: 10px;
  }

  #scrambled {
    margin: 0;
  }

  #try {
    margin: 0;
  }

  /* ====== Win Popup ====== */
  .popup {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999;
  }

  .popup-content {
    background: var(--bg-color);
    border-radius: 15px;
    padding: 30px 40px;
    text-align: center;
    width: 400px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    color: var(--text-color);
    animation: popupFade 0.7s ease-out;
    position: relative;
  }

  .popup-content h1 {
    color: #2ecc71;
    margin-bottom: 20px;
  }

  .popup-stats {
    width: 100%;
    border-collapse: collapse;
    margin: 10px auto 0;
    font-size: 16px;
    text-align: left;
  }

  .popup-stats th,
  .popup-stats td {
    padding: 8px 12px;
  }

  .popup-stats :global(th.left),
  .popup-stats :global(td.left) {
    text-align: left;
  }

  .popup-stats :global(th.right),
  .popup-stats :global(td.right) {
    text-align: right;
  }

  .popup-stats th {
    padding-bottom: 3px;
  }

  .popup-stats td {
    padding-top: 3px;
  }

  .popup-buttons {
    margin-top: 20px;
    display: flex;
    justify-content: space-around;
  }

  .popup-buttons button {
    padding: 10px 20px;
    font-size: 16px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    background: #3498db;
    color: white;
    transition: 0.2s;
  }

  .popup-buttons button:hover {
    background: #2980b9;
  }

  .new-best {
    background: orange;
    color: black;
    border-radius: 6px;
    padding: 2px 6px;
    font-size: 12px;
    margin-left: 6px;
  }

  /* ====== Auth Modal ====== */
  .auth-modal {
    display: none;
    opacity: 0;
    transition: opacity 0.3s ease;
    position: fixed;
    z-index: 9999;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    justify-content: center;
    align-items: center;
  }

  .auth-modal.active {
    display: flex;
    opacity: 1;
  }

  .auth-modal-content {
    background: var(--panel-bg, #fff);
    color: var(--text-color, #333);
    padding: 30px 40px;
    border-radius: 12px;
    width: 90%;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 6px 15px rgba(0,0,0,0.2);
  }

  .auth-modal-content input {
    width: 80%;
    padding: 10px;
    margin: 10px 0;
    border-radius: 6px;
    border: 1px solid var(--panel-bg);
    background-color: var(--hover-bg);
    display: block;
    margin-left: auto;
    margin-right: auto;
  }

  .auth-modal-content form {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .auth-modal-content button {
    padding: 10px 20px;
    margin-top: 10px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    background: var(--primary-color, #3b82f6);
    color: white;
    font-size: 1em;
  }

  .auth-modal-content .link {
    color: var(--primary-color, #3b82f6);
    cursor: pointer;
    text-decoration: underline;
    background: none;
    border: none;
    font-size: inherit;
    padding: 0;
  }

  /* ====== Responsive ====== */
  @media (max-width: 1200px) {
    .records {
      width: 100%;
      height: auto;
      margin: 0;
      order: 2;
      margin-top: 20px;
    }

    .mainmenu {
      width: 100%;
      order: 1;
    }
  }

  @media (max-width: 650px) {
    .mainmenu h1 {
      font-size: 1.8em;
    }

    .mainmenu h3.label1 {
      font-size: 1em;
      text-align: center;
    }

    #main {
      font-size: 1.5em;
      word-break: break-word;
      text-align: center;
    }

    .mobileControls {
      margin-top: 20px;
      gap: 8px;
    }

    .mobileControls div {
      flex-direction: column;
      gap: 5px;
    }

    .mobileControls button {
      width: 100%;
      height: 60px;
      font-size: 16px;
    }

    .mobileControls p {
      font-size: 20px;
    }
  }
</style>
