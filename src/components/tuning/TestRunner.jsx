import React from 'react';
import { getAIDecision } from '../../utils/aiUtils';
import { translations } from '../../constants/languages';

const TestRunner = ({ 
  currentScenario, 
  testResults, 
  setTestResults, 
  isRunningTest, 
  setIsRunningTest,
  currentLanguage 
}) => {

  const runSingleTest = async (target) => {
    if (!currentScenario) return;

    setIsRunningTest(true);
    
    const player = currentScenario.gameState.players.find(p => p.id === target.playerId);
    if (!player) return;

    // Create a mock game state for AI testing
    const mockGameState = {
      players: currentScenario.gameState.players,
      seerLastCheck: currentScenario.gameState.specialStates.seerLastCheck,
      guardLastProtectedId: currentScenario.gameState.specialStates.guardLastProtectedId,
      werewolfTargetId: currentScenario.gameState.specialStates.werewolfTargetId,
      witchPotions: currentScenario.gameState.specialStates.witchPotions,
      humanPlayerId: currentScenario.gameState.players.find(p => p.isHuman)?.id || 1,
      addLog: (message) => console.log('Mock log:', message)
    };

    try {
      const startTime = Date.now();
      const response = await getAIDecision(
        { ...player, aiSystemPrompt: "你是一个狼人杀游戏的AI玩家。" },
        target.action,
        currentScenario.gameState.gameHistory,
        mockGameState,
        currentLanguage
      );
      const endTime = Date.now();

      const result = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toLocaleTimeString(),
        scenarioName: currentScenario.name,
        target: target,
        response: response,
        responseTime: endTime - startTime,
        success: response !== null
      };

      setTestResults(prev => [result, ...prev]);
    } catch (error) {
      console.error('Test failed:', error);
      const result = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toLocaleTimeString(),
        scenarioName: currentScenario.name,
        target: target,
        response: null,
        error: error.message,
        success: false
      };
      setTestResults(prev => [result, ...prev]);
    } finally {
      setIsRunningTest(false);
    }
  };

  const runAllTests = async () => {
    if (!currentScenario) return;
    
    setIsRunningTest(true);
    for (const target of currentScenario.testTargets) {
      await runSingleTest(target);
      // Add small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setIsRunningTest(false);
  };

  const analyzeResults = () => {
    if (testResults.length === 0) return null;

    const successRate = (testResults.filter(r => r.success).length / testResults.length * 100).toFixed(1);
    const avgResponseTime = testResults
      .filter(r => r.responseTime)
      .reduce((acc, r) => acc + r.responseTime, 0) / testResults.filter(r => r.responseTime).length;

    return {
      successRate,
      avgResponseTime: avgResponseTime?.toFixed(0) || 0,
      totalTests: testResults.length
    };
  };

  const stats = analyzeResults();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold">测试运行器</h3>
          {stats && (
            <div className="text-sm text-gray-600 mt-1">
              成功率: {stats.successRate}% | 平均响应时间: {stats.avgResponseTime}ms | 总测试: {stats.totalTests}
            </div>
          )}
        </div>
        <div className="space-x-2">
          <button
            onClick={runAllTests}
            disabled={!currentScenario || isRunningTest || !currentScenario.testTargets?.length}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isRunningTest ? '测试中...' : '运行所有测试'}
          </button>
          <button
            onClick={() => setTestResults([])}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            清空结果
          </button>
        </div>
      </div>

      {/* Current Scenario Info */}
      {currentScenario ? (
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-3">当前场景: {currentScenario.name}</h4>
          <div className="bg-gray-50 rounded p-4 mb-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">游戏阶段:</span>
                <div>{translations[currentLanguage].phases[currentScenario.gameState.phase]}</div>
              </div>
              <div>
                <span className="font-medium">存活玩家:</span>
                <div>{currentScenario.gameState.players.filter(p => p.isAlive).length}/8</div>
              </div>
              <div>
                <span className="font-medium">测试目标:</span>
                <div>{currentScenario.testTargets.length} 个</div>
              </div>
              <div>
                <span className="font-medium">历史记录:</span>
                <div>{currentScenario.gameState.gameHistory.length} 条</div>
              </div>
            </div>
          </div>

          {/* Test Targets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {currentScenario.testTargets.map((target, index) => (
              <div key={index} className="border rounded p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">
                      玩家 {target.playerId} ({translations[currentLanguage].roles[target.role]})
                    </div>
                    <div className="text-sm text-gray-600">
                      {getActionLabel(target.action)}
                    </div>
                  </div>
                  <button
                    onClick={() => runSingleTest(target)}
                    disabled={isRunningTest}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-sm"
                  >
                    单独测试
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-6 text-center text-gray-500 py-8">
          请先在场景编辑器中创建或选择一个测试场景
        </div>
      )}

      {/* Test Results */}
      <div>
        <h4 className="text-lg font-semibold mb-3">测试结果 ({testResults.length})</h4>
        <div className="max-h-96 overflow-y-auto space-y-3">
          {testResults.map(result => (
            <TestResultCard key={result.id} result={result} currentLanguage={currentLanguage} />
          ))}
          {testResults.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              暂无测试结果
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TestResultCard = ({ result, currentLanguage }) => (
  <div
    className={`border rounded p-4 ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
  >
    <div className="flex justify-between items-start mb-2">
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <span className="font-semibold">{result.timestamp}</span>
          <span className="text-xs text-gray-500">#{result.id.toString().slice(-6)}</span>
        </div>
        <div className="text-sm text-gray-600">
          {result.scenarioName} • 玩家 {result.target.playerId} • {getActionLabel(result.target.action)}
        </div>
        {result.responseTime && (
          <div className="text-xs text-gray-500">
            响应时间: {result.responseTime}ms
          </div>
        )}
      </div>
      <span className={`text-sm font-medium px-2 py-1 rounded ${
        result.success ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
      }`}>
        {result.success ? '成功' : '失败'}
      </span>
    </div>
    
    <div className="text-sm">
      {result.success ? (
        <div>
          <div className="font-medium text-gray-700 mb-1">AI 响应:</div>
          <div className="font-mono bg-white px-3 py-2 rounded border text-gray-800">
            "{result.response}"
          </div>
        </div>
      ) : (
        <div>
          <div className="font-medium text-red-700 mb-1">错误信息:</div>
          <div className="text-red-600 bg-red-50 px-3 py-2 rounded border border-red-200">
            {result.error || '未知错误 - AI 返回了空响应'}
          </div>
        </div>
      )}
    </div>

    {/* Response Analysis */}
    {result.success && (
      <div className="mt-3 text-xs text-gray-600">
        <ResponseAnalysis response={result.response} action={result.target.action} />
      </div>
    )}
  </div>
);

const ResponseAnalysis = ({ response, action }) => {
  const analyzeResponse = () => {
    if (!response) return null;

    // Basic format validation
    const isNumeric = /^\d+$/.test(response);
    const isYesNo = /^(yes|no|是|否)$/i.test(response);
    
    let analysis = [];

    if (action.endsWith('_TARGET') || action === 'SEER_CHECK' || action === 'GUARD_PROTECT' || action === 'VOTE_PLAYER') {
      if (isNumeric) {
        const playerId = parseInt(response);
        if (playerId >= 1 && playerId <= 8) {
          analysis.push(`✅ 格式正确: 玩家ID ${playerId}`);
        } else {
          analysis.push(`⚠️ 玩家ID超出范围: ${playerId}`);
        }
      } else {
        analysis.push(`❌ 格式错误: 应该是数字ID，得到 "${response}"`);
      }
    } else if (action.includes('CHOICE') || action === 'HUNTER_SHOOT') {
      if (isYesNo) {
        analysis.push(`✅ 格式正确: ${response}`);
      } else if (isNumeric) {
        analysis.push(`✅ 格式正确: 选择玩家 ${response}`);
      } else {
        analysis.push(`❌ 格式错误: 应该是是/否或玩家ID，得到 "${response}"`);
      }
    } else if (action === 'DISCUSSION_STATEMENT') {
      if (response.length > 10) {
        analysis.push(`✅ 发言内容充足: ${response.length} 字符`);
      } else {
        analysis.push(`⚠️ 发言较短: ${response.length} 字符`);
      }
    }

    return analysis;
  };

  const analysis = analyzeResponse();
  
  return (
    <div>
      <div className="font-medium mb-1">响应分析:</div>
      {analysis && analysis.length > 0 ? (
        <ul className="space-y-1">
          {analysis.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      ) : (
        <div>无可用分析</div>
      )}
    </div>
  );
};

const getActionLabel = (action) => {
  const actionMap = {
    'WEREWOLF_TARGET': '狼人选择目标',
    'GUARD_PROTECT': '守卫保护',
    'SEER_CHECK': '预言家查验',
    'WITCH_SAVE_CHOICE': '女巫救人选择',
    'WITCH_POISON_CHOICE': '女巫毒人选择',
    'HUNTER_SHOOT': '猎人开枪',
    'DISCUSSION_STATEMENT': '讨论发言',
    'VOTE_PLAYER': '投票选择'
  };
  return actionMap[action] || action;
};

export default TestRunner; 