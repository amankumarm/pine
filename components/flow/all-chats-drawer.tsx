'use client';

import { Drawer } from 'vaul';
import { useState, useMemo } from 'react';
import { MessageSquare, Search } from 'lucide-react';

interface Message {
  role: string;
  content: string;
  createdAt: Date | string;
}

interface ChatWindow {
  id: string;
  title: string;
  positionX: number;
  positionY: number;
  messages?: Message[];
}

interface AllChatsDrawerProps {
  parentWindows: ChatWindow[];
  onChatClick: (windowId: string) => void;
}

export function AllChatsDrawer({ parentWindows, onChatClick }: AllChatsDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const sortedAndFilteredWindows = useMemo(() => {
    const reversed = [...parentWindows].reverse();
    
    return reversed.filter(w => 
      w.title.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
      const getLastTime = (w: ChatWindow) => {
        if (!w.messages || w.messages.length === 0) return -1;
        const lastMsg = w.messages[w.messages.length - 1];
        return new Date(lastMsg.createdAt).getTime();
      };
      
      const timeA = getLastTime(a);
      const timeB = getLastTime(b);
      
      if (timeA > 0 && timeB > 0) {
        return timeB - timeA;
      }
      return 0; 
    });

  }, [parentWindows, searchQuery]);

  return (
    <Drawer.Root direction="right" open={isOpen} onOpenChange={setIsOpen}>
      <Drawer.Trigger className="relative flex h-9 flex-shrink-0 items-center justify-center gap-2 overflow-hidden rounded-md bg-white px-3 text-xs font-medium shadow-sm transition-all hover:bg-zinc-50 border border-zinc-200">
        <MessageSquare className="h-3.5 w-3.5" />
        <span>All Chat</span>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-transparent z-50" />
        <Drawer.Content
          className="fixed right-0 top-0 bottom-0 z-50 outline-none w-[260px] flex shadow-2xl"
          style={{ '--initial-transform': '100%' } as React.CSSProperties}
        >
          <div className="bg-[#F9F9F9] h-full w-full grow flex flex-col border-l border-zinc-200">
            {/* Header */}
            <div className="p-3 pb-2">
              <div className="relative group">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search chats"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-zinc-200/50 border-0 rounded-md text-xs focus:ring-1 focus:ring-zinc-400 transition-all text-zinc-900 placeholder:text-zinc-500"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-2 py-1 scrollbar-hide">
              <div className="text-[10px] font-medium text-zinc-400 px-2 py-1 uppercase tracking-wider mb-0.5">
                Your chats
              </div>
              <div className="flex flex-col gap-0.5">
                {sortedAndFilteredWindows.length === 0 ? (
                  <div className="px-2 py-2 text-xs text-zinc-500">
                    No chats found
                  </div>
                ) : (
                  sortedAndFilteredWindows.map((window) => (
                    <button
                      key={window.id}
                      onClick={() => {
                        onChatClick(window.id);
                        setIsOpen(false);
                      }}
                      className="group flex items-center w-full text-left px-2 py-1.5 rounded-md hover:bg-zinc-200/50 transition-colors"
                    >
                      <span className="flex-1 truncate text-xs text-zinc-700 group-hover:text-zinc-900">
                        {window.title || 'Untitled Chat'}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
