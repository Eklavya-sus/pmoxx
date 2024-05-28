import type { IResourceItem } from "@refinedev/core";

import {
  CalendarOutlined,
  ContainerOutlined,
  CrownOutlined,
  DashboardOutlined,
  ProjectOutlined,
  ShopOutlined,
  TeamOutlined,
} from "@ant-design/icons";

export const resources: IResourceItem[] = [
  {
    name: "project",
              list: "/blog-posts",
              create: "/blog-posts/create",
              edit: "/blog-posts/edit/:id",
              show: "/blog-posts/show/:id",
              meta: {
                canDelete: true,
              },
  },
  {
    name: "tasks",
    create: "/blog-posts/show/:id/create",
    edit: "/blog-posts/show/edit/:id",
    list: "/blog-posts/show/:id",
    meta: {
      hide: true,
      parent: "project",
    },
  },

  {
    name: "task",
    list: "/task",
    create: "/task/create",
    edit: "/task/edit/:id",
    show: "/task/show/:id",
  }
, 
{
  name: "category",
    create: "/task/category/create",
    edit: "/task/category/edit/:id",
    list: "/task",
    meta: {
      hide: true,
    },
}, 
  {
    name: "inventory",
    list: "/inventory",
    create: "/inventory/create",
    edit: "/inventory/edit",
    show: "/inventory/show/:id",
    meta: {
      label: "Inventory",
      icon: <CalendarOutlined />,
    },
  },
  {
    name: "attendance",
    list: "/attendance",
    edit: "/calendar/edit/:id",
    show: "/calendar/show/:id",
    meta: {
      label: "Attendance",
      icon: <CalendarOutlined />,
    },
  },

 
  {
    name: "Reports",
    create: "/scrumboard/kanban/stages/create",
    edit: "/scrumboard/kanban/stages/edit/:id",
    list: "/scrumboard/kanban",
    meta: {
      hide: true,
    },
  },
  {
    name: "Groups",
    list: "/scrumboard/sales",
    create: "/scrumboard/sales/create",
    edit: "/scrumboard/sales/edit/:id",
    meta: {
      label: "Groups",
      parent: "scrumboard",
    },
  },
  {
    name: "Library",
    identifier: "finalize-deals",
    edit: "/scrumboard/sales/:id/finalize",
    meta: {
      hide: true,
    },
  },
  {
    name: "dealStages",
    create: "/scrumboard/sales/stages/create",
    edit: "/scrumboard/sales/stages/edit/:id",
    list: "/scrumboard/sales",
    meta: {
      hide: true,
    },
  },
  {
    name: "companies",
    list: "/companies",
    show: "/companies/:id",
    create: "/companies/create",
    edit: "/companies/edit/:id",
    meta: {
      label: "Companies",
      icon: <ShopOutlined />,
    },
  },
  {
    name: "companies",
    identifier: "sales-companies",
    create: "/scrumboard/sales/create/company/create",
    meta: {
      hide: true,
    },
  },
  {
    name: "contacts",
    list: "/contacts",
    create: "/contacts/create",
    edit: "/contacts/edit/:id",
    show: "/contacts/show/:id",
    meta: {
      label: "Contacts",
      icon: <TeamOutlined />,
    },
  },
  {
    name: "documents",
    list: "/documents",
    create: "/documents/create",
    edit: "/documents/edit/:id",
    show: "/documents/show/:id",
    meta: {
      label: "Quotes",
      icon: <ContainerOutlined />,
    },
  },
  {
    name: "administration",
    meta: {
      label: "Administration",
      icon: <CrownOutlined />,
    },
  },
  {
    name: "settings",
    list: "/administration/settings",
    meta: {
      label: "Settings",
      parent: "administration",
    },
  },
  {
    name: "audits",
    list: "/administration/audit-log",
    meta: {
      label: "Audit Log",
      parent: "administration",
    },
  },
];
