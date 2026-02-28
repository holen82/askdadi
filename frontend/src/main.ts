import './styles/main.css';
import './styles/device-mode.css';
import './styles/login.css';
import './styles/header.css';
import './styles/chat.css';
import './styles/message.css';
import './styles/sidebar.css';
import './styles/info-panel.css';
import './styles/confirm-dialog.css';
import { initAuthGuard } from '@/utils/authGuard';
import { renderHeader, initHeader } from '@/components/Header';
import { renderChat, initChat, loadConversation, startNewConversation, getCurrentConversationId, initConversationFromStorage, fillChatInput, triggerSend } from '@/components/Chat';
import { renderConversationSidebar, initConversationSidebar } from '@/components/ConversationSidebar';
import { renderInfoPanel, initInfoPanel } from '@/components/InfoPanel';
import { ConversationStorage } from '@/services/conversationStorage';
import { initDebugMode } from '@/utils/debugMode';
import { deviceMode } from '@/utils/deviceMode';
import type { User } from '@/types/auth';

// (rest of file unchanged)
