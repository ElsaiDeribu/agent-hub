'use client';

import * as React from 'react';
import { paths } from '@/routes/paths';
import { NavLink } from 'react-router-dom';
import { REGISTRY_ITEMS } from '@/data/registry';
import { NavMain } from '@/sections/dashboard/nav-main';
import {
  Bot,
  Command,
  BookOpen,
  AudioWaveform,
  GalleryVerticalEnd,
} from 'lucide-react';
import {
  Sidebar,
  SidebarRail,
  SidebarMenu,
  SidebarHeader,
  SidebarContent,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

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
      title: "Documentation",
      url: paths.dashboard.root,
      icon: BookOpen,
      isActive: true,
      items: [
        {
          title: "Get started",
          url: paths.dashboard.root,
        },
      ],
    },
    {
      title: 'Agents',
      url: paths.dashboard.root,
      icon: Bot,
      isActive: true,
      items: REGISTRY_ITEMS.map((agent) => ({
        title: agent.title,
        url: paths.dashboard.agents.detail(agent.name),
      })),
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
      <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <NavLink to={paths.home}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">Agent-Hub</span>
                  <span className="">v1.0.3</span>
                </div>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
