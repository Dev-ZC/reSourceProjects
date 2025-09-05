import React, { useState, useRef, useEffect } from 'react';

interface NodeSettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  nodeType: 'folder' | 'link' | 'docs';
  currentTitle: string;
  currentUrl?: string;
  onSave: (data: { title: string; url?: string }) => void;
  position: { x: number; y: number };
}

const NodeSettingsMenu: React.FC<NodeSettingsMenuProps> = ({
  isOpen,
  onClose,
  nodeType,
  currentTitle,
  currentUrl,
  onSave,
  position
}) => {
  const [title, setTitle] = useState(currentTitle);
  const [url, setUrl] = useState(currentUrl || '');
  const menuRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
      setUrl(currentUrl || '');
      // Focus the title input when menu opens
      setTimeout(() => {
        titleInputRef.current?.focus();
        titleInputRef.current?.select();
      }, 100);
    }
  }, [isOpen, currentTitle, currentUrl]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleSave = () => {
    if (title.trim()) {
      onSave({
        title: title.trim(),
        ...(nodeType === 'link' && { url: url.trim() })
      });
      onClose();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl p-4 min-w-[300px]"
      style={{
        bottom: '250px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {nodeType === 'folder' ? 'Folder Name' : nodeType === 'docs' ? 'Document Name' : 'Link Title'}
          </label>
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800 dark:bg-gray-700 dark:text-white"
            placeholder="Enter name..."
          />
        </div>

        {nodeType === 'link' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800 dark:bg-gray-700 dark:text-white"
              placeholder="https://..."
            />
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSave();
            }}
            disabled={!title.trim()}
            className="px-3 py-1.5 text-sm bg-gray-800 text-white rounded-md hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeSettingsMenu;
