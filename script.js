let puzzleValues = [];
let revealedStatus = [];
let correctAnswers = [];
let rowTotals = [];
let colTotals = [];
let matrixSize = null;
let timerTick;
let elapsed = 0;
let errors = 0;
const maxErrorsAllowed = 3;
let finished = false;

let revealChance = 3;
let selectedDifficulty = null;

const sizeOptions = document.getElementById('size-buttons');
const startBtn = document.getElementById('play-btn');
const setupScreen = document.getElementById('size-selector');
const gameScreen = document.getElementById('game-page');
const gridContainer = document.getElementById('matrix-with-row-sums');
const colSumBar = document.getElementById('col-sums-row');
const feedback = document.getElementById('message-area');
const restart = document.getElementById('restart-btn');
const timerText = document.getElementById('timer');
const mistakeDisplay = document.getElementById('wrong-moves');
const boardInfo = document.getElementById('leaderboard-info');
const boardList = document.getElementById('leaderboard-list');

let gridChoice = null;

const btnEasy = document.getElementById('easy-btn');
const btnMedium = document.getElementById('medium-btn');
const btnHard = document.getElementById('hard-btn');

function clearDifficultyStyles() {
  [btnEasy, btnMedium, btnHard].forEach(b => b.classList.remove('selected'));
}

btnEasy.addEventListener('click', () => {
  clearDifficultyStyles();
  btnEasy.classList.add('selected');
  selectedDifficulty = 'Easy';
  revealChance = 2;
  resetOptions();
});

btnMedium.addEventListener('click', () => {
  clearDifficultyStyles();
  btnMedium.classList.add('selected');
  selectedDifficulty = 'Medium';
  revealChance = 4;
  resetOptions();
});

btnHard.addEventListener('click', () => {
  clearDifficultyStyles();
  btnHard.classList.add('selected');
  selectedDifficulty = 'Hard';
  revealChance = 7;
  resetOptions();
});

function resetOptions() {
  [...sizeOptions.children].forEach(b => b.classList.remove('selected'));
  startBtn.disabled = true;
  gridChoice = null;
  refreshLeaderboard();
}

for (let i = 4; i <= 8; i++) {
  const b = document.createElement('button');
  b.textContent = i;
  b.setAttribute('aria-label', `Matrix size ${i}`);
  b.type = 'button';
  b.addEventListener('click', () => {
    [...sizeOptions.children].forEach(b => b.classList.remove('selected'));
    b.classList.add('selected');
    gridChoice = i;
    startBtn.disabled = !(selectedDifficulty && gridChoice);
    refreshLeaderboard();
  });
  sizeOptions.appendChild(b);
}

function formatClock(ms) {
  let units = Math.floor(ms / 10);
  let cs = units % 100;
  let sec = Math.floor(units / 100) % 60;
  let min = Math.floor(units / 6000);
  const pad = (x) => x.toString().padStart(2, '0');
  return `${pad(min)}:${pad(sec)}:${pad(cs)}`;
}

function beginClock() {
  elapsed = 0;
  timerText.textContent = 'Time: 00:00:00';
  timerTick = setInterval(() => {
    elapsed += 10;
    timerText.textContent = 'Time: ' + formatClock(elapsed);
  }, 10);
}

function haltClock() {
  clearInterval(timerTick);
}

startBtn.addEventListener('click', () => {
  if (!(gridChoice && selectedDifficulty)) return;
  matrixSize = gridChoice;
  begin(matrixSize);
  setupScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  beginClock();
  feedback.textContent = '';
  mistakeDisplay.textContent = '';
  finished = false;
});

restart.addEventListener('click', () => {
  reload();
  setupScreen.classList.remove('hidden');
  gameScreen.classList.add('hidden');
  finished = false;
  refreshLeaderboard();
});

