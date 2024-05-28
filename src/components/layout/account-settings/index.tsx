import React, { useState, useEffect } from "react";
import { useForm } from "@refinedev/react-hook-form";
import { supabaseClient } from "../../../utility/supabaseClient"; // Import your Supabase client
import { Spin, Drawer, Button, Card, Form, Input, Avatar } from "antd";
import { CloseOutlined, UserOutlined } from "@ant-design/icons";
import { useGetIdentity } from "@refinedev/core";

interface IUserIdentity {
  id?: string;
  username: string;
  name: string;
}

export interface IProfile {
  id?: string;
  username?: string;
  website?: string;
  avatar_url?: string;
}

type Props = {
  opened: boolean;
  setOpened: (opened: boolean) => void;
  userId: string;
};
export const AccountSettings = ({ opened, setOpened}: Props) => {
  const { data: userIdentity, refetch } = useGetIdentity<IUserIdentity>(); // Added refetch function

  const {
    refineCore: { formLoading, queryResult },
    register,
    control,
    handleSubmit,
    setValue, // Added setValue from useForm
  } = useForm<IProfile>({
    refineCoreProps: {
      resource: "profiles",
      action: "edit",
      id: userIdentity?.id,
      redirect: false,
      onMutationError: (data) => alert(data?.message),
    },
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const { data, error } = await supabaseClient
          .from("profiles")
          .select("*")
          .eq("id", userIdentity?.id)
          .single();

        if (error) {
          throw error;
        }

        // Populate form with profile data
        Object.keys(data).forEach((key) => {
          setValue(key, data[key]); // Use setValue from useForm to update form state
        });
      } catch (error) {
        console.error("Error fetching profile data:", error); // Log error for debugging
      }
    };

    fetchProfileData();
  }, [userIdentity?.id, setValue]); // Added setValue to dependency array

  const onSubmit = async (formData: IProfile) => {
    try {
      const { error } = await supabaseClient
        .from("profiles")
        .update(formData)
        .eq("id", userIdentity?.id);
  
      if (error) {
        throw error;
      }
  
      console.log("Profile updated successfully!");
      refetch(); // Refetch profile data after successful update
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };


  return (
    <Drawer
      onClose={() => setOpened(false)}
      visible={opened}
      width={400}
      placement="right"
      closable={false}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h3>Account Settings</h3>
        <Button type="text" onClick={() => setOpened(false)} icon={<CloseOutlined />} />
      </div>
      {queryResult?.isLoading ? (
        <div style={{ textAlign: "center" }}>
          <Spin />
        </div>
      ) : (
        <Card>
          <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
            <Form.Item label="Name">
              <Input defaultValue={userIdentity?.name} disabled />
            </Form.Item>
            <Form.Item label="Username" name="username">
              <Input />
            </Form.Item>
            <Form.Item label="Website" name="website">
              <Input />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={formLoading} block>
                Update
              </Button>
            </Form.Item>
            
          </Form>
        </Card>
      )}
    </Drawer>
  );
};
function setValue(key: string, arg1: any) {
  throw new Error("Function not implemented.");
}

