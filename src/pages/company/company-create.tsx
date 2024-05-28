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

export const CompanyCreatePage = () => {
  const [visible, setVisible] = useState(true);
  const { data: user } = useGetIdentity<IUser>();
  const navigate = useNavigate();

  const goToListPage = () => {
    setVisible(false);
  };

  const handleJoinCompany = () => {
    navigate("/joinCompany");
  };

  const handleCancel = () => {
    setVisible(false);
    goToListPage();
  };

  const handleSubmit = async (values: {
    companyname: string;
    address: string;
    contactnumber: string;
    email: string;
    premium: boolean;
  }) => {
    try {
      const { companyname, address, contactnumber, email, premium } = values;

      const { data: companyData, error: companyError } = await supabaseClient
        .from("company")
        .insert({
          companyname,
          address,
          contactnumber,
          email,
          premium, // This will insert true or false based on user selection
          creator_id: user?.id,
        })
        .single();

      if (companyError) {
        throw companyError;
      }

      goToListPage();
    } catch (error) {
      console.error("Error creating company:", (error as Error).message || error);
    }
  };

  return (
    <Modal
      visible={visible}
      mask={true}
      onCancel={handleCancel}
      title="Add Company"
      width={512}
      footer={null}
    >
      <Form onFinish={handleSubmit} layout="vertical">
        <Form.Item
          label="Company Name"
          name="companyname"
          rules={[{ required: true, message: "Please enter company name" }]}
        >
          <Input placeholder="Please enter company name" />
        </Form.Item>
        <Form.Item
          label="Address"
          name="address"
          rules={[{ required: true, message: "Please enter address" }]}
        >
          <Input.TextArea placeholder="Please enter address" />
        </Form.Item>
        <Form.Item
          label="Contact Number"
          name="contactnumber"
          rules={[{ required: true, message: "Please enter contact number" }]}
        >
          <Input placeholder="Please enter contact number" />
        </Form.Item>
        <Form.Item
          label="Email"
          name="email"
          rules={[{ required: true, message: "Please enter email" }]}
        >
          <Input placeholder="Please enter email" type="email" />
        </Form.Item>
        <Form.Item
          label="Premium"
          name="premium"
          rules={[{ required: true, message: "Please select an option" }]}
        >
          <Select placeholder="Select an option">
            <Select.Option value={true}>Yes</Select.Option>
            <Select.Option value={false}>No</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Create
          </Button>
          <Button type="text" onClick={handleJoinCompany}>
            Join Company
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};
