import type { User } from '@/prisma/generated/prisma/client';

interface HeaderProps {
  users: User[];
  selectedUserId: string;
  onUserChange: (userId: string) => void;
  onCreateCollection: () => void;
}

export default function Header({
  users,
  selectedUserId,
  onUserChange,
  onCreateCollection,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold tracking-tight whitespace-nowrap">
          Bidding System
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={onCreateCollection}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            + Create Collection
          </button>
          <label
            htmlFor="user-select"
            className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap"
          >
            Acting as:
          </label>
          <select
            id="user-select"
            value={selectedUserId}
            onChange={e => onUserChange(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-background"
          >
            <option value="">— select user —</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