function createPuzzle(n, chance) {
  puzzleValues = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => randomInt(1, 9))
  );
  revealedStatus = Array.from({ length: n }, () => Array(n).fill(0));
  correctAnswers = Array.from({ length: n }, () => Array(n).fill(0));
  rowTotals = Array(n).fill(0);
  colTotals = Array(n).fill(0);

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      revealedStatus[r][c] = randomInt(1, 10) <= chance ? 1 : 0;
      correctAnswers[r][c] = revealedStatus[r][c];
      if (revealedStatus[r][c]) {
        rowTotals[r] += puzzleValues[r][c];
        colTotals[c] += puzzleValues[r][c];
      }
    }
  }

  for (let r = 0; r < n; r++) {
    if (!revealedStatus[r].includes(1)) {
      const c = randomInt(0, n - 1);
      revealedStatus[r][c] = 1;
      correctAnswers[r][c] = 1;
      rowTotals[r] += puzzleValues[r][c];
      colTotals[c] += puzzleValues[r][c];
    }
  }

  for (let c = 0; c < n; c++) {
    let hasOne = false;
    for (let r = 0; r < n; r++) {
      if (revealedStatus[r][c]) {
        hasOne = true;
        break;
      }
    }
    if (!hasOne) {
      const r = randomInt(0, n - 1);
      revealedStatus[r][c] = 1;
      correctAnswers[r][c] = 1;
      rowTotals[r] += puzzleValues[r][c];
      colTotals[c] += puzzleValues[r][c];
    }
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function begin(n) {
  feedback.textContent = '';
  mistakeDisplay.textContent = '';
  errors = 0;
  restart.classList.add('hidden');
  finished = false;

  createPuzzle(n, revealChance);
  drawGrid();
}

function drawGrid() {
  gridContainer.innerHTML = '';
  colSumBar.innerHTML = '';

  gridContainer.style.gridTemplateColumns = `repeat(${matrixSize + 1}, 54px)`;
  colSumBar.style.gridTemplateColumns = `repeat(${matrixSize}, 54px)`;

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      const box = document.createElement('button');
      box.textContent = puzzleValues[r][c];
      box.dataset.row = r;
      box.dataset.col = c;
      box.setAttribute('aria-label', `Cell (${r + 1}, ${c + 1}): ${puzzleValues[r][c]}`);

      if (finished && correctAnswers[r][c]) {
        box.style.visibility = 'visible';
        box.style.backgroundColor = '#089109';
        box.style.color = 'white';
        box.disabled = true;
      } else if (finished) {
        box.style.visibility = 'hidden';
      } else {
        box.style.visibility = 'visible';
        box.style.backgroundColor = '#b9f6ca';
        box.style.color = '#1e4620';
        box.disabled = false;
      }

      if (!finished) {
        box.addEventListener('contextmenu', handleRightClick);
        box.addEventListener('click', () => {
          box.classList.toggle('marked');
          box.style.backgroundColor = box.classList.contains('marked') ? '#6bcf8a' : '#b9f6ca';
        });
      }

      gridContainer.appendChild(box);
    }

    const sumBox = document.createElement('div');
    sumBox.textContent = rowTotals[r];
    sumBox.classList.add('row-sum-cell');
    gridContainer.appendChild(sumBox);
  }

  for (let c = 0; c < matrixSize; c++) {
    const colSumBox = document.createElement('div');
    colSumBox.textContent = colTotals[c];
    colSumBox.classList.add('col-sum-cell');
    colSumBar.appendChild(colSumBox);
  }
}

