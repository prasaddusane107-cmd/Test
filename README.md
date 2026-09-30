# OmniCalc Pro • Next-Gen Glassmorphic Web Calculator

A modern, responsive, and aesthetic web calculator built with vanilla HTML, CSS, and JavaScript. Designed with glassmorphism aesthetics, ambient animated background orbs, tactile Web Audio API sound feedback, and support for both standard and scientific calculations.

## ✨ Features

- **Dual Modes (Standard & Scientific)**:
  - **Standard**: Basic arithmetic (`+`, `−`, `×`, `÷`), brackets `()`, percentages, square ($x^2$), reciprocal ($1/x$), and sign toggling ($\pm$).
  - **Scientific**: Trigonometry ($\sin, \cos, \tan, \sin^{-1}, \cos^{-1}, \tan^{-1}$), DEG/RAD mode toggle, natural and base-10 logarithms ($\ln, \log_{10}$), powers ($x^y$), roots ($\sqrt{x}, \sqrt[3]{x}$), factorials ($n!$), constants ($\pi, e$), and modulo arithmetic.
- **Glassmorphism Design & Themes**:
  - Ambient floating background orbs and sleek blurred glass panels (`backdrop-filter: blur`).
  - 4 built-in themes:
    - 🌌 **Midnight Neon** (Default)
    - ⚡ **Cyber Matrix**
    - 🌸 **Nordic Aurora**
    - ❄️ **Frosted Light**
- **Tactile Sound Effects**:
  - Realistic mechanical click sounds synthesized in real-time via the Web Audio API without any external audio assets.
  - Dedicated sound mute/unmute button.
- **Calculation History Tape**:
  - Automatically records previous calculations with timestamps.
  - Click any past calculation to recall its expression or result back into the calculator.
- **Memory Operations**:
  - $MC$ (Memory Clear), $MR$ (Memory Recall), $M+$ (Memory Add), $M-$ (Memory Subtract) with active memory badge.
- **Keyboard Shortcuts**:
  - Full keyboard support for digits, operators, parentheses, equals/Enter, AC/Escape, and Backspace.
  - Hotkeys for scientific functions (`s`, `c`, `t`, `p`, `e`, etc.).
  - Built-in shortcuts cheat-sheet modal (`?` button).
- **Copy to Clipboard**:
  - Quick-copy current result to system clipboard with a tooltip confirmation.

## 🚀 Getting Started

Simply open `index.html` in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Brave, Safari, etc.). No installation, server, or build step required!

```bash
# Clone the repository
git clone https://github.com/prasaddusane107-cmd/Test.git

# Navigate into the folder
cd Test

# Open index.html in your default browser (Windows)
start index.html
```

## 🛠️ Built With

- **HTML5**: Semantic markup & accessibility features.
- **CSS3**: Custom design tokens, CSS grid/flexbox, backdrop filters, CSS keyframe animations.
- **Vanilla JavaScript**: Pure JS calculation engine, precision math sanitizer, Web Audio API synthesis, local storage persistence.

---
*Created with ❤️*
