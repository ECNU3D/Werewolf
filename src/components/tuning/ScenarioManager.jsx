import React, { useState } from 'react';
import { translations } from '../../constants/languages';

const ScenarioManager = ({ 
  scenarios, 
  setScenarios,
  currentScenario,
  setCurrentScenario,
  setEditingScenario,
  currentLanguage 
}) => {
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const importScenarios = () => {
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
            
            // Validate imported data
            if (Array.isArray(imported)) {
              // Import multiple scenarios
              const validScenarios = imported.filter(validateScenario);
              setScenarios(prev => [...prev, ...validScenarios]);
              alert(`成功导入 ${validScenarios.length} 个场景！`);
            } else if (validateScenario(imported)) {
              // Import single scenario
              setScenarios(prev => [...prev, imported]);
              alert('场景导入成功！');
            } else {
              alert('导入的文件格式不正确！');
            }
          } catch (error) {
            alert('导入失败: ' + error.message);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const exportScenarios = (selectedScenarios = null) => {
    const dataToExport = selectedScenarios || scenarios;
    if (dataToExport.length === 0) {
      alert('没有可导出的场景！');
      return;
    }

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `werewolf_scenarios_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportSingleScenario = (scenario) => {
    exportScenarios([scenario]);
  };

  const duplicateScenario = (scenario) => {
    const duplicate = {
      ...scenario,
      id: Date.now(),
      name: `${scenario.name} (副本)`,
      description: `${scenario.description} - 从原场景复制`
    };
    setScenarios(prev => [...prev, duplicate]);
  };

  const deleteScenario = (scenarioId) => {
    setScenarios(prev => prev.filter(s => s.id !== scenarioId));
    if (currentScenario?.id === scenarioId) {
      setCurrentScenario(null);
      setEditingScenario(null);
    }
    setShowDeleteConfirm(null);
  };

  const validateScenario = (scenario) => {
    return scenario && 
           scenario.name && 
           scenario.gameState && 
           scenario.gameState.players && 
           Array.isArray(scenario.gameState.players) &&
           scenario.gameState.gameHistory &&
           Array.isArray(scenario.gameState.gameHistory);
  };

  const filteredScenarios = scenarios
    .filter(scenario => 
      scenario.name.toLowerCase().includes(filter.toLowerCase()) ||
      scenario.description.toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return b.id - a.id; // Newer first
        case 'phase':
          return a.gameState.phase.localeCompare(b.gameState.phase);
        default:
          return 0;
      }
    });

  const getScenarioStats = (scenario) => {
    const alivePlayers = scenario.gameState.players.filter(p => p.isAlive).length;
    const totalPlayers = scenario.gameState.players.length;
    const historyCount = scenario.gameState.gameHistory.length;
    const testTargets = scenario.testTargets.length;
    
    return { alivePlayers, totalPlayers, historyCount, testTargets };
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold">场景管理器</h3>
          <p className="text-gray-600 text-sm mt-1">
            管理测试场景：保存、加载、导入和导出
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={importScenarios}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            导入场景
          </button>
          <button
            onClick={() => exportScenarios()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={scenarios.length === 0}
          >
            导出全部
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-4">
          <div>
            <input
              type="text"
              placeholder="搜索场景..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="date">按日期排序</option>
              <option value="name">按名称排序</option>
              <option value="phase">按游戏阶段排序</option>
            </select>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          共 {filteredScenarios.length} 个场景
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredScenarios.map(scenario => {
          const stats = getScenarioStats(scenario);
          return (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              stats={stats}
              isSelected={currentScenario?.id === scenario.id}
              onSelect={() => {
                setCurrentScenario(scenario);
                setEditingScenario(scenario);
              }}
              onDuplicate={() => duplicateScenario(scenario)}
              onExport={() => exportSingleScenario(scenario)}
              onDelete={() => setShowDeleteConfirm(scenario.id)}
              currentLanguage={currentLanguage}
            />
          );
        })}
        
        {filteredScenarios.length === 0 && (
          <div className="col-span-full text-center text-gray-500 py-12">
            {scenarios.length === 0 ? (
              <div>
                <div className="text-lg mb-2">暂无保存的场景</div>
                <div className="text-sm">在场景编辑器中创建你的第一个测试场景</div>
              </div>
            ) : (
              <div>
                <div className="text-lg mb-2">未找到匹配的场景</div>
                <div className="text-sm">尝试调整搜索条件</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bulk Operations */}
      {scenarios.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              批量操作
            </div>
            <div className="space-x-2">
              <button
                onClick={() => {
                  if (window.confirm('确定要清空所有场景吗？此操作不可撤销！')) {
                    setScenarios([]);
                    setCurrentScenario(null);
                    setEditingScenario(null);
                  }
                }}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              >
                清空全部
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          scenario={scenarios.find(s => s.id === showDeleteConfirm)}
          onConfirm={() => deleteScenario(showDeleteConfirm)}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}
    </div>
  );
};

const ScenarioCard = ({ 
  scenario, 
  stats, 
  isSelected, 
  onSelect, 
  onDuplicate, 
  onExport, 
  onDelete,
  currentLanguage 
}) => (
  <div
    className={`border rounded-lg p-4 cursor-pointer transition-all ${
      isSelected 
        ? 'border-blue-500 bg-blue-50 shadow-md' 
        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
    }`}
    onClick={onSelect}
  >
    {/* Header */}
    <div className="flex justify-between items-start mb-3">
      <div className="flex-1">
        <h4 className="font-semibold text-lg leading-tight">{scenario.name}</h4>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{scenario.description}</p>
      </div>
      {isSelected && (
        <div className="ml-2">
          <span className="inline-block w-3 h-3 bg-blue-500 rounded-full"></span>
        </div>
      )}
    </div>

    {/* Stats */}
    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
      <div>
        <span className="font-medium">游戏阶段:</span>
        <div className="text-gray-800">
          {translations[currentLanguage].phases[scenario.gameState.phase]}
        </div>
      </div>
      <div>
        <span className="font-medium">存活玩家:</span>
        <div className="text-gray-800">{stats.alivePlayers}/{stats.totalPlayers}</div>
      </div>
      <div>
        <span className="font-medium">历史记录:</span>
        <div className="text-gray-800">{stats.historyCount} 条</div>
      </div>
      <div>
        <span className="font-medium">测试目标:</span>
        <div className="text-gray-800">{stats.testTargets} 个</div>
      </div>
    </div>

    {/* Test targets preview */}
    {scenario.testTargets.length > 0 && (
      <div className="mb-3">
        <div className="text-xs font-medium text-gray-600 mb-1">测试目标:</div>
        <div className="flex flex-wrap gap-1">
          {scenario.testTargets.slice(0, 3).map((target, index) => (
            <span
              key={index}
              className="inline-block px-2 py-1 text-xs bg-gray-100 rounded"
            >
              P{target.playerId}
            </span>
          ))}
          {scenario.testTargets.length > 3 && (
            <span className="inline-block px-2 py-1 text-xs text-gray-500">
              +{scenario.testTargets.length - 3}
            </span>
          )}
        </div>
      </div>
    )}

    {/* Footer */}
    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
      <div className="text-xs text-gray-500">
        {new Date(scenario.id).toLocaleString()}
      </div>
      <div className="flex space-x-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="p-1 text-gray-500 hover:text-blue-600 text-xs"
          title="复制场景"
        >
          📋
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExport();
          }}
          className="p-1 text-gray-500 hover:text-green-600 text-xs"
          title="导出场景"
        >
          📤
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 text-gray-500 hover:text-red-600 text-xs"
          title="删除场景"
        >
          🗑️
        </button>
      </div>
    </div>
  </div>
);

const DeleteConfirmModal = ({ scenario, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md mx-4">
      <h3 className="text-lg font-semibold mb-3">确认删除</h3>
      <p className="text-gray-600 mb-4">
        确定要删除场景 "<strong>{scenario?.name}</strong>" 吗？
      </p>
      <p className="text-sm text-gray-500 mb-6">
        此操作不可撤销。
      </p>
      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
        >
          取消
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          删除
        </button>
      </div>
    </div>
  </div>
);

export default ScenarioManager; 