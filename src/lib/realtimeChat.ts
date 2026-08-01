import {
  ref,
  push,
  set,
  onValue,
  off,
  get,
  serverTimestamp,
} from "firebase/database";
import { realtimeDb } from "./firebase";

export type ChatMessageItem = {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "patient" | "doctor";
  text: string;
  timestamp: string;
  read: boolean;
};

export type ChatChannel = {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty?: string;
  patientKey: string;
  patientName: string;
  patientEmail: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCountDoctor: number;
  unreadCountPatient: number;
  createdAt: string;
  messages?: Record<string, ChatMessageItem>;
};

const LOCAL_CHAT_PREFIX = "medelite_chat_";
const LOCAL_CHANNELS_KEY = "medelite_chat_channels";

const getLocalChannels = (): ChatChannel[] => {
  try {
    const raw = localStorage.getItem(LOCAL_CHANNELS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalChannels = (channels: ChatChannel[]) => {
  try {
    localStorage.setItem(LOCAL_CHANNELS_KEY, JSON.stringify(channels));
  } catch {
    // Ignore storage quota
  }
};

const getLocalMessages = (chatId: string): ChatMessageItem[] => {
  try {
    const raw = localStorage.getItem(LOCAL_CHAT_PREFIX + chatId);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalMessages = (chatId: string, messages: ChatMessageItem[]) => {
  try {
    localStorage.setItem(LOCAL_CHAT_PREFIX + chatId, JSON.stringify(messages));
    window.dispatchEvent(new CustomEvent("medelite-chat-update", { detail: { chatId } }));
  } catch {
    // Ignore storage quota
  }
};

export const createChatId = (doctorId: string, patientKey: string) => {
  const cleanDoctor = doctorId.replace(/[^a-zA-Z0-9]/g, "_");
  const cleanPatient = patientKey.replace(/[^a-zA-Z0-9]/g, "_");
  return `chat_${cleanDoctor}_${cleanPatient}`;
};

export const getOrCreateChatChannel = async ({
  doctorId,
  doctorName,
  doctorSpecialty = "",
  patientKey,
  patientName,
  patientEmail,
}: {
  doctorId: string;
  doctorName: string;
  doctorSpecialty?: string;
  patientKey: string;
  patientName: string;
  patientEmail: string;
}): Promise<ChatChannel> => {
  const chatId = createChatId(doctorId, patientKey);
  const chatRef = ref(realtimeDb, `chats/${chatId}`);

  try {
    const snapshot = await get(chatRef);
    if (snapshot.exists()) {
      return snapshot.val() as ChatChannel;
    }
  } catch (error) {
    console.warn("Firebase RTDB fetch warning, relying on local sync", error);
  }

  const now = new Date().toISOString();
  const newChannel: ChatChannel = {
    id: chatId,
    doctorId,
    doctorName,
    doctorSpecialty,
    patientKey,
    patientName,
    patientEmail,
    lastMessage: "Suhbat boshlandi",
    lastMessageTime: now,
    unreadCountDoctor: 0,
    unreadCountPatient: 0,
    createdAt: now,
  };

  try {
    await set(chatRef, newChannel);
  } catch (error) {
    console.warn("Firebase RTDB set warning, using local channel fallback", error);
  }

  const localChannels = getLocalChannels();
  if (!localChannels.some((c) => c.id === chatId)) {
    saveLocalChannels([...localChannels, newChannel]);
  }

  return newChannel;
};

export const sendRealtimeChatMessage = async ({
  chatId,
  senderId,
  senderName,
  senderRole,
  text,
}: {
  chatId: string;
  senderId: string;
  senderName: string;
  senderRole: "patient" | "doctor";
  text: string;
}) => {
  const now = new Date().toISOString();
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const messageItem: ChatMessageItem = {
    id: messageId,
    senderId,
    senderName,
    senderRole,
    text: text.trim(),
    timestamp: now,
    read: false,
  };

  // Local storage save
  const currentLocal = getLocalMessages(chatId);
  saveLocalMessages(chatId, [...currentLocal, messageItem]);

  // Firebase Realtime Database save
  try {
    const msgListRef = ref(realtimeDb, `chats/${chatId}/messages`);
    const newMsgRef = push(msgListRef);
    await set(newMsgRef, {
      ...messageItem,
      serverTime: serverTimestamp(),
    });

    const metaRef = ref(realtimeDb, `chats/${chatId}`);
    const snap = await get(metaRef);
    const channelMeta = snap.exists() ? (snap.val() as ChatChannel) : null;

    const unreadDoctor = senderRole === "patient" ? (channelMeta?.unreadCountDoctor ?? 0) + 1 : 0;
    const unreadPatient = senderRole === "doctor" ? (channelMeta?.unreadCountPatient ?? 0) + 1 : 0;

    await set(ref(realtimeDb, `chats/${chatId}/lastMessage`), text.trim());
    await set(ref(realtimeDb, `chats/${chatId}/lastMessageTime`), now);
    await set(ref(realtimeDb, `chats/${chatId}/unreadCountDoctor`), unreadDoctor);
    await set(ref(realtimeDb, `chats/${chatId}/unreadCountPatient`), unreadPatient);
  } catch (error) {
    console.warn("Firebase RTDB message push warning", error);
  }

  // Update local channels
  const channels = getLocalChannels();
  const updated = channels.map((c) =>
    c.id === chatId
      ? {
          ...c,
          lastMessage: text.trim(),
          lastMessageTime: now,
          unreadCountDoctor: senderRole === "patient" ? c.unreadCountDoctor + 1 : c.unreadCountDoctor,
          unreadCountPatient: senderRole === "doctor" ? c.unreadCountPatient + 1 : c.unreadCountPatient,
        }
      : c,
  );
  saveLocalChannels(updated);
};

export const subscribeToChatMessages = (
  chatId: string,
  onUpdate: (messages: ChatMessageItem[]) => void,
) => {
  const msgRef = ref(realtimeDb, `chats/${chatId}/messages`);

  const initialLocal = getLocalMessages(chatId);
  onUpdate(initialLocal);

  const handleValue = (snapshot: any) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const items: ChatMessageItem[] = Object.values(data);
      items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      saveLocalMessages(chatId, items);
      onUpdate(items);
    }
  };

  onValue(msgRef, handleValue, () => {
    // If permission error or offline, fallback to local storage
  });

  const customListener = () => {
    onUpdate(getLocalMessages(chatId));
  };
  window.addEventListener("medelite-chat-update", customListener);

  return () => {
    off(msgRef, "value", handleValue);
    window.removeEventListener("medelite-chat-update", customListener);
  };
};

export const subscribeToUserChatChannels = (
  userKeyOrDoctorId: string,
  role: "patient" | "doctor",
  onUpdate: (channels: ChatChannel[]) => void,
) => {
  const chatsRef = ref(realtimeDb, "chats");

  const filterChannels = (rawChannels: ChatChannel[]) => {
    return rawChannels.filter((c) =>
      role === "doctor" ? c.doctorId === userKeyOrDoctorId : c.patientKey === userKeyOrDoctorId,
    );
  };

  onUpdate(filterChannels(getLocalChannels()));

  const handleValue = (snapshot: any) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const allChannels: ChatChannel[] = Object.values(data);
      allChannels.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
      saveLocalChannels(allChannels);
      onUpdate(filterChannels(allChannels));
    }
  };

  onValue(chatsRef, handleValue, () => {
    // Fallback on error
  });

  const customListener = () => {
    onUpdate(filterChannels(getLocalChannels()));
  };
  window.addEventListener("medelite-chat-update", customListener);

  return () => {
    off(chatsRef, "value", handleValue);
    window.removeEventListener("medelite-chat-update", customListener);
  };
};

export const markChatAsRead = async (chatId: string, role: "patient" | "doctor") => {
  try {
    const targetKey = role === "doctor" ? "unreadCountDoctor" : "unreadCountPatient";
    await set(ref(realtimeDb, `chats/${chatId}/${targetKey}`), 0);
  } catch {
    // Fallback
  }

  const channels = getLocalChannels();
  const updated = channels.map((c) =>
    c.id === chatId
      ? {
          ...c,
          unreadCountDoctor: role === "doctor" ? 0 : c.unreadCountDoctor,
          unreadCountPatient: role === "patient" ? 0 : c.unreadCountPatient,
        }
      : c,
  );
  saveLocalChannels(updated);
};
