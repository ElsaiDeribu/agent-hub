import * as React from 'react';
import { paths } from '@/routes/paths';
import { REGISTRY_ITEMS } from '@/data/registry';
import { NavMain } from '@/sections/docs/nav-main';
import { Sidebar, SidebarRail, SidebarContent } from '@/components/ui/sidebar';
import { Bot, Command, BookOpen, AudioWaveform, GalleryVerticalEnd } from 'lucide-react';

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
    {
      name: 'Evil Corp.',
      logo: Command,
      plan: 'Free',
    },
  ],
  navMain: [
    {
      title: 'Get Started',
      url: paths.docs.introduction,
      icon: BookOpen,
      isActive: true,
      items: [
        {
          title: 'Introduction',
          url: paths.docs.introduction,
        },
        {
          title: 'Installation',
          url: paths.docs.installation,
        },
      ],
    },
    {
      title: 'Agents',
      url: paths.docs.root,
      icon: Bot,
      isActive: true,
      items: REGISTRY_ITEMS.map((agent) => ({
        title: agent.title,
        url: paths.docs.agents.detail(agent.name),
      })),
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
