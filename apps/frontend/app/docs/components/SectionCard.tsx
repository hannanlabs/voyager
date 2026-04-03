import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
}

export default function SectionCard({
  title,
  description,
  href,
  icon,
}: SectionCardProps) {
  return (
    <a
      href={href}
      className="group bg-white/5 border border-white/[0.08] rounded-2xl p-6 hover:bg-red-600/10 hover:border-red-600/20 transition-colors"
    >
      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-600/20 transition-colors">
        {icon}
      </div>
      <h3 className="text-white font-medium mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </a>
  );
}
