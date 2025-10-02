# 🧩 Sort-16

**Sort-16** is a fast-paced browser puzzle game where players rearrange a shuffled string of characters using bracket-based shifting mechanics. The goal? Restore the original sequence with precision and speed.

---

## 🎮 Gameplay Overview

- **Choose difficulty**: Select a character count between `8–36`.
- **Shuffle**: A randomized string is generated from the template `0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ`.
- **Control the bracket**:
  - `a` / `d` → Move bracket left/right  
  - `←` / `→` → Rotate characters inside the bracket  
  - `r` → Restart the game

---

## 🧠 Features

- ⏱ Real-time timer and record tracking  
- 🌗 Dark mode toggle (`🌙` / `🌞`)  
- 🧩 Reveal solution after completion  
- 🔐 Export/import encrypted performance stats  
- 📊 Tooltip stats on hover (average time, completions)

---

## 📈 Stats Tracked

| Metric              | Description                                 |
|---------------------|---------------------------------------------|
| **Fastest Time**     | Best completion time per difficulty        |
| **Completions**      | Number of successful solves per difficulty |
| **Average Time**     | Mean time across all completions           |

---

## 🚀 Getting Started

1. Clone or download the repository.
2. Open `index.html` in your browser.
3. Select difficulty and start solving!

_No installation required._

---

## 🔐 Record Export/Import

- Records are encrypted using AES and encoded for clipboard sharing.
- You can import saved records via prompt input.

---

## 🛠 Tech Stack

- **HTML/CSS/JavaScript**
- No external dependencies (except optional CryptoJS for encryption)

---

## 📬 Feedback & Contributions

Feel free to submit issues, suggestions, or pull requests.  
Let’s make Sort-16 even sharper.
