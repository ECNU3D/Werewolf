import React, { useState } from 'react';
import { ROLES, GAME_PHASES } from '../../constants/gameConstants';
import { translations } from '../../constants/languages';
import { LOG_CATEGORIES } from '../../utils/logManager';

const ScenarioComposer = ({ 
  editingScenario, 
  setEditingScenario, 
  saveCurrentScenario, 
  createDefaultScenario,
  currentLanguage 
}) => {
  const updateScenarioField = (field, value) => {
    setEditingScenario(prev => ({ ...prev, [field]: value }));
  };

  const updateGameStateField = (field, value) => {
    setEditingScenario(prev => ({
      ...prev,
      gameState: { ...prev.gameState, [field]: value }
    }));
  };

  const updatePlayer = (updatedPlayer) => {
    setEditingScenario(prev => ({
      ...prev,
      gameState: {
        ...prev.gameState,
        players: prev.gameState.players.map(p => 
          p.id === updatedPlayer.id ? updatedPlayer : p
        )
      }
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">场景编辑器</h3>
        <div className="space-x-2">
          <button
            onClick={() => setEditingScenario(createDefaultScenario())}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            新建场景
          </button>
          <button
            onClick={saveCurrentScenario}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={!editingScenario}
          >
            保存场景
          </button>
        </div>
      </div>

      {editingScenario && (
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">场景名称</label>
              <input
                type="text"
                value={editingScenario.name}
                onChange={(e) => updateScenarioField('name', e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">游戏阶段</label>
              <select
                value={editingScenario.gameState.phase}
                onChange={(e) => updateGameStateField('phase', e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                {Object.values(GAME_PHASES).map(phase => (
                  <option key={phase} value={phase}>
                    {translations[currentLanguage].phases[phase]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">场景描述</label>
            <textarea
              value={editingScenario.description}
              onChange={(e) => updateScenarioField('description', e.target.value)}
              className="w-full border rounded px-3 py-2 h-20"
            />
          </div>

          {/* Player Configuration */}
          <PlayerConfigSection 
            players={editingScenario.gameState.players}
            onUpdatePlayer={updatePlayer}
            currentLanguage={currentLanguage}
          />

          {/* Game History Editor */}
          <GameHistoryEditor
            history={editingScenario.gameState.gameHistory}
            onUpdate={(history) => updateGameStateField('gameHistory', history)}
          />

          {/* Special States */}
          <SpecialStatesEditor
            states={editingScenario.gameState.specialStates}
            onUpdate={(states) => updateGameStateField('specialStates', states)}
            currentLanguage={currentLanguage}
          />

          {/* Test Targets */}
          <TestTargetsEditor
            targets={editingScenario.testTargets}
            players={editingScenario.gameState.players}
            onUpdate={(targets) => updateScenarioField('testTargets', targets)}
            currentLanguage={currentLanguage}
          />
        </div>
      )}
    </div>
  );
};

const PlayerConfigSection = ({ players, onUpdatePlayer, currentLanguage }) => (
  <div>
    <h4 className="text-lg font-semibold mb-3">玩家配置</h4>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {players.map(player => (
        <PlayerEditor
          key={player.id}
          player={player}
          onUpdate={onUpdatePlayer}
          currentLanguage={currentLanguage}
        />
      ))}
    </div>
  </div>
);

const PlayerEditor = ({ player, onUpdate, currentLanguage }) => (
  <div className="border rounded p-3 space-y-2">
    <div className="font-semibold">玩家 {player.id}</div>
    
    <div>
      <label className="block text-xs text-gray-600">身份</label>
      <select
        value={player.role}
        onChange={(e) => onUpdate({ ...player, role: e.target.value })}
        className="w-full text-sm border rounded px-2 py-1"
      >
        {Object.values(ROLES).map(role => (
          <option key={role} value={role}>
            {translations[currentLanguage].roles[role]}
          </option>
        ))}
      </select>
    </div>

    <div className="flex items-center space-x-4 text-sm">
      <label className="flex items-center">
        <input
          type="checkbox"
          checked={player.isAlive}
          onChange={(e) => onUpdate({ ...player, isAlive: e.target.checked })}
        />
        <span className="ml-1">存活</span>
      </label>
      <label className="flex items-center">
        <input
          type="checkbox"
          checked={player.isHuman}
          onChange={(e) => onUpdate({ ...player, isHuman: e.target.checked })}
        />
        <span className="ml-1">人类</span>
      </label>
    </div>

    {!player.isAlive && (
      <div>
        <label className="block text-xs text-gray-600">已知身份</label>
        <select
          value={player.revealedRole || ''}
          onChange={(e) => onUpdate({ ...player, revealedRole: e.target.value || null })}
          className="w-full text-sm border rounded px-2 py-1"
        >
          <option value="">未揭示</option>
          {Object.values(ROLES).map(role => (
            <option key={role} value={role}>
              {translations[currentLanguage].roles[role]}
            </option>
          ))}
        </select>
      </div>
    )}
  </div>
);

const GameHistoryEditor = ({ history, onUpdate }) => {
  const [newEntry, setNewEntry] = useState({ 
    timestamp: new Date().toLocaleTimeString(),
    type: 'system',
    text: '',
    category: LOG_CATEGORIES.GAME_FLOW
  });

  const addHistoryEntry = () => {
    if (newEntry.text.trim()) {
      onUpdate([...history, { ...newEntry }]);
      setNewEntry({ 
        timestamp: new Date().toLocaleTimeString(),
        type: 'system',
        text: '',
        category: LOG_CATEGORIES.GAME_FLOW
      });
    }
  };

  const removeHistoryEntry = (index) => {
    const newHistory = [...history];
    newHistory.splice(index, 1);
    onUpdate(newHistory);
  };

  return (
    <div>
      <h4 className="text-lg font-semibold mb-3">游戏历史</h4>
      
      {/* History List */}
      <div className="max-h-60 overflow-y-auto border rounded p-3 mb-4 space-y-2">
        {history.map((entry, index) => (
          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
            <div className="flex-1">
              <span className="text-xs text-gray-500">{entry.timestamp}</span>
              <span className="ml-2 text-sm font-medium">
                [{entry.type === 'system' ? '系统' : entry.type === 'human' ? '人类' : 'AI'}]
              </span>
              <span className="ml-2 text-sm">{entry.text}</span>
            </div>
            <button
              onClick={() => removeHistoryEntry(index)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              删除
            </button>
          </div>
        ))}
      </div>

      {/* Add New Entry */}
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-2">
          <select
            value={newEntry.type}
            onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value })}
            className="w-full text-sm border rounded px-2 py-1"
          >
            <option value="system">系统</option>
            <option value="human">人类</option>
            <option value="ai">AI</option>
          </select>
        </div>
        <div className="col-span-8">
          <input
            type="text"
            value={newEntry.text}
            onChange={(e) => setNewEntry({ ...newEntry, text: e.target.value })}
            placeholder="输入历史记录..."
            className="w-full text-sm border rounded px-2 py-1"
            onKeyPress={(e) => e.key === 'Enter' && addHistoryEntry()}
          />
        </div>
        <div className="col-span-2">
          <button
            onClick={addHistoryEntry}
            className="w-full text-sm bg-blue-500 text-white rounded px-2 py-1 hover:bg-blue-600"
          >
            添加
          </button>
        </div>
      </div>
    </div>
  );
};

const SpecialStatesEditor = ({ states, onUpdate, currentLanguage }) => (
  <div>
    <h4 className="text-lg font-semibold mb-3">特殊状态</h4>
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Witch Potions */}
      <div className="border rounded p-3">
        <h5 className="font-semibold text-sm mb-2">女巫药剂</h5>
        <div className="space-y-2">
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={states.witchPotions.antidote}
              onChange={(e) => onUpdate({
                ...states,
                witchPotions: { ...states.witchPotions, antidote: e.target.checked }
              })}
            />
            <span className="ml-1">解药可用</span>
          </label>
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={states.witchPotions.poison}
              onChange={(e) => onUpdate({
                ...states,
                witchPotions: { ...states.witchPotions, poison: e.target.checked }
              })}
            />
            <span className="ml-1">毒药可用</span>
          </label>
        </div>
      </div>

      {/* Guard Info */}
      <div className="border rounded p-3">
        <h5 className="font-semibold text-sm mb-2">守卫信息</h5>
        <div>
          <label className="block text-xs text-gray-600">上次保护</label>
          <input
            type="number"
            min="0"
            max="8"
            value={states.guardLastProtectedId || ''}
            onChange={(e) => onUpdate({
              ...states,
              guardLastProtectedId: e.target.value ? parseInt(e.target.value) : null
            })}
            className="w-full text-sm border rounded px-2 py-1"
            placeholder="玩家ID"
          />
        </div>
      </div>

      {/* Seer Info */}
      <div className="border rounded p-3">
        <h5 className="font-semibold text-sm mb-2">预言家信息</h5>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-600">查验目标</label>
            <input
              type="number"
              min="1"
              max="8"
              value={states.seerLastCheck?.targetId || ''}
              onChange={(e) => onUpdate({
                ...states,
                seerLastCheck: {
                  ...states.seerLastCheck,
                  targetId: e.target.value ? parseInt(e.target.value) : null
                }
              })}
              className="w-full text-sm border rounded px-2 py-1"
              placeholder="玩家ID"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600">查验结果</label>
            <select
              value={states.seerLastCheck?.targetRole || ''}
              onChange={(e) => onUpdate({
                ...states,
                seerLastCheck: {
                  ...states.seerLastCheck,
                  targetRole: e.target.value
                }
              })}
              className="w-full text-sm border rounded px-2 py-1"
            >
              <option value="">选择身份</option>
              {Object.values(ROLES).map(role => (
                <option key={role} value={role}>
                  {translations[currentLanguage].roles[role]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const TestTargetsEditor = ({ targets, players, onUpdate, currentLanguage }) => {
  const addTestTarget = () => {
    const availablePlayers = players.filter(p => p.isAlive && !targets.find(t => t.playerId === p.id));
    if (availablePlayers.length > 0) {
      const newTarget = {
        playerId: availablePlayers[0].id,
        role: availablePlayers[0].role,
        action: 'DISCUSSION_STATEMENT'
      };
      onUpdate([...targets, newTarget]);
    }
  };

  const updateTarget = (index, field, value) => {
    const newTargets = [...targets];
    newTargets[index] = { ...newTargets[index], [field]: value };
    if (field === 'playerId') {
      const player = players.find(p => p.id === parseInt(value));
      if (player) {
        newTargets[index].role = player.role;
      }
    }
    onUpdate(newTargets);
  };

  const removeTarget = (index) => {
    const newTargets = [...targets];
    newTargets.splice(index, 1);
    onUpdate(newTargets);
  };

  const actionOptions = [
    { value: 'WEREWOLF_TARGET', label: '狼人选择目标' },
    { value: 'GUARD_PROTECT', label: '守卫保护' },
    { value: 'SEER_CHECK', label: '预言家查验' },
    { value: 'WITCH_SAVE_CHOICE', label: '女巫救人选择' },
    { value: 'WITCH_POISON_CHOICE', label: '女巫毒人选择' },
    { value: 'HUNTER_SHOOT', label: '猎人开枪' },
    { value: 'DISCUSSION_STATEMENT', label: '讨论发言' },
    { value: 'VOTE_PLAYER', label: '投票选择' }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-lg font-semibold">测试目标</h4>
        <button
          onClick={addTestTarget}
          className="text-sm bg-green-500 text-white rounded px-3 py-1 hover:bg-green-600"
        >
          添加测试目标
        </button>
      </div>

      <div className="space-y-3">
        {targets.map((target, index) => (
          <div key={index} className="border rounded p-3 grid grid-cols-12 gap-3 items-center">
            <div className="col-span-2">
              <label className="block text-xs text-gray-600">玩家</label>
              <select
                value={target.playerId}
                onChange={(e) => updateTarget(index, 'playerId', parseInt(e.target.value))}
                className="w-full text-sm border rounded px-2 py-1"
              >
                {players.filter(p => p.isAlive).map(player => (
                  <option key={player.id} value={player.id}>
                    玩家 {player.id}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-600">身份</label>
              <div className="text-sm py-1 px-2 bg-gray-100 rounded">
                {translations[currentLanguage].roles[target.role]}
              </div>
            </div>
            <div className="col-span-6">
              <label className="block text-xs text-gray-600">测试动作</label>
              <select
                value={target.action}
                onChange={(e) => updateTarget(index, 'action', e.target.value)}
                className="w-full text-sm border rounded px-2 py-1"
              >
                {actionOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <button
                onClick={() => removeTarget(index)}
                className="text-sm text-red-500 hover:text-red-700"
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScenarioComposer; 