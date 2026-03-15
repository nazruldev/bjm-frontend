"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  const closeMobileSidebar = (url: string) => {
    if (isMobile && url !== "#") setOpenMobile(false)
  }

  return (
    <SidebarGroup>
   
      <SidebarMenu>
        {items.map((item) => {
          // Cek apakah ada children yang aktif
          const hasActiveChild = item.items?.some(
            (subItem) => pathname === subItem.url || pathname.startsWith(subItem.url + "/")
          )
          
          // Cek apakah item itu sendiri aktif (untuk item tanpa children)
          const isItemActive = !item.items?.length && (
            pathname === item.url || pathname.startsWith(item.url + "/")
          )

          return (
            <Collapsible key={item.title} asChild defaultOpen={hasActiveChild}>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={item.title} isActive={isItemActive}>
                  <Link href={item.url} onClick={() => closeMobileSidebar(item.url)}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="data-[state=open]:rotate-90" suppressHydrationWarning>
                        <ChevronRight />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent suppressHydrationWarning>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => {
                          const isSubItemActive = pathname === subItem.url || pathname.startsWith(subItem.url + "/")
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={isSubItemActive}>
                                <Link href={subItem.url} onClick={() => closeMobileSidebar(subItem.url)}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
