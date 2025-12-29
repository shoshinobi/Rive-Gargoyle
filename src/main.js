/**
 * ============================================
 * RIVE GARGOYLE - Main JavaScript File
 * ============================================
 * 
 * This file handles:
 * - Initializing the Rive animation runtime
 * - Loading and playing .riv files
 * - Creating UI controls for state machine inputs
 * - Data-binding between controls and Rive inputs
 * 
 * Rive SDK Documentation: https://rive.app/docs
 */

// Import the main stylesheet
import './style.css';

// Import the Rive canvas runtime
// Using the @rive-app/canvas package for browser rendering
import { Rive } from '@rive-app/canvas';

/* ============================================
   CONFIGURATION
   ============================================ */

/**
 * Configuration object for the Rive animation
 * Update these values when you have your .riv file ready
 */
const CONFIG = {
  // Path to your .riv file (place in /public folder for Vite)
  rivFilePath: '/your-animation.riv',
  
  // Name of the state machine to use (from your .riv file)
  stateMachineName: 'State Machine 1',
  
  // Optional: Artboard name (leave null to use default)
  artboardName: null,
  
  // Canvas element ID
  canvasId: 'rive-canvas',
  
  // Auto-play on load
  autoplay: true,
};

/* ============================================
   GLOBAL VARIABLES
   ============================================ */

/**
 * Reference to the Rive instance
 * Used for controlling playback and accessing inputs
 * @type {Rive|null}
 */
let riveInstance = null;

/**
 * Reference to the state machine inputs
 * Used for data-binding with UI controls
 * @type {Array}
 */
let stateMachineInputs = [];

/* ============================================
   INITIALIZATION
   ============================================ */

/**
 * Initialize the Rive animation
 * This function sets up the Rive runtime and loads the animation file
 */
function initRive() {
  // Get the canvas element
  const canvas = document.getElementById(CONFIG.canvasId);
  
  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }
  
  try {
    // Create a new Rive instance
    riveInstance = new Rive({
      // Path to the .riv file
      src: CONFIG.rivFilePath,
      
      // The canvas element to render to
      canvas: canvas,
      
      // Automatically play on load
      autoplay: CONFIG.autoplay,
      
      // State machine to use
      stateMachines: CONFIG.stateMachineName,
      
      // Optional: Specific artboard (null = default)
      artboard: CONFIG.artboardName,
      
      // Fit the animation to the canvas
      // Options: 'cover', 'contain', 'fill', 'fitWidth', 'fitHeight', 'none', 'scaleDown'
      fit: 'contain',
      
      // Alignment within the canvas
      // Options: 'center', 'topLeft', 'topCenter', 'topRight', etc.
      alignment: 'center',
      
      /**
       * Callback when the Rive file has finished loading
       * This is where we set up the controls
       */
      onLoad: () => {
        console.log('Rive animation loaded successfully!');
        
        // Resize the canvas to match device pixel ratio for crisp rendering
        resizeCanvas(canvas);
        
        // Get and display the state machine inputs
        setupControls();
      },
      
      /**
       * Callback for load errors
       * Common issues: wrong file path, corrupted file, network error
       */
      onLoadError: (error) => {
        console.error('Error loading Rive file:', error);
        showLoadError();
      },
      
      /**
       * Callback when a state changes in the state machine
       * Useful for debugging and responding to animation states
       */
      onStateChange: (event) => {
        console.log('State changed:', event.data);
      },
    });
    
  } catch (error) {
    console.error('Failed to initialize Rive:', error);
    showLoadError();
  }
}

/**
 * Resize canvas for high-DPI displays
 * This ensures crisp rendering on retina/high-DPI screens
 * 
 * @param {HTMLCanvasElement} canvas - The canvas element to resize
 */
