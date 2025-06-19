# Werewolf Game Internationalization (i18n)

This Werewolf game now supports multiple languages with a comprehensive internationalization system.

## 🌍 Supported Languages

- **中文 (Chinese)** - Native Chinese interface with traditional game terminology
- **English** - Full English translation with Western gaming conventions

## ✨ Features

### Language Selection
- **Initial Language Selection**: When you first open the game, you'll be presented with a beautiful language selection screen
- **Persistent Choice**: Your language preference is saved to localStorage and remembered across sessions
- **Real-time Switching**: Language changes apply immediately without requiring a restart

### Complete Translation Coverage

#### 🎮 Game Interface
- All UI components (buttons, menus, forms)
- Game phases and status messages
- Player actions and interactions
- Error messages and notifications

#### 🎯 Game Content
- **Role Names**: Werewolf, Seer, Witch, Hunter, Guard, Villager
- **Role Descriptions**: Detailed explanations of each role's abilities
- **Game Phases**: Night phases, day phases, voting, discussions
- **Victory Conditions**: Win/lose messages for different factions

#### 🤖 AI System
- **AI Prompts**: Completely localized AI behavior prompts
- **Speech Recognition**: Language-specific voice recognition (Chinese: zh-CN, English: en-US)
- **Game Log**: All system messages and player actions

## 🔧 Technical Implementation

### Architecture
```
src/
├── constants/
│   └── languages.js          # Translation definitions
├── contexts/
│   └── LanguageContext.js    # React context for language management
├── components/
│   └── LanguageSelection.jsx # Initial language selection screen
└── utils/
    └── gameUtils.js          # Localized AI prompts
```

### Usage in Components
```javascript
import { useLanguage } from '../contexts/LanguageContext';

const MyComponent = () => {
  const { t, tr, tp, currentLanguage } = useLanguage();
  
  return (
    <div>
      <h1>{t('gameTitle')}</h1>                    // General translation
      <p>{tr('WEREWOLF')}</p>                      // Role translation
      <span>{tp('NIGHT_START')}</span>             // Phase translation
    </div>
  );
};
```

### Translation Functions
- **`t(key, interpolations)`**: General translation with interpolation support
- **`tr(role)`**: Role-specific translation
- **`tp(phase)`**: Game phase translation
- **`switchLanguage(language)`**: Change the current language

### Interpolation Support
```javascript
// Translation with variables
t('speech.yourSpeech', { id: playerId, text: speechText })
// Renders: "You (Player 1) said: Hello everyone!"
```

## 🎨 UI Features

### Language Selection Screen
- Beautiful gradient background with animated elements
- Flag icons for each language
- Bilingual instructions
- Smooth transitions and hover effects

### Responsive Design
- All translations adapt to different screen sizes
- Text length variations handled gracefully
- Consistent visual hierarchy across languages

## 🔄 Adding New Languages

To add a new language:

1. **Add language constant**:
```javascript
// src/constants/languages.js
export const LANGUAGES = {
  CHINESE: 'zh',
  ENGLISH: 'en',
  JAPANESE: 'ja'  // New language
};
```

2. **Add translation object**:
```javascript
export const translations = {
  // ... existing translations
  [LANGUAGES.JAPANESE]: {
    gameTitle: '人狼ゲーム',
    // ... complete translation set
  }
};
```

3. **Update language names**:
```javascript
export const LANGUAGE_NAMES = {
  [LANGUAGES.CHINESE]: '中文',
  [LANGUAGES.ENGLISH]: 'English',
  [LANGUAGES.JAPANESE]: '日本語'
};
```

4. **Add speech recognition support** (if applicable):
```javascript
// src/hooks/useSpeechRecognition.js
recognitionInstance.lang = currentLanguage === LANGUAGES.JAPANESE ? 'ja-JP' : // ...
```

## 🎯 Key Benefits

1. **Accessibility**: Native language support makes the game accessible to more players
2. **User Experience**: Smooth language switching without interrupting gameplay
3. **Localization**: Cultural adaptation of game terminology and concepts
4. **Maintainability**: Centralized translation management
5. **Extensibility**: Easy to add new languages

## 🚀 Getting Started

1. Run the application: `npm start`
2. Select your preferred language on the welcome screen
3. Enjoy the game in your chosen language!

The language preference is automatically saved and will be remembered for future sessions.

---

*This internationalization system ensures that players worldwide can enjoy the Werewolf game in their preferred language with a fully localized experience.* 