# Werewolf Game Refactoring Guide

## Overview
The original `App.jsx` file was over 1200 lines long and contained multiple responsibilities. This refactoring breaks it down into smaller, more maintainable pieces while ensuring all functionality remains unchanged.

## New Structure

### 📁 Constants
- **`src/constants/gameConstants.js`** - All game constants (ROLES, GAME_PHASES, etc.)

### 📁 Utilities  
- **`src/utils/gameUtils.js`** - Game logic utilities (player initialization, win condition checking)
- **`src/utils/aiUtils.js`** - AI decision-making logic with Gemini API

### 📁 Custom Hooks
- **`src/hooks/useGameLogic.js`** - Main game state management hook
- **`src/hooks/useGamePhaseManager.js`** - Game phase progression and AI actions
- **`src/hooks/useSpeechRecognition.js`** - Speech recognition functionality

### 📁 Components
- **`src/components/SetupScreen.jsx`** - Game setup/start screen
- **`src/components/GameOverScreen.jsx`** - Game over screen with results
- **`src/components/RoleModal.jsx`** - Role reveal modal
- **`src/components/GameInfo.jsx`** - Game information panel
- **`src/components/ActionPanel.jsx`** - Player action controls
- **`src/components/GameLog.jsx`** - Game log display
- **`src/components/PlayerCard.jsx`** - Individual player card component

### 📁 Main App
- **`src/AppRefactored.jsx`** - Refactored main app component (much cleaner!)

## Benefits of Refactoring

### ✅ Improved Maintainability
- Each file has a single responsibility
- Easier to locate and fix bugs
- Simpler to add new features

### ✅ Better Code Organization
- Related code is grouped together
- Clear separation of concerns
- Consistent file structure

### ✅ Enhanced Reusability
- Components can be reused in other parts of the app
- Utilities can be shared across different components
- Hooks can be used in multiple components

### ✅ Easier Testing
- Individual components and utilities can be tested in isolation
- Mock dependencies more easily
- Write focused unit tests

### ✅ Better Developer Experience
- Smaller files are easier to navigate
- Clear import/export structure
- Self-documenting code organization

## Migration Steps

1. **Constants**: All game constants moved to dedicated file
2. **Utilities**: Game logic and AI functions extracted
3. **Hooks**: State management and side effects separated
4. **Components**: UI components broken into smaller pieces
5. **Main App**: Clean composition of all parts

## Functionality Preservation

⚠️ **Important**: All original functionality has been preserved:
- Game state management
- AI decision making
- Speech recognition
- Game phase progression
- Player actions
- Win condition checking
- UI interactions

## Usage

To use the refactored version, simply replace the import in your `index.js`:

```javascript
// OLD
import App from './App';

// NEW  
import App from './AppRefactored';
```

Or rename `AppRefactored.jsx` to `App.jsx` after backing up the original. 