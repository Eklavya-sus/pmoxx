import { useState } from "react";
import { Modal, Form, Input, Button, Select } from "antd";
import { supabaseClient } from "../../utility";
import { useGetIdentity } from "@refinedev/core";
import { useNavigate } from "react-router-dom";

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

export const JoinCompany = () => {
  const [visible, setVisible] = useState(true);
  const { data: user } = useGetIdentity<IUser>();
  const navigate = useNavigate();

  const goToListPage = () => {
    setVisible(false);
    navigate('/');
  };

  const handleCancel = () => {
    setVisible(false);
    goToListPage();
  };

  const handleSubmit = async (values: { uniquecode: string; role: string }) => {
    try {
      const { uniquecode, role } = values;

      // Check if the company with the provided unique code exists
      const { data: companyData, error: companyError } = await supabaseClient
        .from("company")
        .select("*")
        .eq("uniquecode", uniquecode)
        .single();

      if (companyError) {
        throw companyError;
      }

      if (companyData) {
        console.log("Company Data:", companyData);
        const { companyid } = companyData;

        // Insert into company_user table with the selected role
        await supabaseClient.from("company_user").insert({
          company_id: companyid,
          user_id: user?.id,
          role: role,
        });

        goToListPage();
      } else {
        throw new Error("Company not found with the provided unique code.");
      }
    } catch (error) {
      console.error("Error joining company:", (error as Error).message || error);
    }
  };

  return (
    <Modal
      visible={visible}
      mask={true}
      onCancel={handleCancel}
      title="Join Company"
      width={512}
      footer={null}
    >
      <Form onFinish={handleSubmit} layout="vertical">
        <Form.Item
          label="Unique Code"
          name="uniquecode"
          rules={[{ required: true, message: "Please enter unique code" }]}
        >
          <Input placeholder="Please enter unique code" />
        </Form.Item>
        <Form.Item
          label="Role"
          name="role"
          rules={[{ required: true, message: "Please select a role" }]}
        >
          <Select placeholder="Select a role">
            <Select.Option value="employee">Employee</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Join
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};
