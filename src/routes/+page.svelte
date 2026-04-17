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

<div class="page-wrapper">
  <!-- Auth Section -->
  <div class="auth-bar">
    {#if user}
      <span class="auth-user">Logged in as <strong>{user.username}</strong></span>
      <button class="auth-btn" onclick={handleLogout}>Log out</button>
    {:else}
      <button
        class="auth-btn"
        onclick={() => {
          authMode = 'login';
          showAuthModal = true;
        }}
      >
        Log in
      </button>
    {/if}
  </div>

  <div class="main-layout">
    <!-- Records Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h3>{showCompletions ? 'Completions:' : 'Records (s):'}</h3>
        <button class="toggle-btn" onclick={() => (showCompletions = !showCompletions)}>
          {showCompletions ? 'Records' : 'Completions'}
        </button>
      </div>
      <div class="records-list">
        {#each difficulties as d}
          <div class="record-row">
            <a
              class="icon-link"
              href="/leaderboard?difficulty={d}"
              target="_blank"
              rel="noopener noreferrer"
              title="Leaderboard for difficulty {d}"
            >&#x1F3C6;</a>
            <a
              class="icon-link"
              href="/completions?difficulty={d}"
              target="_blank"
              rel="noopener noreferrer"
              title="Completions for difficulty {d}"
            >&#x1F4CA;</a>
            <span class="record-text">
              {#if showCompletions}
                {d}: {localCompletions[d] || 0}
              {:else if localRecords[d]}
                {d}: {formatRecordTime(localRecords[d].time)}
              {:else}
                {d}: --:--.---
              {/if}
            </span>
          </div>
        {/each}
      </div>
    </aside>

    <!-- Game Area -->
    <main class="game-area">
      {#if gameState === 'menu'}
        <div class="menu-screen">
          <h1 class="game-title">Sort16</h1>
          <div class="menu-controls">
            <label class="diff-label">
              Difficulty:
              <select bind:value={difficulty}>
                {#each difficulties as d}
                  <option value={d}>{d}</option>
                {/each}
              </select>
            </label>
            <button class="play-btn" onclick={startGame}>Play</button>
            <button class="tutorial-btn" onclick={openTutorial}>Tutorial</button>
          </div>
        </div>
      {:else}
        <div class="game-screen">
          <div class="game-info">
            <span class="game-difficulty">Difficulty: {difficulty} characters</span>
            <span class="game-timer">{formattedTime}</span>
          </div>

          <div class="game-display">
            <pre class="bracket-display">{displayString}</pre>
          </div>

          {#if isMobile}
            <div class="mobile-controls">
              <div class="control-row">
                <button class="mobile-btn" onclick={moveBracketLeft}>A<br /><small>Bracket Left</small></button>
                <button class="mobile-btn" onclick={moveBracketRight}>D<br /><small>Bracket Right</small></button>
              </div>
              <div class="control-row">
                <button class="mobile-btn shift-btn" onclick={shiftLeft}>&larr;<br /><small>Shift Left</small></button>
                <button class="mobile-btn shift-btn" onclick={shiftRight}>&rarr;<br /><small>Shift Right</small></button>
              </div>
            </div>
          {/if}

          <div class="game-actions">
            <button onclick={restartGame}>Restart</button>
            <button onclick={goToMenu}>Main Menu</button>
            <button class="reveal-btn" onclick={revealSolution}>Reveal Solution</button>
          </div>
        </div>
      {/if}
    </main>
  </div>
</div>

<!-- Auth Modal -->
{#if showAuthModal}
  <div class="overlay" onclick={() => (showAuthModal = false)} role="presentation">
    <!-- svelte-ignore a11y_interactive_supports_focus -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
      <h2>{authMode === 'login' ? 'Log In' : 'Create Account'}</h2>
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
          {authLoading ? 'Loading...' : authMode === 'login' ? 'Log In' : 'Create Account'}
        </button>
      </form>
      <p class="auth-switch">
        {#if authMode === 'login'}
          Don't have an account?
          <button class="link-btn" onclick={() => (authMode = 'signup')}>Sign up</button>
        {:else}
          Already have an account?
          <button class="link-btn" onclick={() => (authMode = 'login')}>Log in</button>
        {/if}
      </p>
    </div>
  </div>
{/if}

<!-- Win Popup -->
{#if showWinPopup}
  <div class="overlay" role="presentation">
    <div class="win-card" role="dialog" aria-modal="true">
      <h2 class="win-title">YOU WIN!</h2>
      <table class="win-stats">
        <tbody>
          <tr>
            <td>Difficulty</td>
            <td>{difficulty}</td>
          </tr>
          <tr>
            <td>Time</td>
            <td>{winTime.toFixed(3)}s</td>
          </tr>
          <tr>
            <td>Moves</td>
            <td>{winMoves}</td>
          </tr>
          <tr>
            <td>Seed</td>
            <td class="seed-cell">{seed}</td>
          </tr>
          <tr>
            <td>Record</td>
            <td>
              {#if isNewRecord}
                <span class="new-record-badge">New best!</span>
              {:else}
                {localRecords[difficulty]
                  ? formatRecordTime(localRecords[difficulty].time)
                  : winTime.toFixed(3) + 's'}
              {/if}
            </td>
          </tr>
        </tbody>
      </table>
      <button class="play-again-btn" onclick={startGame}>Play again</button>
    </div>
  </div>
{/if}

<!-- Tutorial Modal -->
{#if showTutorial}
  <div class="overlay" onclick={() => (showTutorial = false)} role="presentation">
    <!-- svelte-ignore a11y_interactive_supports_focus -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="modal tutorial-modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
      <h2>Tutorial</h2>

      {#if tutorialCompleted && tutorialStage === 0}
        <p class="tut-complete">Tutorial already completed!</p>
        <button onclick={() => (showTutorial = false)}>Close</button>
      {:else if tutorialCompleted}
        <p class="tut-complete">Tutorial complete! You've got it.</p>
        <button onclick={() => (showTutorial = false)}>Close</button>
      {:else}
        <div class="tut-controls-info">
          <p>Use these controls to sort the characters in order:</p>
          <div class="key-row">
            <kbd>A</kbd> Move bracket left
          </div>
          <div class="key-row">
            <kbd>D</kbd> Move bracket right
          </div>
          <div class="key-row">
            <kbd>&larr;</kbd> Shift characters in bracket left
          </div>
          <div class="key-row">
            <kbd>&rarr;</kbd> Shift characters in bracket right
          </div>
        </div>

        <div class="tut-stage">
          <h3>Stage {tutorialStage} of 2</h3>
          <p>
            Sort: <strong>{TEMPLATE.slice(0, tutorialStage === 1 ? 4 : 6)}</strong>
            (bracket size: {tutBracketSize})
          </p>
          <pre class="bracket-display tut-display">{tutDisplayString}</pre>
          <p class="tut-moves">Moves: {tutMoves}</p>

          {#if isMobile}
            <div class="mobile-controls tut-mobile">
              <div class="control-row">
                <button class="mobile-btn" onclick={tutMoveBracketLeft}>A</button>
                <button class="mobile-btn" onclick={tutMoveBracketRight}>D</button>
              </div>
              <div class="control-row">
                <button class="mobile-btn shift-btn" onclick={tutShiftLeft}>&larr;</button>
                <button class="mobile-btn shift-btn" onclick={tutShiftRight}>&rarr;</button>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  /* ====== Page Layout ====== */
  .page-wrapper {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .auth-bar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    padding: 12px 70px 12px 20px;
  }

  .auth-user {
    font-size: 0.95em;
  }

  .auth-btn {
    padding: 6px 16px;
    font-size: 0.9em;
  }

  .main-layout {
    display: flex;
    flex: 1;
    gap: 20px;
    padding: 0 20px 20px;
  }

  /* ====== Sidebar ====== */
  .sidebar {
    width: 280px;
    min-width: 280px;
    background: var(--panel-bg);
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    padding: 16px;
    max-height: calc(100vh - 80px);
    overflow-y: auto;
    order: 0;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .sidebar-header h3 {
    margin: 0;
    font-size: 1.05em;
  }

  .toggle-btn {
    padding: 4px 10px;
    font-size: 0.8em;
    border-radius: 6px;
  }

  .records-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .record-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 6px;
    border-radius: 6px;
    font-size: 0.92em;
    font-family: var(--font-mono);
    transition: background 0.15s;
  }

  .record-row:hover {
    background: var(--hover-bg);
  }

  .icon-link {
    text-decoration: none;
    font-size: 0.85em;
    line-height: 1;
  }

  .record-text {
    flex: 1;
  }

  /* ====== Game Area ====== */
  .game-area {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 500px;
  }

  .menu-screen {
    text-align: center;
  }

  .game-title {
    font-size: 3.5em;
    margin: 0 0 30px;
    letter-spacing: 2px;
  }

  .menu-controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .diff-label {
    font-size: 1.1em;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .play-btn {
    font-size: 1.3em;
    padding: 14px 50px;
    border-radius: 12px;
  }

  .tutorial-btn {
    background: transparent;
    color: var(--text-color);
    border: 2px solid var(--primary-color);
    font-size: 1em;
    padding: 10px 30px;
  }

  .tutorial-btn:hover {
    background: var(--primary-color);
    color: white;
  }

  /* ====== In-Game ====== */
  .game-screen {
    width: 100%;
    text-align: center;
    padding: 20px;
  }

  .game-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    font-size: 1.1em;
  }

  .game-timer {
    font-family: var(--font-mono);
    font-size: 1.4em;
    font-weight: bold;
  }

  .game-display {
    margin: 20px 0;
    overflow-x: auto;
  }

  .bracket-display {
    font-family: var(--font-mono);
    font-size: 2em;
    letter-spacing: 0.05em;
    margin: 0;
    white-space: pre;
    user-select: none;
    text-align: center;
  }

  .game-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 30px;
  }

  .reveal-btn {
    background: #e67e22;
  }

  .reveal-btn:hover {
    background: #d35400;
  }

  /* ====== Mobile Controls ====== */
  .mobile-controls {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 20px auto;
    max-width: 320px;
  }

  .control-row {
    display: flex;
    gap: 10px;
    justify-content: center;
  }

  .mobile-btn {
    flex: 1;
    padding: 16px 10px;
    font-size: 1.1em;
    border-radius: 12px;
    max-width: 150px;
  }

  .shift-btn {
    background: #8b5cf6;
  }

  .shift-btn:hover {
    background: #7c3aed;
  }

  /* ====== Overlays / Modals ====== */
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 500;
  }

  .modal {
    background: var(--panel-bg);
    border-radius: 16px;
    padding: 30px;
    width: 90%;
    max-width: 420px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  }

  .modal h2 {
    margin-top: 0;
    text-align: center;
  }

  .modal form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .modal input {
    padding: 12px 14px;
    font-size: 1em;
    border-radius: 8px;
    border: 1px solid #ccc;
    outline: none;
    background: var(--bg-color);
    color: var(--text-color);
  }

  .modal input:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }

  .auth-switch {
    text-align: center;
    margin-top: 12px;
    font-size: 0.9em;
  }

  .link-btn {
    background: none;
    border: none;
    color: var(--primary-color);
    cursor: pointer;
    padding: 0;
    font-size: inherit;
    text-decoration: underline;
  }

  .link-btn:hover {
    background: none;
    transform: none;
  }

  /* ====== Win Popup ====== */
  .win-card {
    background: var(--panel-bg);
    border-radius: 16px;
    padding: 40px;
    text-align: center;
    width: 90%;
    max-width: 420px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
    animation: winAppear 0.3s ease-out;
  }

  @keyframes winAppear {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .win-title {
    color: #2ecc71;
    font-size: 2.2em;
    margin: 0 0 20px;
  }

  .win-stats {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
    text-align: left;
  }

  .win-stats td {
    padding: 8px 12px;
    border-bottom: 1px solid var(--hover-bg);
  }

  .win-stats tr td:first-child {
    font-weight: 600;
    width: 40%;
  }

  .seed-cell {
    font-family: var(--font-mono);
    font-size: 0.85em;
    word-break: break-all;
  }

  .new-record-badge {
    background: #e67e22;
    color: white;
    padding: 3px 10px;
    border-radius: 6px;
    font-size: 0.9em;
    font-weight: 600;
  }

  .play-again-btn {
    font-size: 1.2em;
    padding: 12px 40px;
  }

  /* ====== Tutorial Modal ====== */
  .tutorial-modal {
    max-width: 520px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .tut-controls-info {
    margin-bottom: 20px;
  }

  .key-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 6px 0;
    font-size: 0.95em;
  }

  kbd {
    display: inline-block;
    padding: 4px 10px;
    font-family: var(--font-mono);
    font-size: 0.9em;
    background: var(--hover-bg);
    border: 1px solid #999;
    border-radius: 5px;
    min-width: 32px;
    text-align: center;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  }

  .tut-stage {
    border-top: 1px solid var(--hover-bg);
    padding-top: 16px;
  }

  .tut-stage h3 {
    margin: 0 0 8px;
  }

  .tut-display {
    font-size: 1.6em;
  }

  .tut-moves {
    font-size: 0.9em;
    color: var(--placeholder-color);
  }

  .tut-complete {
    text-align: center;
    font-size: 1.1em;
    color: var(--success-color);
    font-weight: 600;
    margin: 20px 0;
  }

  .tut-mobile {
    margin: 10px auto;
  }

  /* ====== Responsive ====== */
  @media (max-width: 1200px) {
    .main-layout {
      flex-direction: column;
    }

    .sidebar {
      width: 100%;
      min-width: unset;
      max-height: 300px;
      order: 1;
    }

    .game-area {
      order: 0;
      min-height: 400px;
    }
  }

  @media (max-width: 650px) {
    .game-title {
      font-size: 2.2em;
    }

    .bracket-display {
      font-size: 1.3em;
    }

    .game-timer {
      font-size: 1.1em;
    }

    .game-info {
      flex-direction: column;
      gap: 8px;
      font-size: 0.95em;
    }

    .game-actions button {
      width: 100%;
    }

    .play-btn {
      width: 100%;
      font-size: 1.1em;
    }

    .auth-bar {
      padding-right: 60px;
    }

    .win-card {
      padding: 24px;
    }

    .win-title {
      font-size: 1.6em;
    }

    .mobile-controls {
      display: flex;
    }
  }
</style>
