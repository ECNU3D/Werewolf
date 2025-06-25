import React, { useState, useEffect, useCallback } from 'react';
import { ROLES, GAME_PHASES, PLAYER_COUNT } from '../constants/gameConstants';
import { LANGUAGES, translations } from '../constants/languages';
import { getAIDecision } from '../utils/aiUtils';
import { logManager, LOG_CATEGORIES, LOG_VISIBILITY } from '../utils/logManager';
import ScenarioComposer from './tuning/ScenarioComposer';
import TestRunner from './tuning/TestRunner';
import PromptEditor from './tuning/PromptEditor';
import ScenarioManager from './tuning/ScenarioManager';

const AITuningTool = () => {
  // Core state
  const [activeTab, setActiveTab] = useState('scenarios');
  const [currentLanguage, setCurrentLanguage] = useState(LANGUAGES.CHINESE);
  
  // Scenario state
  const [scenarios, setScenarios] = useState([]);
  const [currentScenario, setCurrentScenario] = useState(null);
  const [editingScenario, setEditingScenario] = useState(null);
  
  // Test results state
  const [testResults, setTestResults] = useState([]);
  const [isRunningTest, setIsRunningTest] = useState(false);
  
  // Prompt editing state
  const [editablePrompts, setEditablePrompts] = useState({});
  const [originalPrompts, setOriginalPrompts] = useState({});

  // Initialize default scenario
  useEffect(() => {
    const defaultScenario = createDefaultScenario();
    setCurrentScenario(defaultScenario);
    setEditingScenario(defaultScenario);
    
    // Initialize editable prompts with current translations
    const currentTranslations = translations[currentLanguage];
    if (currentTranslations?.aiPrompts) {
      setEditablePrompts(JSON.parse(JSON.stringify(currentTranslations.aiPrompts)));
      setOriginalPrompts(JSON.parse(JSON.stringify(currentTranslations.aiPrompts)));
    }
  }, [currentLanguage]);

  const createDefaultScenario = useCallback(() => ({
    id: Date.now(),
    name: '默认测试场景',
    description: '一个基础的测试场景',
    gameState: {
      round: 3,
      phase: GAME_PHASES.DISCUSSION,
      players: Array.from({ length: PLAYER_COUNT }, (_, i) => ({
        id: i + 1,
        role: i < 2 ? ROLES.WEREWOLF : 
              i === 2 ? ROLES.SEER :
              i === 3 ? ROLES.WITCH :
              i === 4 ? ROLES.HUNTER :
              i === 5 ? ROLES.GUARD : ROLES.VILLAGER,
        isAlive: i !== 3, // Player 4 (witch) is dead
        isHuman: i === 1,
        revealedRole: i === 3 ? ROLES.WITCH : null,
        votes: 0,
        isProtected: false,
        isTargetedByWolf: false,
        isHealedByWitch: false
      })),
      gameHistory: [
        { timestamp: '10:00:00', type: 'system', text: '第1轮夜晚，狼人攻击了玩家2', category: LOG_CATEGORIES.NIGHT_ACTIONS },
        { timestamp: '10:00:30', type: 'system', text: '女巫使用解药救了玩家2', category: LOG_CATEGORIES.NIGHT_ACTIONS },
        { timestamp: '10:01:00', type: 'system', text: '第1轮白天，没有玩家死亡', category: LOG_CATEGORIES.GAME_FLOW },
        { timestamp: '10:02:00', type: 'ai', text: '我觉得玩家5很可疑，他昨晚的发言有问题', category: LOG_CATEGORIES.DISCUSSION },
        { timestamp: '10:03:00', type: 'human', text: '玩家6昨天投票行为很奇怪', category: LOG_CATEGORIES.DISCUSSION },
        { timestamp: '10:04:00', type: 'system', text: '投票结果：玩家8被淘汰，身份是平民', category: LOG_CATEGORIES.VOTING },
        { timestamp: '10:05:00', type: 'system', text: '第2轮夜晚，狼人攻击了玩家4', category: LOG_CATEGORIES.NIGHT_ACTIONS },
        { timestamp: '10:05:30', type: 'system', text: '玩家4（女巫）死亡', category: LOG_CATEGORIES.DEATHS },
        { timestamp: '10:06:00', type: 'system', text: '第3轮白天开始', category: LOG_CATEGORIES.GAME_FLOW }
      ],
      specialStates: {
        witchPotions: { antidote: false, poison: true },
        guardLastProtectedId: 2,
        seerLastCheck: { targetId: 5, targetRole: ROLES.VILLAGER },
        werewolfTargetId: null,
        playerToPoisonId: null,
        hunterTargetId: null
      }
    },
    testTargets: [
      { playerId: 1, role: ROLES.WEREWOLF, action: 'DISCUSSION_STATEMENT' },
      { playerId: 2, role: ROLES.SEER, action: 'DISCUSSION_STATEMENT' },
      { playerId: 5, role: ROLES.GUARD, action: 'VOTE_PLAYER' }
    ]
  }), []);

  const saveCurrentScenario = useCallback(() => {
    if (editingScenario) {
      const scenarioToSave = { ...editingScenario, id: editingScenario.id || Date.now() };
      setScenarios(prev => {
        const existingIndex = prev.findIndex(s => s.id === scenarioToSave.id);
        if (existingIndex >= 0) {
          // Update existing scenario
          const updated = [...prev];
          updated[existingIndex] = scenarioToSave;
          return updated;
        } else {
          // Add new scenario
          return [...prev, scenarioToSave];
        }
      });
      setCurrentScenario(scenarioToSave);
    }
  }, [editingScenario]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">狼人杀 AI 调优工具</h1>
              <p className="text-gray-600 mt-2">设计和测试不同游戏场景下的AI行为</p>
            </div>
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium mb-1">语言设置</label>
                <select
                  value={currentLanguage}
                  onChange={(e) => setCurrentLanguage(e.target.value)}
                  className="border rounded px-3 py-2"
                >
                  <option value={LANGUAGES.CHINESE}>中文</option>
                  <option value={LANGUAGES.ENGLISH}>English</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('scenarios')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'scenarios'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                场景编辑
              </button>
              <button
                onClick={() => setActiveTab('prompts')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'prompts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                提示词编辑
              </button>
              <button
                onClick={() => setActiveTab('testing')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'testing'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                测试运行
              </button>
              <button
                onClick={() => setActiveTab('management')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'management'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                场景管理
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'scenarios' && (
            <ScenarioComposer
              editingScenario={editingScenario}
              setEditingScenario={setEditingScenario}
              saveCurrentScenario={saveCurrentScenario}
              createDefaultScenario={createDefaultScenario}
              currentLanguage={currentLanguage}
            />
          )}
          
          {activeTab === 'prompts' && (
            <PromptEditor
              editablePrompts={editablePrompts}
              setEditablePrompts={setEditablePrompts}
              originalPrompts={originalPrompts}
              currentLanguage={currentLanguage}
            />
          )}
          
          {activeTab === 'testing' && (
            <TestRunner
              currentScenario={currentScenario}
              testResults={testResults}
              setTestResults={setTestResults}
              isRunningTest={isRunningTest}
              setIsRunningTest={setIsRunningTest}
              currentLanguage={currentLanguage}
            />
          )}
          
          {activeTab === 'management' && (
            <ScenarioManager
              scenarios={scenarios}
              setScenarios={setScenarios}
              currentScenario={currentScenario}
              setCurrentScenario={setCurrentScenario}
              setEditingScenario={setEditingScenario}
              currentLanguage={currentLanguage}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AITuningTool; 