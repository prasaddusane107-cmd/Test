/**
 * OmniCalc - Next-Gen Glassmorphic Calculator Engine
 * Core features: Safe Math Evaluator, Web Audio Synthesis, Themes, History,
 * Keyboard Bindings, Responsive Keypad Modes, Memory Operations.
 */

(function () {
  'use strict';

  // --- State ---
  const state = {
    currentInput: '0',
    expression: '',
    previousResult: null,
    isEvaluated: false,
    angleMode: 'DEG', // 'DEG' or 'RAD'
    memory: 0,
    soundEnabled: true,
    activeTheme: 'dark',
    history: []
  };

  // --- DOM Elements ---
  const elements = {
    appContainer: document.querySelector('.app-container'),
    calculatorCard: document.getElementById('calculatorCard'),
    mainDisplay: document.getElementById('mainDisplay'),
    expressionDisplay: document.getElementById('expressionDisplay'),
    tabStandard: document.getElementById('tabStandard'),
    tabScientific: document.getElementById('tabScientific'),
    scientificKeypad: document.getElementById('scientificKeypad'),
    angleBadge: document.getElementById('angleBadge'),
    memoryBadge: document.getElementById('memoryBadge'),
    btnAngleMode: document.getElementById('btnAngleMode'),
    soundToggleBtn: document.getElementById('soundToggleBtn'),
    soundOnIcon: document.querySelector('.sound-on-icon'),
    soundOffIcon: document.querySelector('.sound-off-icon'),
    themeMenuBtn: document.getElementById('themeMenuBtn'),
    themeMenu: document.getElementById('themeMenu'),
    themeOptions: document.querySelectorAll('.theme-option'),
    historyToggleBtn: document.getElementById('historyToggleBtn'),
    historyDrawer: document.getElementById('historyDrawer'),
    closeHistoryBtn: document.getElementById('closeHistoryBtn'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    historyList: document.getElementById('historyList'),
    historyBadge: document.getElementById('historyBadge'),
    helpToggleBtn: document.getElementById('helpToggleBtn'),
    shortcutsModal: document.getElementById('shortcutsModal'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    copyResultBtn: document.getElementById('copyResultBtn'),
    copyTooltip: document.querySelector('.copy-tooltip'),
    allCalcBtns: document.querySelectorAll('.calc-btn')
  };

  // --- Web Audio Synthesizer (Zero External Dependencies) ---
  let audioCtx = null;
  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
  }

  function playKeyClick(type = 'default') {
    if (!state.soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      let freq = 420;
      let duration = 0.035;

      if (type === 'operator') {
        freq = 640;
        duration = 0.045;
      } else if (type === 'equals') {
        freq = 880;
        duration = 0.06;
      } else if (type === 'clear') {
        freq = 280;
        duration = 0.04;
      } else if (type === 'sci') {
        freq = 520;
        duration = 0.04;
      }

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.45, now + duration);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      // Audio autoplay policy or unavailable
    }
  }

  // --- Theme Management ---
  function initTheme() {
    const savedTheme = localStorage.getItem('omni_theme') || 'dark';
    setTheme(savedTheme);
  }

  function setTheme(theme) {
    state.activeTheme = theme;
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('omni_theme', theme);

    elements.themeOptions.forEach(opt => {
      opt.classList.toggle('active', opt.dataset.themeVal === theme);
    });
  }

  // --- History Management ---
  function loadHistory() {
    try {
      const saved = localStorage.getItem('omni_history');
      if (saved) {
        state.history = JSON.parse(saved);
      }
    } catch (e) {
      state.history = [];
    }
    renderHistory();
  }

  function saveHistory(expr, res) {
    state.history.unshift({ expr, res, timestamp: Date.now() });
    if (state.history.length > 50) state.history.pop();
    try {
      localStorage.setItem('omni_history', JSON.stringify(state.history));
    } catch (e) {}
    renderHistory();
  }

  function renderHistory() {
    const count = state.history.length;
    if (count > 0) {
      elements.historyBadge.textContent = count > 99 ? '99+' : count;
      elements.historyBadge.classList.remove('hidden');
    } else {
      elements.historyBadge.classList.add('hidden');
    }

    if (count === 0) {
      elements.historyList.innerHTML = `
        <div class="history-empty">
          <p>No calculations yet</p>
          <span>Calculations will appear here as you compute.</span>
        </div>
      `;
      return;
    }

    elements.historyList.innerHTML = state.history
      .map((item, idx) => `
        <div class="history-item" data-index="${idx}" title="Click to recall">
          <div class="history-item-expr">${escapeHtml(item.expr)} =</div>
          <div class="history-item-res">${escapeHtml(item.res)}</div>
        </div>
      `)
      .join('');

    elements.historyList.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = el.getAttribute('data-index');
        const item = state.history[idx];
        if (item) {
          state.currentInput = item.res;
          state.expression = item.expr + ' =';
          state.isEvaluated = true;
          updateDisplay();
          elements.historyDrawer.classList.add('hidden');
          playKeyClick('default');
        }
      });
    });
  }

  function clearHistory() {
    state.history = [];
    try {
      localStorage.removeItem('omni_history');
    } catch (e) {}
    renderHistory();
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // --- Display and Formatting Helpers ---
  function formatNumber(numStr) {
    if (!numStr || numStr === 'Error' || numStr.includes('Cannot') || numStr === 'NaN' || numStr === 'Infinity') {
      return numStr;
    }
    const [intPart, decPart] = numStr.split('.');
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
  }

  function updateDisplay() {
    elements.expressionDisplay.textContent = state.expression;
    const formatted = formatNumber(state.currentInput);
    elements.mainDisplay.textContent = formatted;

    // Dynamic font-size scaling based on length
    const len = formatted.length;
    if (len > 18) {
      elements.mainDisplay.style.fontSize = '1.35rem';
    } else if (len > 14) {
      elements.mainDisplay.style.fontSize = '1.75rem';
    } else if (len > 10) {
      elements.mainDisplay.style.fontSize = '2.2rem';
    } else {
      elements.mainDisplay.style.fontSize = '2.85rem';
    }
  }

  function roundPrecision(num) {
    if (!isFinite(num)) return num;
    if (Math.abs(num) < 1e-12) return 0;
    const rounded = parseFloat(num.toPrecision(12));
    if (Object.is(rounded, -0) || rounded === 0) return 0;
    if (Math.abs(rounded) > 1e14 || (Math.abs(rounded) < 1e-6 && rounded !== 0)) {
      return rounded.toExponential(6).replace(/\.?0+e/, 'e');
    }
    return rounded;
  }

  // Factorial helper
  function factorial(n) {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n === 0 || n === 1) return 1;
    if (n > 170) return Infinity; // JS max float limit
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }

  // --- Mathematical Parser & Safe Evaluator ---
  // Evaluates a sanitized mathematical expression with standard precedence and scientific functions
  function evaluateMathExpression(rawExpr) {
    // Replace visual symbols with computational counterparts
    let clean = rawExpr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/\^/g, '**');

    // Handle constants
    clean = clean.replace(/\bpi\b/gi, `(${Math.PI})`);
    clean = clean.replace(/\be\b/gi, `(${Math.E})`);

    // Handle functions like sin, cos, tan with DEG/RAD conversion
    const isDeg = state.angleMode === 'DEG';
    const toRad = isDeg ? `* (${Math.PI} / 180)` : '';

    // Trigonometric functions
    clean = clean.replace(/sin\(([^)]+)\)/gi, (m, arg) => `Math.sin((${arg})${toRad})`);
    clean = clean.replace(/cos\(([^)]+)\)/gi, (m, arg) => `Math.cos((${arg})${toRad})`);
    clean = clean.replace(/tan\(([^)]+)\)/gi, (m, arg) => `Math.tan((${arg})${toRad})`);

    // Inverse trig
    if (isDeg) {
      clean = clean.replace(/asin\(([^)]+)\)/gi, (m, arg) => `(Math.asin(${arg}) * (180 / Math.PI))`);
      clean = clean.replace(/acos\(([^)]+)\)/gi, (m, arg) => `(Math.acos(${arg}) * (180 / Math.PI))`);
      clean = clean.replace(/atan\(([^)]+)\)/gi, (m, arg) => `(Math.atan(${arg}) * (180 / Math.PI))`);
    } else {
      clean = clean.replace(/asin\(([^)]+)\)/gi, (m, arg) => `Math.asin(${arg})`);
      clean = clean.replace(/acos\(([^)]+)\)/gi, (m, arg) => `Math.acos(${arg})`);
      clean = clean.replace(/atan\(([^)]+)\)/gi, (m, arg) => `Math.atan(${arg})`);
    }

    // Logarithmic & Roots
    clean = clean.replace(/ln\(([^)]+)\)/gi, (m, arg) => `Math.log(${arg})`);
    clean = clean.replace(/log\(([^)]+)\)/gi, (m, arg) => `Math.log10(${arg})`);
    clean = clean.replace(/sqrt\(([^)]+)\)/gi, (m, arg) => `Math.sqrt(${arg})`);
    clean = clean.replace(/cbrt\(([^)]+)\)/gi, (m, arg) => `Math.cbrt(${arg})`);

    // Whitelist check: only allowed characters: digits, operators, parens, Math methods, decimals
    const allowed = /^[0-9+\-*/().,%*\sMathEPIsincotaeqrblg]+$/;
    if (!allowed.test(clean)) {
      throw new Error('Invalid characters');
    }

    // Safe execution using Function constructor with isolated scope
    const evaluator = new Function(`return (${clean});`);
    const val = evaluator();

    if (val === undefined || isNaN(val)) {
      throw new Error('Calculation error');
    }
    if (!isFinite(val)) {
      if (rawExpr.includes('÷') || rawExpr.includes('/')) {
        return 'Cannot divide by 0';
      }
      return 'Infinity';
    }

    return String(roundPrecision(val));
  }

  // --- Calculator Operations ---
  function inputDigit(digit) {
    playKeyClick('default');
    if (state.isEvaluated) {
      state.currentInput = digit;
      state.expression = '';
      state.isEvaluated = false;
    } else if (state.currentInput === '0') {
      state.currentInput = digit;
    } else {
      if (state.currentInput.length < 24) {
        state.currentInput += digit;
      }
    }
    updateDisplay();
  }

  function inputDecimal() {
    playKeyClick('default');
    if (state.isEvaluated) {
      state.currentInput = '0.';
      state.expression = '';
      state.isEvaluated = false;
    } else if (!state.currentInput.includes('.')) {
      state.currentInput += '.';
    }
    updateDisplay();
  }

  function inputOperator(op) {
    playKeyClick('operator');
    const visualOp = op === '*' ? '×' : op === '/' ? '÷' : op === '-' ? '−' : op;

    if (state.isEvaluated) {
      state.expression = `${state.currentInput} ${visualOp} `;
      state.isEvaluated = false;
      state.currentInput = '0';
    } else {
      const expr = state.expression.trim();
      const lastChar = expr.slice(-1);
      const isLastOp = ['+', '−', '×', '÷', '%', '^'].includes(lastChar);

      if (state.currentInput === '0' && isLastOp && expr.length > 0) {
        // Change the operator
        state.expression = expr.slice(0, -1) + visualOp + ' ';
      } else {
        state.expression += `${state.currentInput} ${visualOp} `;
        state.currentInput = '0';
      }
    }
    updateDisplay();
  }

  function inputParenthesis(paren) {
    playKeyClick('sci');
    if (paren === '(') {
      if (state.currentInput === '0' || state.isEvaluated) {
        state.expression = state.expression + ' ( ';
        state.currentInput = '0';
        state.isEvaluated = false;
      } else {
        state.expression += `${state.currentInput} × ( `;
        state.currentInput = '0';
      }
    } else if (paren === ')') {
      // Close paren
      const openCount = (state.expression.match(/\(/g) || []).length;
      const closeCount = (state.expression.match(/\)/g) || []).length;
      if (openCount > closeCount) {
        state.expression += `${state.currentInput} ) `;
        state.currentInput = '0';
      }
    }
    updateDisplay();
  }

  function inputConstant(constName) {
    playKeyClick('sci');
    let val = '0';
    if (constName === 'pi') {
      val = String(roundPrecision(Math.PI));
    } else if (constName === 'e') {
      val = String(roundPrecision(Math.E));
    }
    state.currentInput = val;
    state.isEvaluated = false;
    updateDisplay();
  }

  function applySciFunc(func) {
    playKeyClick('sci');
    const num = parseFloat(state.currentInput);
    if (isNaN(num)) {
      state.currentInput = '0';
      updateDisplay();
      return;
    }

    if (func === 'square') {
      const res = roundPrecision(num * num);
      state.expression = `sqr(${state.currentInput}) =`;
      state.currentInput = String(res);
      state.isEvaluated = true;
      saveHistory(`sqr(${num})`, state.currentInput);
    } else if (func === 'inv') {
      if (num === 0) {
        state.currentInput = 'Cannot divide by 0';
        state.isEvaluated = true;
      } else {
        const res = roundPrecision(1 / num);
        state.expression = `1/(${state.currentInput}) =`;
        state.currentInput = String(res);
        state.isEvaluated = true;
        saveHistory(`1/(${num})`, state.currentInput);
      }
    } else if (func === 'percent') {
      const res = roundPrecision(num / 100);
      state.currentInput = String(res);
      state.isEvaluated = false;
    } else if (func === 'fact') {
      const res = factorial(num);
      state.expression = `${num}! =`;
      state.currentInput = isNaN(res) ? 'Error' : String(res);
      state.isEvaluated = true;
      saveHistory(`${num}!`, state.currentInput);
    } else if (['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'ln', 'log', 'sqrt', 'cbrt'].includes(func)) {
      // Evaluate function directly on current input
      try {
        const expr = `${func}(${num})`;
        const res = evaluateMathExpression(expr);
        state.expression = `${expr} =`;
        state.currentInput = String(res);
        state.isEvaluated = true;
        saveHistory(expr, state.currentInput);
      } catch (err) {
        state.currentInput = 'Error';
        state.isEvaluated = true;
      }
    }
    updateDisplay();
  }

  function negateNumber() {
    playKeyClick('default');
    if (state.currentInput === '0' || state.currentInput === 'Error') return;
    if (state.currentInput.startsWith('-')) {
      state.currentInput = state.currentInput.slice(1);
    } else {
      state.currentInput = '-' + state.currentInput;
    }
    updateDisplay();
  }

  function deleteLast() {
    playKeyClick('clear');
    if (state.isEvaluated) {
      clearAll();
      return;
    }
    if (state.currentInput.length > 1) {
      state.currentInput = state.currentInput.slice(0, -1);
      if (state.currentInput === '-') state.currentInput = '0';
    } else {
      state.currentInput = '0';
    }
    updateDisplay();
  }

  function clearAll() {
    playKeyClick('clear');
    state.currentInput = '0';
    state.expression = '';
    state.isEvaluated = false;
    updateDisplay();
  }

  function calculateResult() {
    playKeyClick('equals');
    if (state.isEvaluated && state.expression) {
      // Repeated equals could re-evaluate, but keeping it clean
      return;
    }

    let fullExpr = state.expression + state.currentInput;

    // Automatically balance unclosed parentheses
    const openParen = (fullExpr.match(/\(/g) || []).length;
    const closeParen = (fullExpr.match(/\)/g) || []).length;
    for (let i = 0; i < (openParen - closeParen); i++) {
      fullExpr += ' ) ';
    }

    try {
      const result = evaluateMathExpression(fullExpr);
      saveHistory(fullExpr.trim(), result);
      state.expression = fullExpr + ' =';
      state.currentInput = result;
      state.isEvaluated = true;
    } catch (e) {
      state.currentInput = 'Syntax Error';
      state.isEvaluated = true;
    }
    updateDisplay();
  }

  // --- Memory Operations ---
  function handleMemory(action) {
    playKeyClick('sci');
    const val = parseFloat(state.currentInput) || 0;
    switch (action) {
      case 'mem-clear':
        state.memory = 0;
        elements.memoryBadge.classList.add('hidden');
        break;
      case 'mem-recall':
        state.currentInput = String(roundPrecision(state.memory));
        state.isEvaluated = false;
        updateDisplay();
        break;
      case 'mem-add':
        state.memory += val;
        elements.memoryBadge.classList.toggle('hidden', state.memory === 0);
        state.isEvaluated = true;
        break;
      case 'mem-sub':
        state.memory -= val;
        elements.memoryBadge.classList.toggle('hidden', state.memory === 0);
        state.isEvaluated = true;
        break;
    }
  }

  // --- Angle Mode (DEG/RAD) Toggle ---
  function toggleAngleMode() {
    playKeyClick('sci');
    state.angleMode = state.angleMode === 'DEG' ? 'RAD' : 'DEG';
    elements.angleBadge.textContent = state.angleMode;
    elements.btnAngleMode.textContent = state.angleMode === 'DEG' ? 'RAD' : 'DEG';
  }

  // --- Sound Toggle ---
  function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    elements.soundOnIcon.classList.toggle('hidden', !state.soundEnabled);
    elements.soundOffIcon.classList.toggle('hidden', state.soundEnabled);
    localStorage.setItem('omni_sound', state.soundEnabled ? 'true' : 'false');
    if (state.soundEnabled) playKeyClick('default');
  }

  // --- Copy Result to Clipboard ---
  function copyResult() {
    playKeyClick('default');
    const textToCopy = state.currentInput;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        showCopyTooltip();
      }).catch(() => fallbackCopy(textToCopy));
    } else {
      fallbackCopy(textToCopy);
    }
  }

  function fallbackCopy(text) {
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    try {
      document.execCommand('copy');
      showCopyTooltip();
    } catch (e) {}
    document.body.removeChild(input);
  }

  function showCopyTooltip() {
    elements.copyTooltip.classList.add('show');
    setTimeout(() => {
      elements.copyTooltip.classList.remove('show');
    }, 1500);
  }

  // --- Keypad Mode Tabs ---
  function setMode(mode) {
    playKeyClick('default');
    if (mode === 'scientific') {
      elements.tabScientific.classList.add('active');
      elements.tabStandard.classList.remove('active');
      elements.scientificKeypad.classList.remove('hidden');
      elements.appContainer.classList.add('expanded');
    } else {
      elements.tabStandard.classList.add('active');
      elements.tabScientific.classList.remove('active');
      elements.scientificKeypad.classList.add('hidden');
      elements.appContainer.classList.remove('expanded');
    }
  }

  // --- Keyboard Support & Key Bindings ---
  function handleKeyDown(e) {
    // If shortcuts modal is open and Esc is pressed, close modal
    if (!elements.shortcutsModal.classList.contains('hidden')) {
      if (e.key === 'Escape') {
        elements.shortcutsModal.classList.add('hidden');
      }
      return;
    }

    const key = e.key;

    // Digits
    if (/^[0-9]$/.test(key)) {
      e.preventDefault();
      animateKey(`[data-val="${key}"]`);
      inputDigit(key);
      return;
    }

    // Decimal
    if (key === '.') {
      e.preventDefault();
      animateKey('[data-val="."]');
      inputDecimal();
      return;
    }

    // Basic Operators
    if (key === '+') {
      e.preventDefault();
      animateKey('[data-val="+"]');
      inputOperator('+');
      return;
    }
    if (key === '-') {
      e.preventDefault();
      animateKey('[data-val="−"]');
      inputOperator('−');
      return;
    }
    if (key === '*') {
      e.preventDefault();
      animateKey('[data-val="×"]');
      inputOperator('×');
      return;
    }
    if (key === '/') {
      e.preventDefault();
      animateKey('[data-val="÷"]');
      inputOperator('÷');
      return;
    }
    if (key === '%') {
      e.preventDefault();
      animateKey('[data-val="%"]');
      applySciFunc('percent');
      return;
    }
    if (key === '^') {
      e.preventDefault();
      animateKey('[data-val="^"]');
      inputOperator('^');
      return;
    }

    // Parentheses
    if (key === '(' || key === ')') {
      e.preventDefault();
      animateKey(`[data-val="${key}"]`);
      inputParenthesis(key);
      return;
    }

    // Equals or Enter
    if (key === 'Enter' || key === '=') {
      e.preventDefault();
      animateKey('[data-action="equals"]');
      calculateResult();
      return;
    }

    // Delete / Backspace
    if (key === 'Backspace') {
      e.preventDefault();
      animateKey('#btnDel');
      deleteLast();
      return;
    }

    // Escape -> All Clear
    if (key === 'Escape') {
      e.preventDefault();
      animateKey('#btnAC');
      clearAll();
      return;
    }

    // Quick scientific shortcuts (lowercase check)
    const lowerKey = key.toLowerCase();
    if (lowerKey === 's') {
      animateKey('[data-val="sin"]');
      applySciFunc('sin');
    } else if (lowerKey === 'c') {
      animateKey('[data-val="cos"]');
      applySciFunc('cos');
    } else if (lowerKey === 't') {
      animateKey('[data-val="tan"]');
      applySciFunc('tan');
    } else if (lowerKey === 'p') {
      animateKey('[data-val="pi"]');
      inputConstant('pi');
    } else if (lowerKey === 'e') {
      animateKey('[data-val="e"]');
      inputConstant('e');
    } else if (lowerKey === 'h') {
      toggleHistory();
    } else if (lowerKey === 'm') {
      toggleSound();
    }
  }

  function animateKey(selector) {
    try {
      const btn = document.querySelector(selector);
      if (btn) {
        btn.classList.add('btn-active');
        setTimeout(() => btn.classList.remove('btn-active'), 120);
      }
    } catch (e) {}
  }

  function toggleHistory() {
    playKeyClick('default');
    elements.historyDrawer.classList.toggle('hidden');
  }

  // --- Attach Event Listeners ---
  function setupEventListeners() {
    // Mode tabs
    elements.tabStandard.addEventListener('click', () => setMode('standard'));
    elements.tabScientific.addEventListener('click', () => setMode('scientific'));

    // Sound toggle
    elements.soundToggleBtn.addEventListener('click', toggleSound);

    // Theme dropdown
    elements.themeMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      elements.themeMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!elements.themeMenu.contains(e.target) && e.target !== elements.themeMenuBtn) {
        elements.themeMenu.classList.add('hidden');
      }
    });

    elements.themeOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        setTheme(opt.dataset.themeVal);
        elements.themeMenu.classList.add('hidden');
      });
    });

    // History drawer controls
    elements.historyToggleBtn.addEventListener('click', toggleHistory);
    elements.closeHistoryBtn.addEventListener('click', () => elements.historyDrawer.classList.add('hidden'));
    elements.clearHistoryBtn.addEventListener('click', clearHistory);

    // Keyboard Shortcuts modal
    elements.helpToggleBtn.addEventListener('click', () => {
      playKeyClick('default');
      elements.shortcutsModal.classList.remove('hidden');
    });
    elements.closeModalBtn.addEventListener('click', () => {
      elements.shortcutsModal.classList.add('hidden');
    });
    elements.shortcutsModal.addEventListener('click', (e) => {
      if (e.target === elements.shortcutsModal) {
        elements.shortcutsModal.classList.add('hidden');
      }
    });

    // Copy result button
    elements.copyResultBtn.addEventListener('click', copyResult);

    // Angle mode button
    elements.btnAngleMode.addEventListener('click', toggleAngleMode);

    // Keypad button delegation
    elements.calculatorCard.addEventListener('click', (e) => {
      const btn = e.target.closest('.calc-btn');
      if (!btn) return;

      const action = btn.dataset.action;
      const val = btn.dataset.val;

      if (btn.classList.contains('btn-num')) {
        if (val === '.') {
          inputDecimal();
        } else {
          inputDigit(val);
        }
      } else if (action === 'operator') {
        inputOperator(val);
      } else if (action === 'equals') {
        calculateResult();
      } else if (action === 'clear-all') {
        clearAll();
      } else if (action === 'delete') {
        deleteLast();
      } else if (action === 'negate') {
        negateNumber();
      } else if (action === 'parenthesis') {
        inputParenthesis(val);
      } else if (action === 'constant') {
        inputConstant(val);
      } else if (action === 'sci-func') {
        applySciFunc(val);
      } else if (action && action.startsWith('mem-')) {
        handleMemory(action);
      }
    });

    // Global keyboard listener
    window.addEventListener('keydown', handleKeyDown);

    // Saved sound setting
    const savedSound = localStorage.getItem('omni_sound');
    if (savedSound !== null) {
      state.soundEnabled = savedSound === 'true';
      elements.soundOnIcon.classList.toggle('hidden', !state.soundEnabled);
      elements.soundOffIcon.classList.toggle('hidden', state.soundEnabled);
    }
  }

  // --- Initialize App ---
  function init() {
    initTheme();
    loadHistory();
    setupEventListeners();
    updateDisplay();
  }

  init();
})();