function handleRightClick(e) {
  e.preventDefault();
  if (finished || feedback.textContent !== '') return;

  const btn = e.currentTarget;
  const r = +btn.dataset.row;
  const c = +btn.dataset.col;

  if (correctAnswers[r][c]) {
    errors++;
    mistakeDisplay.textContent = 'Wrong Moves: ' + 'X'.repeat(errors);
    btn.style.boxShadow = '0 0 8px 3px red';
    setTimeout(() => (btn.style.boxShadow = ''), 800);

    feedback.textContent = 'You need this number!';
    setTimeout(() => {
      if (!finished && !feedback.textContent.includes('Congrats')) {
        feedback.textContent = '';
      }
    }, 2000);

    if (errors >= maxErrorsAllowed) {
      feedback.textContent = 'Game Over! You made 3 wrong moves.';
      restart.classList.remove('hidden');
      haltClock();
      finished = true;
      showSolution();
      lockButtons();
      refreshLeaderboard();
    }
  } else {
    btn.style.visibility = 'hidden';
    revealedStatus[r][c] = 1;

    if (solved()) {
      feedback.textContent = 'Congratulations! You solved it!';
      restart.classList.remove('hidden');
      haltClock();
      finished = true;
      lockButtons();
      askAndSave();
    }
  }
}

function showSolution() {
  const boxes = gridContainer.querySelectorAll('button');
  boxes.forEach(btn => {
    const r = +btn.dataset.row;
    const c = +btn.dataset.col;
    if (isNaN(r) || isNaN(c)) return;
    if (correctAnswers[r][c]) {
      btn.style.visibility = 'visible';
      btn.style.backgroundColor = '#089109';
      btn.style.color = 'white';
      btn.disabled = true;
    } else {
      btn.style.visibility = 'hidden';
    }
  });
}

function lockButtons() {
  gridContainer.querySelectorAll('button').forEach(b => {
    b.disabled = true;
    b.style.cursor = 'default';
  });
}

function solved() {
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (!revealedStatus[r][c]) return false;
    }
  }
  return true;
}

function reload() {
  gridChoice = null;
  selectedDifficulty = null;
  revealChance = 3;
  errors = 0;
  mistakeDisplay.textContent = '';
  startBtn.disabled = true;
  [...sizeOptions.children].forEach(b => b.classList.remove('selected'));
  [btnEasy, btnMedium, btnHard].forEach(b => b.classList.remove('selected'));
  feedback.textContent = '';
  restart.classList.add('hidden');
  gridContainer.innerHTML = '';
  colSumBar.innerHTML = '';
  timerText.textContent = 'Time: 00:00:00';
  haltClock();
  finished = false;
  refreshLeaderboard();
}

function getBoardKey() {
  if (!matrixSize || !selectedDifficulty) return null;
  return `leaderboard_${matrixSize}_${selectedDifficulty.toLowerCase()}`;
}

function fetchBoard() {
  const key = getBoardKey();
  if (!key) return [];
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function saveScore(entry) {
  const key = getBoardKey();
  if (!key) return;
  const board = fetchBoard();
  board.push(entry);
  board.sort((a, b) => a.time - b.time);
  if (board.length > 10) board.length = 10;
  localStorage.setItem(key, JSON.stringify(board));
  refreshLeaderboard();
}

function refreshLeaderboard() {
  boardList.innerHTML = '';

  if (!matrixSize || !selectedDifficulty) {
    boardInfo.textContent = 'Select difficulty and size to see top solves';
    return;
  }

  boardInfo.textContent = `Top solves for ${matrixSize} × ${matrixSize}, ${selectedDifficulty}`;

  const board = fetchBoard();
  if (board.length === 0) {
    boardList.innerHTML = '<li>No recorded solves yet.</li>';
    return;
  }

  board.forEach(({ time, name, date }) => {
    const item = document.createElement('li');
    const who = name || 'Anonymous';
    const when = new Date(date).toLocaleDateString();
    item.innerHTML = `<span class="player-name">${who}</span> <span class="time">${formatClock(time)}</span>`;
    item.title = `Date: ${when}`;
    boardList.appendChild(item);
  });
}

function askAndSave() {
  let person = prompt('Congratulations! Enter your name for the leaderboard:', 'Player');
  if (person === null) {
    person = 'Anonymous';
  } else {
    person = person.trim() || 'Anonymous';
  }
  saveScore({ name: person, time: elapsed, date: new Date().toISOString() });
}

refreshLeaderboard();
