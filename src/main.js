// Rive Gargoyle - Main JS
// Controls a Rive animation with viseme/phoneme controls via View Model data binding

import './style.css';
import { Rive } from '@rive-app/canvas';

// === CONFIGURATION ===
const CONFIG = {
  rivFilePath: '/gargoyle.riv',
  stateMachineName: 'SM_Main',
  artboardName: 'MAIN',
  phonemesEnumName: 'phonemes',       // Enum containing mouth shape values
  visemesPropertyName: 'visemes',     // Property on nested VM_Visemes component
  canvasId: 'rive-canvas',
  autoplay: true,
  autoBind: true,
};

const RESET_DELAY_MS = 1000;  // Auto-reset to 'none' after 1 second

// === STATE ===
let riveInstance = null;
let viewModelInstance = null;
let visemeProperty = null;
let currentEnumValues = [];
let resetTimer = null;

// === INITIALIZATION ===
function initRive() {
  const canvas = document.getElementById(CONFIG.canvasId);
  if (!canvas) return;

  riveInstance = new Rive({
    src: CONFIG.rivFilePath,
    canvas: canvas,
    autoplay: CONFIG.autoplay,
    stateMachines: CONFIG.stateMachineName,
    artboard: CONFIG.artboardName,
    autoBind: CONFIG.autoBind,
    fit: 'contain',
    alignment: 'center',
    onLoad: () => {
      resizeCanvas(canvas);
      viewModelInstance = riveInstance.viewModelInstance;
      if (viewModelInstance) {
        setupViewModelControls();
      }
    },
    onLoadError: (error) => console.error('Error loading Rive file:', error),
  });
}

// === CANVAS RESIZE (for HiDPI displays) ===
function resizeCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const container = canvas.parentElement;
  const rect = container.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  if (riveInstance) {
    riveInstance.resizeDrawingSurfaceToCanvas();
  }
}

// === VIEW MODEL CONTROLS SETUP ===
function setupViewModelControls() {
  if (!viewModelInstance) return;

  const placeholder = document.querySelector('.placeholder-text');
  if (placeholder) placeholder.style.display = 'none';

  // Try to get the visemes enum property
  // The property may be on a nested View Model component, so try multiple paths
  visemeProperty = viewModelInstance.enum(CONFIG.visemesPropertyName);
  
  // Try nested path if direct access fails
  if (!visemeProperty) {
    visemeProperty = viewModelInstance.enum(`viseme/${CONFIG.visemesPropertyName}`);
  }
  
  if (visemeProperty) {
    createEnumControl('visemes', visemeProperty, CONFIG.phonemesEnumName);
  } else {
    console.warn('visemes property not found on View Model');
  }

  // Hide unused sections
  document.getElementById('numbers-section').style.display = 'none';
  document.getElementById('triggers-section').style.display = 'none';
  document.getElementById('booleans-section').style.display = 'none';
}

// === CREATE ENUM CONTROL UI ===
function createEnumControl(name, enumProperty, enumName) {
  // Create section container
  let enumSection = document.getElementById('enums-section');
  if (!enumSection) {
    const controlsContent = document.getElementById('controls-content');
    enumSection = document.createElement('div');
    enumSection.id = 'enums-section';
    enumSection.className = 'control-section';
    enumSection.innerHTML = `<h3>Visemes</h3><div id="enums-container"></div>`;
    controlsContent.appendChild(enumSection);
  }
  
  const container = document.getElementById('enums-container');
  const wrapper = document.createElement('div');
  wrapper.className = 'enum-control';
  
  // Get enum values from Rive file
  let enumValues = [];
  const fileEnums = riveInstance.enums();
  if (fileEnums && Array.isArray(fileEnums)) {
    const matchingEnum = fileEnums.find(e => e.name.toLowerCase() === enumName.toLowerCase());
    if (matchingEnum && matchingEnum.values) {
      enumValues = matchingEnum.values;
    }
  }
  currentEnumValues = enumValues;
  
  // Current value display
  const currentValueDisplay = document.createElement('div');
  currentValueDisplay.className = 'enum-current-value';
  currentValueDisplay.id = `current-${name}`;
  currentValueDisplay.innerHTML = `<span class="current-label">Current:</span> <span class="current-value">${enumProperty.value || 'none'}</span>`;
  wrapper.appendChild(currentValueDisplay);
  
  // Button grid
  const buttonGrid = document.createElement('div');
  buttonGrid.className = 'enum-button-grid';
  
  enumValues.forEach((value, index) => {
    const button = document.createElement('button');
    button.className = 'enum-button';
    button.dataset.value = value;
    
    // Add keyboard shortcut badge for 1-9
    if (index < 9) {
      button.innerHTML = `<span class="key-badge">${index + 1}</span><span class="btn-text">${value}</span>`;
    } else {
      button.innerHTML = `<span class="btn-text">${value}</span>`;
    }
    
    if (enumProperty.value === value) button.classList.add('active');
    
    button.addEventListener('click', () => {
      enumProperty.value = value;
      buttonGrid.querySelectorAll('.enum-button').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      updateCurrentDisplay(name, value);
    });
    
    buttonGrid.appendChild(button);
  });
  
  wrapper.appendChild(buttonGrid);
  container.appendChild(wrapper);
}

// === UI HELPERS ===
function updateCurrentDisplay(name, value) {
  const display = document.getElementById(`current-${name}`);
  if (display) {
    display.innerHTML = `<span class="current-label">Current:</span> <span class="current-value">${value}</span>`;
  }
}

function updateVisemeUI(value) {
  updateCurrentDisplay('visemes', value);
  const buttons = document.querySelectorAll('#enums-container .enum-button');
  buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.value === value));
}

function resetVisemeToNone() {
  if (visemeProperty && currentEnumValues.includes('none')) {
    visemeProperty.value = 'none';
    updateVisemeUI('none');
  }
}

// === EVENT LISTENERS ===
window.addEventListener('resize', () => {
  const canvas = document.getElementById(CONFIG.canvasId);
  if (canvas) resizeCanvas(canvas);
});

// Keyboard shortcuts: 1-9 trigger phonemes
window.addEventListener('keydown', (event) => {
  const keyNum = parseInt(event.key);
  
  if (keyNum >= 1 && keyNum <= 9 && currentEnumValues.length > 0) {
    if (resetTimer) {
      clearTimeout(resetTimer);
      resetTimer = null;
    }
    
    const index = keyNum - 1;
    if (index < currentEnumValues.length && visemeProperty) {
      const value = currentEnumValues[index];
      visemeProperty.value = value;
      updateVisemeUI(value);
      resetTimer = setTimeout(resetVisemeToNone, RESET_DELAY_MS);
    }
  }
});

// === START ===
document.addEventListener('DOMContentLoaded', initRive);
