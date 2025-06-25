import React, { useState } from 'react';
import { translations } from '../../constants/languages';

const PromptEditor = ({ 
  editablePrompts, 
  setEditablePrompts, 
  originalPrompts, 
  currentLanguage 
}) => {
  const [activeSection, setActiveSection] = useState('gameHistory');
  const [searchTerm, setSearchTerm] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const updatePrompt = (path, value) => {
    const newPrompts = { ...editablePrompts };
    const keys = path.split('.');
    let current = newPrompts;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setEditablePrompts(newPrompts);
    setHasChanges(true);
  };

  const resetToDefault = () => {
    setEditablePrompts(JSON.parse(JSON.stringify(originalPrompts)));
    setHasChanges(false);
  };

  const savePrompts = () => {
    // In a real implementation, this would save to a file or database
    console.log('Saving prompts:', editablePrompts);
    localStorage.setItem('werewolf_custom_prompts', JSON.stringify(editablePrompts));
    setHasChanges(false);
    alert('提示词模板已保存到本地存储！');
  };

  const exportPrompts = () => {
    const dataStr = JSON.stringify(editablePrompts, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `werewolf_prompts_${currentLanguage}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importPrompts = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const imported = JSON.parse(e.target.result);
            setEditablePrompts(imported);
            setHasChanges(true);
            alert('提示词模板导入成功！');
          } catch (error) {
            alert('导入失败: ' + error.message);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const getPromptPreview = (prompt, variables = []) => {
    let preview = prompt;
    variables.forEach(variable => {
      const placeholder = `{{${variable.name}}}`;
      preview = preview.replace(new RegExp(placeholder, 'g'), variable.example);
    });
    return preview;
  };

  const sections = [
    { id: 'gameHistory', label: '游戏历史模板', icon: '📜' },
    { id: 'playerInfo', label: '玩家信息模板', icon: '👥' },
    { id: 'tasks', label: '任务模板', icon: '🎯' },
    { id: 'speakers', label: '发言者标识', icon: '🗣️' }
  ];

  const filteredSections = sections.filter(section => 
    section.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold">提示词编辑器</h3>
          <p className="text-gray-600 text-sm mt-1">
            自定义AI提示词模板以优化AI行为
            {hasChanges && <span className="text-orange-600 ml-2">• 有未保存的更改</span>}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={importPrompts}
            className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
          >
            导入
          </button>
          <button
            onClick={exportPrompts}
            className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
          >
            导出
          </button>
          <button
            onClick={resetToDefault}
            className="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
            disabled={!hasChanges}
          >
            重置
          </button>
          <button
            onClick={savePrompts}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            disabled={!hasChanges}
          >
            保存更改
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-3">
          <div className="mb-4">
            <input
              type="text"
              placeholder="搜索模板..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <nav className="space-y-1">
            {filteredSections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-3 py-2 rounded text-sm flex items-center space-x-2 ${
                  activeSection === section.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'hover:bg-gray-100'
                }`}
              >
                <span>{section.icon}</span>
                <span>{section.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="col-span-9">
          {activeSection === 'gameHistory' && (
            <GameHistoryEditor 
              prompts={editablePrompts} 
              updatePrompt={updatePrompt}
              getPromptPreview={getPromptPreview}
            />
          )}
          
          {activeSection === 'playerInfo' && (
            <PlayerInfoEditor 
              prompts={editablePrompts} 
              updatePrompt={updatePrompt}
              getPromptPreview={getPromptPreview}
            />
          )}
          
          {activeSection === 'tasks' && (
            <TasksEditor 
              prompts={editablePrompts} 
              updatePrompt={updatePrompt}
              getPromptPreview={getPromptPreview}
            />
          )}
          
          {activeSection === 'speakers' && (
            <SpeakersEditor 
              prompts={editablePrompts} 
              updatePrompt={updatePrompt}
              getPromptPreview={getPromptPreview}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const GameHistoryEditor = ({ prompts, updatePrompt, getPromptPreview }) => (
  <div className="space-y-6">
    <div>
      <h4 className="text-lg font-semibold mb-3">游戏历史提示词</h4>
      <p className="text-sm text-gray-600 mb-4">
        这个模板用于为AI提供游戏历史上下文信息。
      </p>
    </div>

    <div>
      <label className="block text-sm font-medium mb-2">
        主要历史模板
        <span className="text-gray-500 ml-1">(gameHistory)</span>
      </label>
      <textarea
        value={prompts.gameHistory || ''}
        onChange={(e) => updatePrompt('gameHistory', e.target.value)}
        className="w-full h-32 border rounded px-3 py-2 font-mono text-sm"
        placeholder="编辑游戏历史提示词..."
      />
      <div className="mt-2 text-xs text-gray-500">
        可用变量: 无 (这是一个静态的提示头)
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium mb-2">
        历史条目格式
        <span className="text-gray-500 ml-1">(historyEntry)</span>
      </label>
      <input
        type="text"
        value={prompts.historyEntry || ''}
        onChange={(e) => updatePrompt('historyEntry', e.target.value)}
        className="w-full border rounded px-3 py-2 font-mono text-sm"
        placeholder="{{timestamp}} [{{speaker}}] {{text}}"
      />
      <div className="mt-2 text-xs text-gray-500">
        可用变量: timestamp, speaker, text
      </div>
      <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
        <div className="font-medium mb-1">预览:</div>
        <div className="font-mono">
          {getPromptPreview(prompts.historyEntry || '', [
            { name: 'timestamp', example: '10:30:00' },
            { name: 'speaker', example: '玩家 3' },
            { name: 'text', example: '我觉得玩家5很可疑' }
          ])}
        </div>
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium mb-2">
        任务标题
        <span className="text-gray-500 ml-1">(yourTask)</span>
      </label>
      <input
        type="text"
        value={prompts.yourTask || ''}
        onChange={(e) => updatePrompt('yourTask', e.target.value)}
        className="w-full border rounded px-3 py-2 font-mono text-sm"
        placeholder="--- 你的任务 ---"
      />
    </div>
  </div>
);

const PlayerInfoEditor = ({ prompts, updatePrompt, getPromptPreview }) => (
  <div className="space-y-6">
    <div>
      <h4 className="text-lg font-semibold mb-3">玩家信息模板</h4>
      <p className="text-sm text-gray-600 mb-4">
        这些模板用于向AI描述当前的玩家状态和身份信息。
      </p>
    </div>

    {prompts.playerInfo && Object.entries(prompts.playerInfo).map(([key, value]) => (
      <div key={key}>
        <label className="block text-sm font-medium mb-2">
          {getPlayerInfoLabel(key)}
          <span className="text-gray-500 ml-1">({key})</span>
        </label>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => updatePrompt(`playerInfo.${key}`, e.target.value)}
          className="w-full border rounded px-3 py-2 font-mono text-sm"
        />
        <div className="mt-2 text-xs text-gray-500">
          {getPlayerInfoVariables(key)}
        </div>
        {key === 'playerEntry' && (
          <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
            <div className="font-medium mb-1">预览:</div>
            <div className="font-mono">
              {getPromptPreview(value || '', [
                { name: 'playerId', example: '3' },
                { name: 'playerType', example: 'AI' },
                { name: 'roleDisplay', example: '狼人' }
              ])}
            </div>
          </div>
        )}
      </div>
    ))}
  </div>
);

const TasksEditor = ({ prompts, updatePrompt, getPromptPreview }) => {
  const [selectedTask, setSelectedTask] = useState('werewolfTarget');

  const taskLabels = {
    werewolfTarget: '狼人选择目标',
    guardProtect: '守卫保护',
    seerCheck: '预言家查验',
    witchSaveChoice: '女巫救人选择',
    witchPoisonChoice: '女巫毒人选择',
    hunterShoot: '猎人开枪',
    discussionStatement: '讨论发言',
    votePlayer: '投票选择'
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-semibold mb-3">任务模板</h4>
        <p className="text-sm text-gray-600 mb-4">
          为不同的AI任务自定义提示词。每个任务都有问题和格式要求。
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-6">
        {Object.entries(taskLabels).map(([taskKey, label]) => (
          <button
            key={taskKey}
            onClick={() => setSelectedTask(taskKey)}
            className={`p-2 text-sm rounded border ${
              selectedTask === taskKey
                ? 'bg-blue-100 border-blue-300 text-blue-700'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {prompts.tasks?.[selectedTask] && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              问题模板 ({taskLabels[selectedTask]})
            </label>
            <textarea
              value={prompts.tasks[selectedTask].question || ''}
              onChange={(e) => updatePrompt(`tasks.${selectedTask}.question`, e.target.value)}
              className="w-full h-32 border rounded px-3 py-2 font-mono text-sm"
            />
            <div className="mt-2 text-xs text-gray-500">
              {getTaskVariables(selectedTask)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              格式要求
            </label>
            <input
              type="text"
              value={prompts.tasks[selectedTask].format || ''}
              onChange={(e) => updatePrompt(`tasks.${selectedTask}.format`, e.target.value)}
              className="w-full border rounded px-3 py-2 font-mono text-sm"
            />
          </div>

          {/* Special fields for specific tasks */}
          {(selectedTask === 'guardProtect') && prompts.tasks[selectedTask].noOne && (
            <div>
              <label className="block text-sm font-medium mb-2">
                "没有人"文本
              </label>
              <input
                type="text"
                value={prompts.tasks[selectedTask].noOne || ''}
                onChange={(e) => updatePrompt(`tasks.${selectedTask}.noOne`, e.target.value)}
                className="w-full border rounded px-3 py-2 font-mono text-sm"
              />
            </div>
          )}

          {(selectedTask.includes('witch')) && (
            <div className="grid grid-cols-2 gap-4">
              {prompts.tasks[selectedTask].antidoteNotUsed && (
                <div>
                  <label className="block text-sm font-medium mb-2">解药未使用</label>
                  <input
                    type="text"
                    value={prompts.tasks[selectedTask].antidoteNotUsed || ''}
                    onChange={(e) => updatePrompt(`tasks.${selectedTask}.antidoteNotUsed`, e.target.value)}
                    className="w-full border rounded px-3 py-2 font-mono text-sm"
                  />
                </div>
              )}
              {prompts.tasks[selectedTask].antidoteUsed && (
                <div>
                  <label className="block text-sm font-medium mb-2">解药已使用</label>
                  <input
                    type="text"
                    value={prompts.tasks[selectedTask].antidoteUsed || ''}
                    onChange={(e) => updatePrompt(`tasks.${selectedTask}.antidoteUsed`, e.target.value)}
                    className="w-full border rounded px-3 py-2 font-mono text-sm"
                  />
                </div>
              )}
              {prompts.tasks[selectedTask].poisonNotUsed && (
                <div>
                  <label className="block text-sm font-medium mb-2">毒药未使用</label>
                  <input
                    type="text"
                    value={prompts.tasks[selectedTask].poisonNotUsed || ''}
                    onChange={(e) => updatePrompt(`tasks.${selectedTask}.poisonNotUsed`, e.target.value)}
                    className="w-full border rounded px-3 py-2 font-mono text-sm"
                  />
                </div>
              )}
              {prompts.tasks[selectedTask].poisonUsed && (
                <div>
                  <label className="block text-sm font-medium mb-2">毒药已使用</label>
                  <input
                    type="text"
                    value={prompts.tasks[selectedTask].poisonUsed || ''}
                    onChange={(e) => updatePrompt(`tasks.${selectedTask}.poisonUsed`, e.target.value)}
                    className="w-full border rounded px-3 py-2 font-mono text-sm"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SpeakersEditor = ({ prompts, updatePrompt }) => (
  <div className="space-y-6">
    <div>
      <h4 className="text-lg font-semibold mb-3">发言者标识</h4>
      <p className="text-sm text-gray-600 mb-4">
        自定义游戏记录中不同发言者的显示标识。
      </p>
    </div>

    {prompts.speakers && Object.entries(prompts.speakers).map(([key, value]) => (
      <div key={key}>
        <label className="block text-sm font-medium mb-2">
          {getSpeakerLabel(key)}
          <span className="text-gray-500 ml-1">({key})</span>
        </label>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => updatePrompt(`speakers.${key}`, e.target.value)}
          className="w-full border rounded px-3 py-2 font-mono text-sm"
        />
        {key === 'player' && (
          <div className="mt-2 text-xs text-gray-500">
            可用变量: playerId
          </div>
        )}
      </div>
    ))}
  </div>
);

// Helper functions
const getPlayerInfoLabel = (key) => {
  const labels = {
    currentAlivePlayers: '存活玩家标题',
    playerEntry: '玩家条目格式',
    human: '人类标识',
    ai: 'AI标识',
    unknownRole: '未知身份标识',
    yourTeammateWerewolf: '狼人队友标识',
    werewolfTeammates: '狼人队友列表',
    onlyWerewolfLeft: '最后狼人提示',
    yourInfo: '你的信息格式'
  };
  return labels[key] || key;
};

const getPlayerInfoVariables = (key) => {
  const variables = {
    playerEntry: '可用变量: playerId, playerType, roleDisplay',
    yourTeammateWerewolf: '可用变量: role',
    werewolfTeammates: '可用变量: teammates',
    yourInfo: '可用变量: playerId, role'
  };
  return variables[key] || '无变量';
};

const getTaskVariables = (taskKey) => {
  const variables = {
    werewolfTarget: '无特殊变量',
    guardProtect: '可用变量: lastProtected',
    seerCheck: '无特殊变量',
    witchSaveChoice: '可用变量: targetId, targetRole, antidoteStatus',
    witchPoisonChoice: '可用变量: poisonStatus',
    hunterShoot: '可用变量: playerId',
    discussionStatement: '可用变量: playerId, role',
    votePlayer: '可用变量: playerId, role'
  };
  return variables[taskKey] || '无变量信息';
};

const getSpeakerLabel = (key) => {
  const labels = {
    system: '系统消息',
    player: '玩家发言'
  };
  return labels[key] || key;
};

export default PromptEditor; 