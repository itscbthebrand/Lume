import { Link } from 'react-router-dom';

interface MentionsProps {
  text: string;
  className?: string;
}

export default function Mentions({ text, className }: MentionsProps) {
  if (!text) return null;

  const parts = text.split(/(@\w+)/g);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith('@')) {
          const username = part.slice(1);
          return (
            <Link
              key={i}
              to={`/profile/${username}`}
              className="text-[#6f9cde] font-bold hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }
        return part;
      })}
    </span>
  );
}
