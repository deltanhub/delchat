import React, { createContext, useContext } from 'react';
import { ChatPinGateContextType } from './chatPinGateTypes';
import { useChatPinGateState } from './useChatPinGateState';
import ChatPinGateModal from './ChatPinGateModal';

const ChatPinGateContext = createContext<ChatPinGateContextType | undefined>(undefined);

export function ChatPinGateProvider({ children }: { children: React.ReactNode }) {
  const state = useChatPinGateState();

  return (
    <ChatPinGateContext.Provider
      value={{
        isChatUnlocked: state.isChatUnlocked,
        pinLength: state.pinLength,
        isSetupRequired: state.isSetupRequired,
        pinRequiredOnDevice: state.pinRequiredOnDevice,
        biometricsEnabled: state.biometricsEnabled,
        biometryType: state.biometryType,
        setPinRequiredOnDevice: state.setPinRequiredOnDevice,
        setBiometricsEnabled: state.setBiometricsEnabled,
        promptUnlock: state.promptUnlock,
        checkChatAccess: state.checkChatAccess,
        lockChat: state.lockChat,
      }}
    >
      {children}
      <ChatPinGateModal
        visible={state.modalVisible}
        pinLength={state.pinLength}
        isSetupRequired={state.isSetupRequired}
        onUnlocked={state.handleUnlocked}
        onCancel={state.handleCancel}
      />
    </ChatPinGateContext.Provider>
  );
}

export function useChatPinGate() {
  const context = useContext(ChatPinGateContext);
  if (context === undefined) {
    throw new Error('useChatPinGate must be used within a ChatPinGateProvider');
  }
  return context;
}
