const backendUrl = "https://dzkaqs8rvm.eu-central-1.awsapprunner.com";

async function request(url, options = {}) {
  const res = await fetch(`${backendUrl}${url}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const isJson = res.headers
    .get("content-type")
    ?.includes("application/json");

  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const error = typeof data === "string" ? data : JSON.stringify(data);
    throw { status: res.status, message: error };
  }

  return data;
}

// =========================
// AUTH
// =========================
async function register(username, password) {
  try {
    await request("/api/users/create", {
      method: "POST",
      body: JSON.stringify({
        username,
        passwordString: password,
      }),
    });

    showAuthNotification("Registered successfully. You can now log in.");
    closeAuthModal("signupModal");
    openAuthModal("loginModal");
  } catch (err) {
    showAuthNotification(
      `Register failed: ${err.message} (Error ${err.status})`,
      "red"
    );
  }
}

async function login(username, password) {
  try {
    await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username,
        passwordString: password,
      }),
    });

    showAuthNotification("Logged in successfully");
    closeAuthModal("loginModal");
  } catch (err) {
    if (err.status === 401) {
      showAuthNotification("Username or password are invalid", "red");
    } else {
      showAuthNotification(
        `Login failed: ${err.message} (Error ${err.status})`,
        "red"
      );
    }
  }
}

async function logout() {
  try {
    await request("/api/auth/logout", {
      method: "DELETE",
    });

    showAuthNotification("Logged out");
  } catch (err) {
    showAuthNotification("Logout failed", "red");
  }
}

// =========================
// HEALTH CHECK
// =========================
async function apiTest() {
  try {
    const res = await fetch(`${backendUrl}/api/health`);
    if (res.ok) {
      showAuthNotification("API healthy");
    } else {
      showAuthNotification("API not healthy", "red");
    }
  } catch {
    showAuthNotification("API not reachable", "red");
  }
}

// =========================
// RECORDS
// =========================
async function pushRecord(time, moves, difficulty, seed) {
  const safeTime = Number(time);
  const safeMoves = Number(moves);
  const safeDifficulty = Number(difficulty);

  if (Number.isNaN(safeTime) || Number.isNaN(safeMoves)) {
    console.error("Invalid record data", { time, moves });
    return null;
  }

  return request("/api/records/add", {
    method: "POST",
    body: JSON.stringify({
      time: safeTime,
      moves: safeMoves,
      difficulty: safeDifficulty,
      seed,
    }),
  });
}

async function loadRecordsByUsername() {
  try {
    return await request("/api/records/user");
  } catch (err) {
    if (err.status === 401) {
      showAuthNotification("Please log in.", "red");
    }
    return null;
  }
}

async function loadRecordsByDifficulty(difficulty) {
  try {
    return await request(`/api/records/difficulty/${difficulty}`);
  } catch {
    console.error("Failed to load records");
    return [];
  }
}

// =========================
// COMPLETIONS
// =========================
async function addCompletion(difficulty) {
  try {
    return await request(
      `/api/completions/add?difficulty=${difficulty}`,
      { method: "POST" }
    );
  } catch (err) {
    if (err.status === 401) {
      showAuthNotification("Log in first.", "red");
    } else {
      console.error("Failed to add completion");
    }
    return null;
  }
}

async function loadCompletionLeaderboard(difficulty) {
  try {
    return await request(
      `/api/completions/leaderboard/${difficulty}`
    );
  } catch {
    return [];
  }
}

// =========================
// COMBINED SYNC HELPERS (NEW)
// =========================

// Call this after finishing a level (BEST PRACTICE)
async function syncRunResult({ time, moves, difficulty, seed }) {
  const [record] = await Promise.all([
    pushRecord(time, moves, difficulty, seed),
    addCompletion(difficulty),
  ]);

  return record;
}

// Full user sync (use after login)
async function syncUserData() {
  try {
    const [records, completions] = await Promise.all([
      loadRecordsByUsername(),
      request("/api/completions/user"),
    ]);

    return { records, completions };
  } catch {
    return null;
  }
}

// =========================
// LEADERBOARDS
// =========================
async function loadRecordLeaderboard() {
  try {
    return await request("/api/users/leaderboard");
  } catch {
    return [];
  }
}