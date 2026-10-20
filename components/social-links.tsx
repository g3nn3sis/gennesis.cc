import type { ComponentType, MouseEvent, SVGProps } from "react";
import { useMailtoHref } from "@/lib/email";
import { CONTACT_EMAIL } from "@/lib/site";
import { DiscordIcon, GitHubIcon, MailIcon, TikTokIcon } from "./icons";

interface SocialLink {
  label: string;
  href?: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const LINKS: SocialLink[] = [
  { label: "GitHub", href: "https://github.com/g3nn3sis", Icon: GitHubIcon },
  { label: "Discord", href: "https://discord.com/users/1520788134659358765", Icon: DiscordIcon },
  { label: "TikTok", href: "https://www.tiktok.com/@gggennnesssisss", Icon: TikTokIcon },
];

export default function SocialLinks({ onNavigate }: { onNavigate: (e: MouseEvent<HTMLAnchorElement>) => void }) {
  const contactHref = useMailtoHref(CONTACT_EMAIL);
  const links = [...LINKS, { label: "Contact", href: contactHref, Icon: MailIcon }];

  return (
    <div className="links">
      {links.map(({ label, href, Icon }) => (
        <a key={label} href={href} onClick={onNavigate}>
          <Icon className="btn-icon" width={16} height={16} />
          {label}
        </a>
      ))}
    </div>
  );
}
