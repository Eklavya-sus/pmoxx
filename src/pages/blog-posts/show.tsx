import React, { useState } from "react";
import { AppstoreOutlined, BuildOutlined, CheckSquareOutlined, MailOutlined, ProjectOutlined, SettingOutlined, TeamOutlined, UnorderedListOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Menu } from "antd";
import { KanbanPage } from "../task";
import { CompanyEditPage } from "./project-overview";
import styled from "styled-components";
import { AddProjectMembers } from "./components/add-users";
import { ProjectAttendanceList } from "./components/attendance/list";
import { ProjectTaskPage } from "./components/tasks/list";
import { ProjectInventoryList } from "./components/inventory/list";

const ContentContainer = styled.div`
  margin-top: 20px; // Add some space between the menubar and content
`;

const items: Required<MenuProps>["items"] = [
  {
    label: "Dashboard",
    key: "overview",
    icon: <ProjectOutlined />,
  },
  {
    label: "Tasks",
    key: "tasks",
    icon: <UnorderedListOutlined />,
  },
  {
    label: "Inventory",
    key: "inventory",
    icon: <BuildOutlined />,
  },
  {
    label: "Attendance",
    key: "attendance",
    icon: <CheckSquareOutlined />,
  },
  {
    label: "Add Member",
    key: "team",
    icon: <TeamOutlined />,
  },
];

export const BlogPostShow: React.FC = () => {
  const [current, setCurrent] = useState<string>("tasks"); // Set the initial value to "tasks"

  const onClick: MenuProps["onClick"] = (e) => {
    console.log("click ", e);
    setCurrent(e.key);
  };

  return (
    <>
      <Menu onClick={onClick} selectedKeys={[current]} mode="horizontal" items={items} />
      <ContentContainer>
        {current === "overview" && <CompanyEditPage />}
        {current === "tasks" && <ProjectTaskPage />} {/* Render KanbanPage by default */}
        {current === "inventory" && <ProjectInventoryList/>}
        {current === "attendance" && <ProjectAttendanceList />}
        {current === "team" && <AddProjectMembers />}
      </ContentContainer>
    </>
  );
};