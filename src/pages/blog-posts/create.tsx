import { useState } from "react";
import { Modal, Form, Input, Button, Upload, DatePicker } from "antd";
import { supabaseClient } from "../../utility";
import { useNavigate } from "react-router-dom";
import { useGetIdentity } from "@refinedev/core";

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

export const BlogPostCreate = () => {
  const [visible, setVisible] = useState(true);
  const navigate = useNavigate();
  const { data: user } = useGetIdentity<IUser>();

  const goToListPage = () => {
    setVisible(false);
    navigate("/blog-posts");
    
  };

  const handleCancel = () => {
    setVisible(false);
    goToListPage();
  };

  const handleSubmit = async (values: any) => {
    try {
      const { name, address, city, start_date, end_date, value, document } = values;

      // Fetch the companyId from the company_user table
      const { data: companyUserData, error: companyUserError } = await supabaseClient
        .from("company_user")
        .select("company_id")
        .eq("user_id", user?.id)
        .single();

      if (companyUserError) {
        throw companyUserError;
      }

      const companyId = companyUserData?.company_id;

      const { data: projectData, error: projectError, status } = await supabaseClient
        .from("project")
        .insert({ name, address, city, start_date, end_date, value, document, company_id: companyId });

      if (projectError) {
        throw projectError;
      }

      goToListPage();
    } catch (error) {
      console.error("Error creating project:", error);
      // Log the status code and response body
      if (error instanceof Error) {
        console.error("Error message:", error.message);
      } else {
        console.error("Unknown error:", error);
      }
    }
  };

  return (
    <Modal visible={visible} onCancel={handleCancel} title="Add new project" width={512} footer={null}>
      <Form onFinish={handleSubmit} layout="vertical">
        <Form.Item label="Project name" name="name" rules={[{ required: true, message: "Please enter project name" }]}>
          <Input placeholder="Please enter project name" />
        </Form.Item>
        <Form.Item label="Address" name="address" rules={[{ required: true, message: "Please enter address" }]}>
          <Input placeholder="Please enter address" />
        </Form.Item>
        <Form.Item label="City" name="city" rules={[{ required: true, message: "Please enter city" }]}>
          <Input placeholder="Please enter city" />
        </Form.Item>
        <Form.Item
          label="Start Date"
          name="start_date"
          rules={[{ required: true, message: "Please select start date" }]}
        >
          <DatePicker />
        </Form.Item>
        <Form.Item
          label="End Date"
          name="end_date"
          rules={[{ required: true, message: "Please select end date" }]}
        >
          <DatePicker />
        </Form.Item>
        <Form.Item label="Value of Project" name="value">
          <Input placeholder="Please enter value" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Create
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};