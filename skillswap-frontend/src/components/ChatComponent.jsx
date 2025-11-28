import { useState, useEffect, useRef } from 'react';
import { listenForChatMessages, sendChatMessage, setTyping, listenForTyping, setPresence, listenForPresence, markSessionRead, listenForSessionMeta } from '../services/chatService';
import { useAuthStore } from '../store';

export default function ChatComponent({ sessionId, otherUser }) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typingMap, setTypingMap] = useState({});
  const [presenceMap, setPresenceMap] = useState({});
  const [sessionMeta, setSessionMeta] = useState(null);
  const listRef = useRef(null);
  const typingTimerRef = useRef(null);
  const presenceIntervalRef = useRef(null);

  useEffect(() => {
    if (!sessionId) return;
    const unsub = listenForChatMessages(sessionId, (msgs) => {
      setMessages(msgs);
      // scroll on new messages
      setTimeout(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
      }, 50);
    });
    // mark as read when chat opens
    markSessionRead(sessionId, user.uid);

    // typing listener
    const unsubTyping = listenForTyping(sessionId, (map) => setTypingMap(map));
    // presence listener
    const unsubPresence = listenForPresence(sessionId, (map) => setPresenceMap(map));
    // session meta (for lastRead map)
    const unsubMeta = listenForSessionMeta(sessionId, (meta) => setSessionMeta(meta));

    // set presence online and heartbeat
    setPresence(sessionId, user.uid, true);
    presenceIntervalRef.current = setInterval(() => setPresence(sessionId, user.uid, true), 30000);

    return () => unsub && unsub();
  }, [sessionId]);

  // cleanup listeners and presence on unmount
  useEffect(() => {
    return () => {
      try { setPresence(sessionId, user.uid, false); } catch (e) {}
      if (presenceIntervalRef.current) clearInterval(presenceIntervalRef.current);
    };
  }, [sessionId]);

  const handleSend = async () => {
    if (!text.trim()) return;
    try {
      await sendChatMessage(sessionId, { senderId: user.uid, senderName: user.displayName, text: text.trim() });
      setText('');
      // mark as read for sender as well
      markSessionRead(sessionId, user.uid);
    } catch (err) {
      console.error('Failed to send message', err);
      alert('Failed to send message');
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTyping = (val) => {
    setText(val);
    // notify backend that user is typing
    setTyping(sessionId, user.uid, true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setTyping(sessionId, user.uid, false);
    }, 1500);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-primary-900 mb-3">Chat with {otherUser?.displayName || 'participant'}</h3>

      <div ref={listRef} className="max-h-64 overflow-auto space-y-3 p-2 border rounded mb-3 bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500">No messages yet. Say hello!</p>
        ) : (
          messages.map(m => (
            <div key={m.id} className={`p-2 rounded ${m.senderId === user.uid ? 'bg-primary-600 text-white self-end' : 'bg-white text-gray-900 border'}`}>
              <div className="text-xs opacity-75 mb-1">{m.senderName}</div>
              <div className="whitespace-pre-wrap">{m.text}</div>
              <div className="flex items-center justify-between mt-2 text-xs opacity-50">
                <div>{m.createdAt && m.createdAt.seconds ? new Date(m.createdAt.seconds * 1000).toLocaleString() : ''}</div>
                {m.senderId === user.uid && (
                  <div>
                    {(() => {
                      // determine if other user has read this message
                      const otherId = otherUser?.uid;
                      if (!sessionMeta || !m.createdAt || !otherId) return null;
                      const msgSec = m.createdAt.seconds;
                      const otherRead = sessionMeta.lastRead && sessionMeta.lastRead[otherId];
                      const otherReadSec = otherRead && otherRead.seconds;
                      const isRead = otherReadSec && msgSec <= otherReadSec;
                      return isRead ? '✓ Read' : '⏳ Sent';
                    })()}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Write a message... (Enter to send)"
          className="flex-1 p-2 border rounded resize-none h-12"
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold"
        >
          Send
        </button>
      </div>
      {/* Show typing indicator and presence */}
      <div className="mt-2 text-sm text-gray-500">
        {otherUser && typingMap && typingMap[otherUser.uid] && typingMap[otherUser.uid].typing ? (
          <div>{otherUser.displayName} is typing...</div>
        ) : null}
        {otherUser && presenceMap && presenceMap[otherUser.uid] && presenceMap[otherUser.uid].online ? (
          <div>{otherUser.displayName} is online</div>
        ) : (
          <div className="opacity-60">{otherUser?.displayName || 'Participant'} is offline</div>
        )}
      </div>
    </div>
  );
}