function resizeCanvas(canvas) {
  // Get the device pixel ratio (e.g., 2 for retina displays)
  const dpr = window.devicePixelRatio || 1;
  
  // Get the canvas container dimensions
  const container = canvas.parentElement;
  const rect = container.getBoundingClientRect();
  
  // Set the canvas internal resolution
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  
  // Tell Rive to resize (if instance exists)
  if (riveInstance) {
    riveInstance.resizeDrawingSurfaceToCanvas();
  }
}

/* ============================================
   CONTROLS SETUP
   ============================================ */

/**
 * Set up UI controls based on state machine inputs
 * This function reads the inputs from the Rive file and creates
 * corresponding HTML controls for each one
 */
function setupControls() {
  if (!riveInstance) {
    console.warn('Rive instance not ready');
    return;
  }
  
  // Get all inputs from the state machine
  stateMachineInputs = riveInstance.stateMachineInputs(CONFIG.stateMachineName);
  
  if (!stateMachineInputs || stateMachineInputs.length === 0) {
    console.log('No state machine inputs found');
    return;
  }
  
  console.log('Found inputs:', stateMachineInputs);
  
  // Clear placeholder text
  const placeholder = document.querySelector('.placeholder-text');
  if (placeholder) {
    placeholder.style.display = 'none';
  }
  
  // Get containers for each input type
  const triggersContainer = document.getElementById('triggers-container');
  const booleansContainer = document.getElementById('booleans-container');
  const numbersContainer = document.getElementById('numbers-container');
  
  // Clear existing controls
  triggersContainer.innerHTML = '';
  booleansContainer.innerHTML = '';
  numbersContainer.innerHTML = '';
  
  // Track if we have any inputs of each type
  let hasTriggers = false;
  let hasBooleans = false;
  let hasNumbers = false;
  
  // Iterate through each input and create appropriate control
  stateMachineInputs.forEach((input) => {
    const inputName = input.name;
    const inputType = input.type;
    
    // Create control based on input type
    // Rive input types: 56 = Trigger, 59 = Boolean, 58 = Number
    switch (inputType) {
      case 56: // Trigger
        createTriggerControl(triggersContainer, input, inputName);
        hasTriggers = true;
        break;
        
      case 59: // Boolean
        createBooleanControl(booleansContainer, input, inputName);
        hasBooleans = true;
        break;
        
      case 58: // Number
        createNumberControl(numbersContainer, input, inputName);
        hasNumbers = true;
        break;
        
      default:
        console.log(`Unknown input type: ${inputType} for ${inputName}`);
    }
  });
  
  // Hide empty sections
  document.getElementById('triggers-section').style.display = hasTriggers ? 'block' : 'none';
  document.getElementById('booleans-section').style.display = hasBooleans ? 'block' : 'none';
  document.getElementById('numbers-section').style.display = hasNumbers ? 'block' : 'none';
}

/**
 * Create a trigger button control
 * Triggers fire a one-shot event in the state machine
 * 
 * @param {HTMLElement} container - Container to append the control to
 * @param {Object} input - Rive state machine input object
 * @param {string} name - Display name for the control
 */
function createTriggerControl(container, input, name) {
  // Create button element
  const button = document.createElement('button');
  button.className = 'trigger-button';
  button.textContent = name;
  
  // Add click handler to fire the trigger
  button.addEventListener('click', () => {
    console.log(`Firing trigger: ${name}`);
    input.fire();
  });
  
  container.appendChild(button);
}

/**
 * Create a boolean toggle control
 * Booleans represent on/off states in the animation
 * 
 * @param {HTMLElement} container - Container to append the control to
 * @param {Object} input - Rive state machine input object
 * @param {string} name - Display name for the control
 */
