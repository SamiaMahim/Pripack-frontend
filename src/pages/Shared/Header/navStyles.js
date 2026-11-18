// Classes for a header icon button and its icon, with selected state.
export const navButtonClass = (active) =>
  `relative group/nav p-2 rounded-lg transition-colors ${active ? 'bg-slate-100' : 'hover:bg-slate-100'}`;

export const navIconClass = (active, hoverColor = 'hover:text-teal-600') =>
  `w-5 h-5 transition group-hover/nav:scale-110 ${active ? 'text-teal-600 scale-110' : `text-slate-600 ${hoverColor}`}`;
