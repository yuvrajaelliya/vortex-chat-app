'use client';

import { useNeonverseChat } from "./useNeonverseChat";
import { useRef, useState, useEffect } from "react";

export default function NeonverseChatLayout() {
  const { messages, users, username, joined, join, sendMessage, joinError, typingUsers, sendTyping, sendSeen } = useNeonverseChat();
  const [input, setInput] = useState("");
  const [msg, setMsg] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [activeChats, setActiveChats] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // for mobile drawer
  const [showMenu, setShowMenu] = useState(false); // for 3-dot menu
  const showJoin = !joined;

  // --- Notification Snackbar State ---
  const [notification, setNotification] = useState<string | null>(null);

  // Fetch chat list after join or refresh
  const refreshChats = () => {
    if (joined && username) {
      fetch(`/chats?username=${encodeURIComponent(username)}`)
        .then(res => res.json())
        .then(setActiveChats);
    }
  };

  // Listen for new chat notification event and show snackbar
  useEffect(() => {
    const handler = (e: any) => {
      try {
        const from = e?.detail?.from;
        if (!from) return;
        setActiveChats((prev: string[]) => Array.isArray(prev) && prev.includes(from) ? prev : [...(Array.isArray(prev) ? prev : []), from]);
        setNotification(`New chat started by ${from}`);
        setTimeout(() => setNotification(null), 3500);
      } catch (err) {
        // fail silently
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("neonverse-new-chat", handler);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("neonverse-new-chat", handler);
      }
    };
  }, [joined, username]);

  // Show only online users for search
  const handleUserSearch = (q: string) => {
    setSearch(q);
    if (q.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    // Only search in online users (from state)
    setShowSearch(true);
    setSearchResults(users.filter((u) => u.toLowerCase().includes(q.toLowerCase()) && u !== username));
  };

  // Handle file/image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Accessibility: focus input on join
  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) join(input.trim());
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Send message or image
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (msg.trim() || image) {
      if (image) {
        const reader = new FileReader();
        reader.onload = () => {
          sendMessage(msg, reader.result as string, selectedUser);
          setMsg("");
          setImage(null);
          setImagePreview(null);
        };
        reader.readAsDataURL(image);
      } else {
        sendMessage(msg, undefined, selectedUser);
        setMsg("");
      }
    }
  };

  // Typing indicator
  const handleTyping = () => {
    sendTyping();
  };

  // Seen status: mark all visible messages as seen
  const handleSeen = () => {
    messages.forEach((m, i) => {
      if (m.user !== username && !(m.seenBy || []).includes(username)) {
        sendSeen(i);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#0e0e10] flex flex-col items-center justify-center p-0 sm:p-4">
      {showJoin && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#0e0e10] z-20">
          <form
            className="bg-[#181824] p-6 sm:p-8 rounded-2xl shadow-2xl flex flex-col gap-4 border border-cyan-400/10 min-w-[90vw] max-w-xs sm:min-w-[320px]"
            onSubmit={handleJoin}
          >
            <div className="text-xl sm:text-2xl font-bold text-[#00ffee] mb-2 text-center">Choose a unique username</div>
            <input
              ref={inputRef}
              className="px-4 py-2 rounded-lg bg-[#23232b] text-white outline-none border border-transparent focus:border-[#00ffee] text-base"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="e.g. ankush_123"
              autoFocus
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_]+"
            />
            {joinError && <div className="text-[#ff0077] text-sm font-semibold text-center">{joinError}</div>}
            <button type="submit" className="bg-[#00ffee] text-[#0e0e10] px-6 py-2 rounded-full font-bold shadow-[0_0_8px_#00ffee] hover:bg-[#00ffee]/80 transition">Join Chat</button>
          </form>
        </div>
      )}
      <div className="w-full max-w-full sm:max-w-6xl h-[100dvh] sm:h-[600px] rounded-none sm:rounded-2xl shadow-none sm:shadow-2xl flex flex-col sm:flex-row overflow-hidden border-0 sm:border border-cyan-400/10 bg-gradient-to-br from-[#0e0e10] via-[#181824] to-[#0e0e10] relative">
        {/* Mobile Topbar */}
        <div className="flex sm:hidden items-center justify-between px-4 py-3 border-b border-cyan-400/10 bg-[#10131a]/80 z-10">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-full border border-[#00ffee] bg-[#181824] text-[#00ffee] shadow-[0_0_8px_#00ffee] focus:outline-none focus:ring-2 focus:ring-[#00ffee]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="text-xl font-bold text-[#00ffee] tracking-widest drop-shadow-[0_0_8px_#00ffee]">VORTEX</div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00ffee] to-[#ff0077] border-2 border-[#00ffee]" />
        </div>
        {/* Sidebar (Drawer on mobile) */}
        <aside className={`fixed sm:static top-0 left-0 h-full z-30 bg-[#10131a]/95 p-6 flex flex-col border-r border-cyan-400/10 w-4/5 max-w-xs sm:w-1/4 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0`} style={{boxShadow: sidebarOpen ? '0 0 32px #00ffee99' : undefined}}>
          {/* Close button on mobile */}
          <button className="sm:hidden absolute top-4 right-4 p-2 rounded-full border border-[#00ffee] bg-[#181824] text-[#00ffee] shadow-[0_0_8px_#00ffee]" onClick={() => setSidebarOpen(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {/* Sidebar content: logo, user info, search, chat list */}
          <div className="flex items-center gap-3 mb-8 relative">
            {/* Refresh button: left of logo on mobile, absolute on desktop */}
            <button
              className="p-2 rounded-full border border-[#00ffee] bg-[#181824] hover:bg-[#00ffee]/20 text-[#00ffee] shadow-[0_0_8px_#00ffee] transition focus:outline-none focus:ring-2 focus:ring-[#00ffee] sm:absolute sm:right-0 sm:top-0"
              style={{ boxShadow: '0 0 8px #00ffee' }}
              onClick={refreshChats}
              type="button"
              aria-label="Refresh Chats"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0A8.003 8.003 0 0012 20a8 8 0 007.938-7" />
              </svg>
            </button>
            <div className="text-2xl font-bold text-[#00ffee] tracking-widest drop-shadow-[0_0_8px_#00ffee]">VORTEX</div>
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#00ffee] to-[#ff0077] border-2 border-[#00ffee]" />
            <div>
              <div className="font-semibold text-white">{username}</div>
              <div className="text-xs text-[#a6ff00]">Online</div>
            </div>
          </div>
          <div className="mb-6 flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                className="px-3 py-1 rounded bg-[#181824] text-white text-xs outline-none border border-transparent focus:border-[#00ffee] w-full"
                placeholder="Search online users..."
                value={search}
                onChange={e => handleUserSearch(e.target.value)}
                onFocus={() => setShowSearch(true)}
              />
              <button
                className="px-3 py-1 rounded bg-[#00ffee] text-[#0e0e10] text-xs font-bold shadow-[0_0_8px_#00ffee] hover:bg-[#00ffee]/80 transition"
                onClick={() => handleUserSearch(search)}
                type="button"
              >
                Search
              </button>
            </div>
            {showSearch && searchResults.length > 0 && (
              <ul className="mt-2 bg-[#181824] rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {searchResults.map((user, i) => (
                  <li
                    key={user + i}
                    className="p-2 cursor-pointer hover:bg-[#00ffee]/10 text-white"
                    onClick={() => {
                      setSelectedUser(user);
                      setSearch("");
                      setSearchResults([]);
                      setShowSearch(false);
                      if (!activeChats.includes(user)) setActiveChats([...activeChats, user]);
                      setSidebarOpen(false); // close drawer on mobile after selecting
                    }}
                  >
                    {user}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="text-xs text-gray-400 mb-2">Chats</div>
          <ul className="flex-1 space-y-2 overflow-y-auto pr-2">
            {activeChats.map((user, i) => (
              <li
                key={user + i}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-[#00ffee]/5 transition ${user === selectedUser ? "bg-[#00ffee]/10" : ""}`}
                onClick={() => {
                  setSelectedUser(user);
                  setSidebarOpen(false); // close drawer on mobile after selecting
                }}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00ffee] to-[#ff0077] border-2 border-[#00ffee]" />
                <div className="flex-1">
                  <div className="text-white font-medium text-sm flex items-center gap-2">
                    {user}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </aside>
        {/* Overlay for mobile drawer */}
        {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-20 sm:hidden" onClick={() => setSidebarOpen(false)}></div>}
        {/* Chat Window */}
        <main className="flex-1 flex flex-col bg-transparent min-h-0" onFocus={handleSeen} tabIndex={0}>
          <div className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 border-b border-cyan-400/10">
            <div className="text-base sm:text-lg font-semibold text-white tracking-wide">
              {selectedUser ? `Chat with ${selectedUser}` : "Select a user to chat"}
            </div>
            <div className="flex items-center gap-2 relative">
              <button
                className="text-gray-400 hover:text-[#00ffee] text-2xl focus:outline-none"
                onClick={() => setShowMenu((v) => !v)}
                aria-label="Open menu"
              >
                ...
              </button>
              {/* Neon Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 top-8 min-w-[140px] bg-[#181824] border-2 border-[#00ffee] rounded-xl shadow-[0_0_16px_#00ffee] z-50 animate-fade-in-up">
                  <a
                    href="https://wa.me/917096609708?text=Hi%20I%20need%20support%20regarding%20the%20chat%20website!"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 text-[#00ffee] hover:bg-[#00ffee]/10 font-semibold rounded-xl transition-all cursor-pointer"
                    style={{ boxShadow: '0 0 8px #00ffee' }}
                    onClick={() => setShowMenu(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" className="w-5 h-5">
                      <path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.832 4.584 2.236 6.393L4 29l7.828-2.205C13.7 27.597 14.836 28 16 28c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 22c-1.02 0-2.02-.16-2.98-.473l-.212-.07-4.65 1.308 1.32-4.527-.138-.217C7.44 18.13 7 16.59 7 15c0-4.963 4.037-9 9-9s9 4.037 9 9-4.037 9-9 9zm5.07-6.13c-.277-.138-1.637-.808-1.89-.9-.253-.092-.437-.138-.62.138-.184.277-.713.9-.874 1.085-.161.184-.322.207-.599.069-.277-.138-1.17-.431-2.23-1.375-.824-.735-1.38-1.64-1.542-1.917-.161-.277-.017-.427.122-.564.125-.124.277-.322.415-.483.138-.161.184-.276.276-.46.092-.184.046-.345-.023-.483-.069-.138-.62-1.497-.849-2.05-.224-.54-.453-.466-.62-.475l-.53-.009c-.161 0-.46.069-.701.322-.241.253-.92.899-.92 2.19s.942 2.544 1.073 2.721c.131.184 1.853 2.832 4.492 3.86.629.216 1.12.345 1.504.442.632.161 1.208.138 1.663.084.508-.06 1.637-.669 1.87-1.316.23-.646.23-1.2.161-1.316-.069-.115-.253-.184-.53-.322z" />
                    </svg>
                    Support
                  </a>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-2 sm:gap-4 px-2 sm:px-8 py-2 sm:py-6 overflow-y-auto" onMouseEnter={handleSeen}>
            {selectedUser ? (
              messages
                .filter((m) => {
                  const msg = m as typeof m & { to?: string };
                  return msg.to && ((msg.user === username && msg.to === selectedUser) || (msg.user === selectedUser && msg.to === username));
                })
                .map((m, i) => (
                  <div key={i} className={m.user === username ? "self-end max-w-[85vw] sm:max-w-[60%]" : "self-start max-w-[85vw] sm:max-w-[60%]"}>
                    <div className={
                      (m.user === username
                        ? "bg-[#ff0077] text-white rounded-2xl rounded-br-none"
                        : "bg-[#23232b] text-white rounded-2xl rounded-bl-none") +
                      " px-3 sm:px-4 py-2 shadow-md mb-1 relative group text-sm sm:text-base"
                    }>
                      <span className="font-bold text-[#00ffee] mr-2">{m.user}</span>
                      {m.text}
                      {m.imageUrl && (
                        <img src={m.imageUrl} alt="shared" className="mt-2 rounded-lg max-h-32 sm:max-h-40 border border-[#00ffee]/30 shadow-[0_0_8px_#00ffee]" />
                      )}
                      {/* Seen status */}
                      {m.seenBy && m.seenBy.length > 0 && (
                        <span className="absolute bottom-1 right-2 text-xs text-[#00ffee]/70 opacity-0 group-hover:opacity-100 transition">Seen by: {m.seenBy.join(", ")}</span>
                      )}
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-gray-400 text-center mt-10">Select a user to start chatting.</div>
            )}
            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 text-[#00ffee] animate-pulse">
                {typingUsers.join(", ")} typing...
              </div>
            )}
          </div>
          <form
            className="flex items-center gap-2 sm:gap-4 px-2 sm:px-8 py-2 sm:py-4 border-t border-cyan-400/10"
            onSubmit={handleSend}
          >
            <label className="text-[#00ffee] text-2xl hover:scale-110 transition cursor-pointer">
              &#128247;
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
            {imagePreview && (
              <img src={imagePreview} alt="preview" className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg border border-[#00ffee]/50 shadow-[0_0_8px_#00ffee]" />
            )}
            <input
              type="text"
              placeholder={selectedUser ? "Type a message..." : "Select a user to chat"}
              className="flex-1 bg-[#181824] text-white px-3 sm:px-4 py-2 rounded-full outline-none border border-transparent focus:border-[#00ffee] focus:shadow-[0_0_8px_#00ffee] transition text-sm sm:text-base"
              value={msg}
              onChange={e => setMsg(e.target.value)}
              onKeyDown={handleTyping}
              autoFocus
              aria-label="Type a message"
              disabled={!selectedUser}
            />
            <button type="submit" className="bg-[#00ffee] text-[#0e0e10] px-4 sm:px-6 py-2 rounded-full font-bold shadow-[0_0_8px_#00ffee] hover:bg-[#00ffee]/80 transition text-lg sm:text-base" aria-label="Send message" disabled={!selectedUser}>&#8594;</button>
          </form>
        </main>
        {/* Right Sidebar (hide on mobile) */}
        <aside className="hidden sm:flex w-1/4 bg-[#10131a]/80 p-6 flex-col items-center border-l border-cyan-400/10">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#00ffee] to-[#ff0077] border-4 border-[#00ffee] mb-4" />
          <div className="text-white font-semibold text-lg mb-1">{username}</div>
          <div className="text-[#00ffee] text-sm mb-6">Online</div>
          <div className="w-full">
            <div className="text-xs text-gray-400 mb-2">Shared Photos</div>
            <div className="h-24 bg-[#181824] rounded-lg flex items-center justify-center text-gray-500">
              {/* Show shared images */}
              {messages.filter(m => m.imageUrl).length === 0 ? "No photos yet" : (
                <div className="flex gap-2 overflow-x-auto">
                  {messages.filter(m => m.imageUrl).map((m, i) => (
                    <img key={i} src={m.imageUrl} alt="shared" className="w-16 h-16 object-cover rounded border border-[#00ffee]/30" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Notification Snackbar */}
      {notification && (
        <div className="fixed top-6 left-1/2 z-50 -translate-x-1/2 bg-[#181824] border border-[#00ffee] text-[#00ffee] px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-[0_0_16px_#00ffee] flex items-center gap-2 sm:gap-3 animate-fade-in-up font-semibold text-sm sm:text-base neon-glow">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="#00ffee" className="w-5 h-5 sm:w-6 sm:h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          {notification}
        </div>
      )}
    </div>
  );
}