function createBooleanControl(container, input, name) {
  // Create control wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'boolean-control';
  
  // Create label
  const label = document.createElement('label');
  label.textContent = name;
  label.htmlFor = `bool-${name}`;
  
  // Create checkbox input
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = `bool-${name}`;
  checkbox.className = 'toggle-switch';
  checkbox.checked = input.value; // Set initial state
  
  // Add change handler to update Rive input
  checkbox.addEventListener('change', (e) => {
    console.log(`Setting ${name} to:`, e.target.checked);
    input.value = e.target.checked;
  });
  
  wrapper.appendChild(label);
  wrapper.appendChild(checkbox);
  container.appendChild(wrapper);
}

/**
 * Create a number slider control
 * Numbers represent continuous values (0-100 by default)
 * 
 * @param {HTMLElement} container - Container to append the control to
 * @param {Object} input - Rive state machine input object
 * @param {string} name - Display name for the control
 */
function createNumberControl(container, input, name) {
  // Create control wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'number-control';
  
  // Create label with value display
  const label = document.createElement('label');
  label.htmlFor = `num-${name}`;
  label.innerHTML = `
    <span>${name}</span>
    <span class="number-value" id="value-${name}">${input.value.toFixed(1)}</span>
  `;
  
  // Create range slider
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.id = `num-${name}`;
  slider.className = 'number-slider';
  slider.min = 0;
  slider.max = 100;
  slider.step = 0.1;
  slider.value = input.value;
  
  // Add input handler to update Rive input and display
  slider.addEventListener('input', (e) => {
    const newValue = parseFloat(e.target.value);
    console.log(`Setting ${name} to:`, newValue);
    input.value = newValue;
    
    // Update displayed value
    document.getElementById(`value-${name}`).textContent = newValue.toFixed(1);
  });
  
  wrapper.appendChild(label);
  wrapper.appendChild(slider);
  container.appendChild(wrapper);
}

/* ============================================
   ERROR HANDLING
   ============================================ */

/**
 * Display an error message when the .riv file fails to load
 */
function showLoadError() {
  const placeholder = document.querySelector('.placeholder-text');
  if (placeholder) {
    placeholder.innerHTML = `
      <strong>Error loading .riv file</strong><br>
      Please ensure your file is placed in the <code>/public</code> folder
      and update the path in <code>main.js</code>
    `;
    placeholder.style.color = '#ff6b6b';
  }
}

/* ============================================
   WINDOW EVENTS
   ============================================ */

/**
 * Handle window resize events
 * Ensures the canvas stays properly sized
 */
window.addEventListener('resize', () => {
  const canvas = document.getElementById(CONFIG.canvasId);
  if (canvas) {
    resizeCanvas(canvas);
  }
});

/* ============================================
   UTILITY FUNCTIONS (for external use)
   ============================================ */

/**
 * Get the current Rive instance
 * Useful for external scripts or debugging
 * 
 * @returns {Rive|null} The Rive instance or null if not initialized
 */
export function getRiveInstance() {
  return riveInstance;
}

/**
 * Get all state machine inputs
 * 
 * @returns {Array} Array of state machine input objects
 */
export function getInputs() {
  return stateMachineInputs;
}

/**
 * Manually trigger a named input
 * 
 * @param {string} inputName - Name of the input to trigger
 */
export function triggerInput(inputName) {
  const input = stateMachineInputs.find((i) => i.name === inputName);
  if (input && input.fire) {
    input.fire();
  }
}

/**
 * Set a boolean input value
 * 
 * @param {string} inputName - Name of the input
 * @param {boolean} value - Value to set
 */
export function setBooleanInput(inputName, value) {
  const input = stateMachineInputs.find((i) => i.name === inputName);
  if (input) {
    input.value = value;
  }
}

/**
 * Set a number input value
 * 
 * @param {string} inputName - Name of the input
 * @param {number} value - Value to set
 */
export function setNumberInput(inputName, value) {
  const input = stateMachineInputs.find((i) => i.name === inputName);
  if (input) {
    input.value = value;
  }
}

/* ============================================
   START THE APPLICATION
   ============================================ */

// Initialize Rive when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing Rive...');
  initRive();
});
