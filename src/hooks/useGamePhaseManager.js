import { useEffect } from 'react';
import { ROLES, GAME_PHASES } from '../constants/gameConstants';
import { useLanguage } from '../contexts/LanguageContext';
import { LOG_CATEGORIES } from '../utils/logManager';

export const useGamePhaseManager = (gameLogic, tts) => {
  const { t, tr } = useLanguage();
  
  const {
    gamePhase,
    winner,
    players,
    gameLog,
    showRoleModalState,
    werewolfTargetId,
    guardLastProtectedId,
    seerLastCheck,
    witchPotions,
    pendingDeathPlayerIds,
    hunterTargetId,
    currentPlayerSpeakingId,
    currentVotes,
    humanPlayerId,
    playerToPoisonId,
    isProcessingStepRef,
    initializeGame,
    resolveNightActions,
    resolveVoting,
    handleNextSpeaker,
    handleAIVoting,
    addLog,
    addPublicLog,
    addPrivateLog,
    addNightActionLog,
    getAIDecisionWrapper,
    checkWinConditionWrapper,
    setGamePhase,
    setWerewolfTargetId,
    setPlayerToPoisonId,
    setPlayers,
    setGuardLastProtectedId,
    setSeerLastCheck,
    setWitchPotions,
    setCurrentPlayerSpeakingId,
    setHunterTargetId
  } = gameLogic;

  // Main Game Logic Controller
  useEffect(() => {
    const executeCurrentStep = async () => {
        if (winner) return;
        if (isProcessingStepRef.current && gamePhase !== GAME_PHASES.SETUP && gamePhase !== GAME_PHASES.SHOW_ROLE_MODAL) { 
            return;
        }
        
        isProcessingStepRef.current = true;
                const currentPlayers_local = players;
        const currentHumanPlayer_local = currentPlayers_local.find(p => p.isHuman);

        try {
            switch (gamePhase) { 
                case GAME_PHASES.SETUP:
                    // Don't auto-initialize - let the SetupScreen handle it
                    break;
                case GAME_PHASES.SHOW_ROLE_MODAL:
                    break;
                case GAME_PHASES.NIGHT_START:
                    if (!showRoleModalState) { 
                        const nightMessage = t('gamePhases.nightStart');
                        addPublicLog(nightMessage, 'system', LOG_CATEGORIES.GAME_FLOW);
                        
                        // Auto-announce night start
                        if (tts && tts.isEnabled && tts.speakSystemMessage) {
                            setTimeout(async () => {
                                try {
                                    await tts.speakSystemMessage(nightMessage);
                                } catch (error) {
                                    console.error('Error auto-announcing night start:', error);
                                }
                            }, 500);
                        }
                        
                        setWerewolfTargetId(null); 
                        setPlayerToPoisonId(null); 
                        setPlayers(prev => prev.map(p => ({ ...p, isProtected: false, isTargetedByWolf: false, isHealedByWitch: false })));
                        setGamePhase(GAME_PHASES.WEREWOLVES_ACT);
                    }
                    break;
                
                case GAME_PHASES.WEREWOLVES_ACT:
                    if (currentHumanPlayer_local?.role === ROLES.WEREWOLF && currentHumanPlayer_local.isAlive && werewolfTargetId === null) {
                        addPrivateLog(t('gamePhases.waitingWerewolf'), [ROLES.WEREWOLF], [currentHumanPlayer_local.id], 'system', LOG_CATEGORIES.GAME_FLOW);
                    } else {
                        const aiWolves = currentPlayers_local.filter(p => p.role === ROLES.WEREWOLF && p.isAlive && !p.isHuman);
                        if (aiWolves.length > 0 && werewolfTargetId === null) {
                            const actingWolf = aiWolves[0];
                            const targetStr = await getAIDecisionWrapper(actingWolf, 'WEREWOLF_TARGET');
                            const target = parseInt(targetStr, 10);
                            if (!isNaN(target) && currentPlayers_local.find(p => p.id === target)?.isAlive) {
                                setWerewolfTargetId(target);
                                // Log AI werewolf action for werewolves only
                                addNightActionLog('werewolf_kill', {
                                    playerId: actingWolf.id,
                                    targetId: target,
                                    wasSuccessful: true
                                }, actingWolf.role);
                            }
                        }
                        if (werewolfTargetId !== null || (aiWolves.length === 0 && !(currentHumanPlayer_local?.role === ROLES.WEREWOLF && currentHumanPlayer_local?.isAlive))) {
                            // Don't log phase transitions that reveal sensitive information
                            setGamePhase(GAME_PHASES.GUARD_ACTS);
                        }
                    }
                    break;
                case GAME_PHASES.GUARD_ACTS:
                    if (currentHumanPlayer_local?.role === ROLES.GUARD && currentHumanPlayer_local.isAlive) {
                        // Waiting for human guard action
                    } else {
                        const guard = currentPlayers_local.find(p => p.role === ROLES.GUARD && p.isAlive && !p.isHuman);
                        if (guard) {
                            const targetStr = await getAIDecisionWrapper(guard, 'GUARD_PROTECT');
                            const target = parseInt(targetStr, 10);
                            if (!isNaN(target) && target !== guardLastProtectedId && currentPlayers_local.find(p => p.id === target)?.isAlive) {
                                setPlayers(prev => prev.map(p => p.id === target ? { ...p, isProtected: true } : p));
                                setGuardLastProtectedId(target);
                                
                                // Log AI guard action - only visible to guard
                                addNightActionLog('guard_protect', {
                                    playerId: guard.id,
                                    targetId: target
                                }, guard.role);
                            }
                        }
                        addLog(t('gamePhases.guardDone'), 'system', true);
                        setGamePhase(GAME_PHASES.SEER_ACTS);
                    }
                    break;
                case GAME_PHASES.SEER_ACTS:
                    if (currentHumanPlayer_local?.role === ROLES.SEER && currentHumanPlayer_local.isAlive) {
                        // Waiting for human seer action
                    } else {
                        const seerAI = currentPlayers_local.find(p => p.role === ROLES.SEER && p.isAlive && !p.isHuman);
                        if (seerAI) {
                            const targetStr = await getAIDecisionWrapper(seerAI, 'SEER_CHECK');
                            const target = parseInt(targetStr, 10);
                            const targetPlayer = currentPlayers_local.find(p => p.id === target);
                            if (targetPlayer?.isAlive) {
                                setSeerLastCheck({ targetId: target, targetRole: targetPlayer.role });
                                
                                // Log AI seer action - only visible to seer, including the result
                                addNightActionLog('seer_check', {
                                    playerId: seerAI.id,
                                    targetId: target,
                                    reason: tr(targetPlayer.role)
                                }, seerAI.role);
                            }
                        }
                        addLog(t('gamePhases.seerDone'), 'system', true);
                        setGamePhase(GAME_PHASES.WITCH_ACTS_SAVE);
                    }
                    break;
                case GAME_PHASES.WITCH_ACTS_SAVE:
                    if (currentHumanPlayer_local?.role === ROLES.WITCH && currentHumanPlayer_local.isAlive) {
                        const wolfVictimPlayer = currentPlayers_local.find(p => p.id === werewolfTargetId);
                        if (witchPotions.antidote && wolfVictimPlayer && wolfVictimPlayer.isAlive) {
                             // UI action will handle this
                        } else { 
                            addLog(t('gamePhases.witchPoisonDecision'), 'system', true);
                            setGamePhase(GAME_PHASES.WITCH_ACTS_POISON);
                        }
                    } else { 
                        const witchAI = currentPlayers_local.find(p => p.role === ROLES.WITCH && p.isAlive && !p.isHuman);
                        if (witchAI) {
                            const wolfVictimPlayer = currentPlayers_local.find(p => p.id === werewolfTargetId);
                            if (witchPotions.antidote && wolfVictimPlayer && wolfVictimPlayer.isAlive) {
                                const choice = await getAIDecisionWrapper(witchAI, 'WITCH_SAVE_CHOICE');
                                if (choice === 'yes') {
                                    setPlayers(prev => prev.map(p => p.id === werewolfTargetId ? { ...p, isHealedByWitch: true } : p));
                                    setWitchPotions(prev => ({ ...prev, antidote: false }));
                                    
                                    // Log AI witch save action - only visible to witch
                                    addNightActionLog('witch_save', {
                                        playerId: witchAI.id,
                                        targetId: werewolfTargetId
                                    }, witchAI.role);
                                }
                            }
                        }
                        addLog(t('gamePhases.witchPoisonDecision'), 'system', true);
                        setGamePhase(GAME_PHASES.WITCH_ACTS_POISON);
                    }
                    break;
                case GAME_PHASES.WITCH_ACTS_POISON:
                    if (currentHumanPlayer_local?.role === ROLES.WITCH && currentHumanPlayer_local.isAlive) {
                        // Waiting for human action
                    } else { 
                        const witchAI = currentPlayers_local.find(p => p.role === ROLES.WITCH && p.isAlive && !p.isHuman);
                        if (witchAI) {
                            if (witchPotions.poison) {
                                const choiceStr = await getAIDecisionWrapper(witchAI, 'WITCH_POISON_CHOICE');
                                if (choiceStr !== 'no' && choiceStr !== null && !isNaN(parseInt(choiceStr))) {
                                    const targetToPoison = parseInt(choiceStr, 10);
                                    if (players.find(p => p.id === targetToPoison)?.isAlive && targetToPoison !== witchAI.id) {
                                        setPlayerToPoisonId(targetToPoison);
                                        setWitchPotions(prev => ({ ...prev, poison: false }));
                                        
                                        // Log AI witch poison action - only visible to witch
                                        addNightActionLog('witch_poison', {
                                            playerId: witchAI.id,
                                            targetId: targetToPoison
                                        }, witchAI.role);
                                    }
                                }
                            }
                        }
                        addLog(t('gamePhases.witchDone'), 'system', true);
                        setGamePhase(GAME_PHASES.NIGHT_RESOLUTION);
                    }
                    break;
                case GAME_PHASES.NIGHT_RESOLUTION:
                    resolveNightActions(); 
                    break;
                case GAME_PHASES.DAY_START:
                    let dayStartMessage = t('gamePhases.dayStart');
                    if (pendingDeathPlayerIds.length > 0) {
                        pendingDeathPlayerIds.forEach(deadId => {
                            const deadPlayer = currentPlayers_local.find(p => p.id === deadId);
                            if (deadPlayer) dayStartMessage += ` ${t('gamePhases.playerDied', { playerId: deadId, role: tr(deadPlayer.role) })}`;
                        });
                    }
                    const hunterDied = currentPlayers_local.find(p => pendingDeathPlayerIds.includes(p.id) && !p.isAlive && p.role === ROLES.HUNTER);
                    if (hunterDied) {
                        dayStartMessage += ` ${t('gamePhases.hunterDied', { playerId: hunterDied.id })}`;
                        setHunterTargetId(null);
                        addLog(dayStartMessage, 'system', true);
                        
                        // Auto-announce day start with deaths
                        if (tts && tts.isEnabled && tts.speakSystemMessage) {
                            setTimeout(async () => {
                                try {
                                    await tts.speakSystemMessage(dayStartMessage);
                                } catch (error) {
                                    console.error('Error auto-announcing day start with deaths:', error);
                                }
                            }, 500);
                        }
                        
                        setGamePhase(GAME_PHASES.HUNTER_MAY_ACT);
                    } else {
                        const firstAlive = currentPlayers_local.find(p => p.isAlive);
                        setCurrentPlayerSpeakingId(firstAlive ? firstAlive.id : 0);
                        dayStartMessage += ` ${t('gamePhases.discussionStart')}`;
                        if (firstAlive) dayStartMessage += ` ${t('gamePhases.firstSpeaker', { playerId: firstAlive.id })}`;
                        addLog(dayStartMessage, 'system', true);
                        
                        // Auto-announce day start with discussion
                        if (tts && tts.isEnabled && tts.speakSystemMessage) {
                            setTimeout(async () => {
                                try {
                                    await tts.speakSystemMessage(dayStartMessage);
                                } catch (error) {
                                    console.error('Error auto-announcing day start with discussion:', error);
                                }
                            }, 500);
                        }
                        
                        setGamePhase(GAME_PHASES.DISCUSSION);
                    }
                    break;
                case GAME_PHASES.HUNTER_MAY_ACT:
                    const humanHunterIsDead = currentHumanPlayer_local?.role === ROLES.HUNTER && !currentHumanPlayer_local.isAlive && (pendingDeathPlayerIds.includes(currentHumanPlayer_local.id) || hunterTargetId === currentHumanPlayer_local.id);
                    if (humanHunterIsDead) {
                        addLog(t('gamePhases.waitingHunter'), 'system', true);
                    } else { 
                        const deadAIHunter = currentPlayers_local.find(p => !p.isHuman && p.role === ROLES.HUNTER && !p.isAlive && (pendingDeathPlayerIds.includes(p.id) || hunterTargetId === p.id));
                        if (deadAIHunter) {
                            const targetStr = await getAIDecisionWrapper(deadAIHunter, 'HUNTER_SHOOT');
                            const target = parseInt(targetStr, 10);
                            const targetPlayer = currentPlayers_local.find(p => p.id === target);
                            if (targetStr !== 'no' && !isNaN(target) && targetPlayer?.isAlive && targetPlayer.id !== deadAIHunter.id) {
                                let updatedHunterKillPlayers = currentPlayers_local.map(p => p.id === target ? { ...p, isAlive: false, revealedRole: p.role } : p);
                                setPlayers(updatedHunterKillPlayers); 
                                setHunterTargetId(target);
                                if (!checkWinConditionWrapper(updatedHunterKillPlayers)) { isProcessingStepRef.current = false; return; }
                            }
                        }
                        addLog(t('gamePhases.hunterDone'), 'system', true);
                        const firstAliveDisc = currentPlayers_local.find(p => p.isAlive);
                        setCurrentPlayerSpeakingId(firstAliveDisc ? firstAliveDisc.id : 0);
                        setGamePhase(GAME_PHASES.DISCUSSION);
                    }
                    break;
                case GAME_PHASES.DISCUSSION:
                    const speaker = currentPlayers_local.find(p => p.id === currentPlayerSpeakingId);
                    if (speaker && speaker.isAlive) {
                        if (speaker.isHuman) {
                            // Logged by handleNextSpeaker or initial phase set
                        } else { 
                            console.debug(`[EXECUTE_CURRENT_STEP] AI Player ${speaker.id} turn to speak in DISCUSSION.`);
                            const statement = await getAIDecisionWrapper(speaker, 'DISCUSSION_STATEMENT');
                            if (gamePhase === GAME_PHASES.DISCUSSION && currentPlayerSpeakingId === speaker.id && !winner) { 
                                // Record the AI's speech in discussion category for complete history
                                addPublicLog(t('gamePhases.playerSpeaks', { playerId: speaker.id, statement: statement || t('gamePhases.skipSpeech') }), 'ai', LOG_CATEGORIES.DISCUSSION);
                                
                                // Speak the AI's statement using text-to-speech and wait for completion
                                if (tts && statement && tts.isEnabled) {
                                    try {
                                        await tts.speakAIStatement(speaker.id, statement, speaker.role);
                                    } catch (error) {
                                        console.debug('TTS error handled:', error);
                                        // Continue game flow even if TTS fails
                                    }
                                }
                                
                                handleNextSpeaker(); 
                            } else {
                                 console.warn(`[AI_DISCUSSION_STALE_IN_EXECUTE] AI Player ID: ${speaker.id}. Phase/speaker changed.`);
                            }
                        }
                    } else if (currentPlayers_local.filter(p => p.isAlive).length > 0) { 
                        console.warn(`[EXECUTE_CURRENT_STEP] DISCUSSION: Current speaker ${currentPlayerSpeakingId} is invalid or dead. Moving to next.`);
                        handleNextSpeaker();
                    } else if (!winner) { 
                        console.debug("[EXECUTE_CURRENT_STEP] DISCUSSION: No one left to speak, moving to VOTING.");
                        addLog(t('gamePhases.discussionDone'), 'system', true);
                        setGamePhase(GAME_PHASES.VOTING);
                    }
                    break;
                case GAME_PHASES.VOTING:
                    const humanCanVote = currentHumanPlayer_local?.isAlive && !currentVotes[currentHumanPlayer_local.id];
                    const all_alive_voting = currentPlayers_local.filter(p => p.isAlive);
                    const all_voted_voting = all_alive_voting.every(p => currentVotes.hasOwnProperty(p.id));

                    if (humanCanVote) {
                        addLog(t('gamePhases.waitingVote'), "system", true);
                    } else if (!all_voted_voting) {
                        console.debug("[EXECUTE_CURRENT_STEP] VOTING: Human voted or not applicable, but not all votes in. Triggering AI voting.");
                        await handleAIVoting(); // Make sure this is awaited
                    } else if (all_voted_voting && gamePhase === GAME_PHASES.VOTING) { 
                        console.debug("[EXECUTE_CURRENT_STEP] VOTING: All votes are in. Setting phase to VOTE_RESULTS.");
                        addLog(t('gamePhases.votingDone'), 'system', true);
                        setGamePhase(GAME_PHASES.VOTE_RESULTS);
                    }
                    break;
                case GAME_PHASES.VOTE_RESULTS:
                    resolveVoting();
                    break;
                case GAME_PHASES.GAME_OVER:
                    console.debug("[EXECUTE_CURRENT_STEP] In GAME_OVER phase.");
                    break;
                default:
                    console.error(`[EXECUTE_CURRENT_STEP] Unknown game phase: ${gamePhase}`);
            }
        } catch (error) {
            console.error("[EXECUTE_CURRENT_STEP] Error in step execution:", error);
            addLog(t('gamePhases.executionError'), "error", true);
        } finally {
            isProcessingStepRef.current = false;
        }
    };
    
    if (players.length > 0 || gamePhase === GAME_PHASES.SETUP || gamePhase === GAME_PHASES.SHOW_ROLE_MODAL) {
        executeCurrentStep();
    }

  }, [
    gamePhase, 
    winner, 
    players.length,
    showRoleModalState,
    werewolfTargetId, 
    witchPotions.antidote,
    witchPotions.poison,
    guardLastProtectedId, 
    pendingDeathPlayerIds.length, 
    currentPlayerSpeakingId, 
    Object.keys(currentVotes).length, 
    humanPlayerId, 
    seerLastCheck?.targetId, 
    playerToPoisonId, 
    hunterTargetId,
    t, tr, tts?.isEnabled
  ]);
}; 