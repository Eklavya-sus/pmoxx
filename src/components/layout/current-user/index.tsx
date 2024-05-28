import React, { useState } from "react";
import { useGetIdentity } from "@refinedev/core";
import { SettingOutlined } from "@ant-design/icons";
import { Avatar, Button, Popover } from "antd";
import { supabaseClient } from "../../../utility/supabaseClient";
import { AccountSettings } from "../account-settings";


type IUser = {
  id: string;
  user_metadata: {
    avatar_url: string;
    email: string;
    email_verified: boolean;
    full_name: string;
    iss: string;
    name: string;
    phone_verified: boolean;
    picture: string;
    provider_id: string;
    sub: string;
  };
};

export const CurrentUser = () => {
  const [opened, setOpened] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { data: user } = useGetIdentity<IUser>();

  const handleAccountSettings = () => {
    setOpened(true);
  };

  const handlePopoverVisibleChange = (visible: boolean) => {
    setPopoverOpen(visible);
  };

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
  };

  const content = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div>
      <strong>{user?.user_metadata.full_name}</strong>
      </div>
      <div>
        <Button
          icon={<SettingOutlined />}
          type="text"
          block
          onClick={handleAccountSettings}
        >
          Account settings
        </Button>
      </div>
      <div>
        <Button type="text" block onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Popover
        placement="bottomRight"
        content={content}
        trigger="click"
        visible={popoverOpen}
        onVisibleChange={handlePopoverVisibleChange}
      >
        <Avatar
          src={user?.user_metadata.avatar_url}
          alt={user?.user_metadata.full_name}
          style={{ cursor: "pointer" }}
        />
      </Popover>
      {user && (
        <AccountSettings
          opened={opened}
          setOpened={setOpened}
          userId={user?.id}
        />
      )}
    </>
  );
};
