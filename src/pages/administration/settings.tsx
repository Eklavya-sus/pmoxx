import React, { useState, useEffect } from "react";
import {
  EnvironmentOutlined,
  GlobalOutlined,
  MailOutlined,
  PhoneOutlined,
  SearchOutlined,
  ShopOutlined,
  TeamOutlined,
  CrownOutlined,
  UserOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { Card, Col, Input, Row, Select, Space, Table, Tag, TagProps } from "antd";
import cn from "classnames";
import { Text } from "../../components";
import styles from "./settings.module.css";
import { useGetIdentity } from "@refinedev/core";
import { supabaseClient } from "../../utility";

interface IUser {
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
}

interface ICompanyData {
  CompanyID?: number;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  // Add any other relevant fields from the company table
}

interface CompanyInfoProps {
  companyData: ICompanyData | null;
}

interface UsersTableProps {
  companyUsers: any[];
  userDetails: { [userId: string]: any };
}

interface IProfileData {
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
}

export const SettingsPage = () => {
  const { data: user } = useGetIdentity<IUser>();
  const [companyData, setCompanyData] = useState<ICompanyData | null>(null);
  const [companyUsers, setCompanyUsers] = useState<any[]>([]);
  const [userDetails, setUserDetails] = useState<{ [userId: string]: any }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const { data: companyUserData, error: companyUserError } = await supabaseClient
          .from("company_user")
          .select("company_id, user_id, role")
          .eq("user_id", user?.id)
          .single();

        if (companyUserError) {
          console.error("Error fetching company_id:", companyUserError);
          setLoading(false);
          return;
        }

        const companyId = companyUserData?.company_id;
        

        const { data: fetchedCompanyData, error: companyError } = await supabaseClient
          .from("company")
          .select("*")
          .eq("companyid", companyId)
          .single();

        if (companyError) {
          console.error("Error fetching company data:", companyError);
          setLoading(false);
          return;
        }

        const { data: companyUsersData, error: companyUsersError } = await supabaseClient
          .from("company_user")
          .select("user_id, role")
          .eq("company_id", companyId);

        if (companyUsersError) {
          console.error("Error fetching company users:", companyUsersError);
          setLoading(false);
          return;
        }

        const userIdList = companyUsersData.map((user) => user.user_id);

        const { data: userDetailsData, error: userDetailsError } = await supabaseClient
          .from("profiles")
          .select("*")
          .in("id", userIdList);

        if (userDetailsError) {
          console.error("Error fetching user details:", userDetailsError);
          setLoading(false);
          return;
        }

        const userDetailsObj = userDetailsData.reduce((acc, userDetail) => {
          acc[userDetail.id] = userDetail;
          return acc;
        }, {});

        setUserDetails(userDetailsObj);
        setCompanyUsers(companyUsersData);
        setCompanyData(fetchedCompanyData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [user]);

  return (
    <div className="page-container">
      <Space
        size={16}
        style={{
          width: "100%",
          paddingBottom: "24px",
          borderBottom: "1px solid #D9D9D9",
        }}
      >
        <Text style={{ fontSize: "32px", fontWeight: 700 }}>
          eklavya
        </Text>
      </Space>
      <Row gutter={[32, 32]} style={{ marginTop: 32 }}>
        <Col xs={{ span: 24 }} md={{ span: 24 }} lg={{ span: 24 }} xl={{ span: 16 }}>
          <UsersTable companyUsers={companyUsers} userDetails={userDetails} />
        </Col>
        <Col xs={{ span: 24 }} md={{ span: 24 }} lg={{ span: 24 }} xl={{ span: 8 }}>
          {loading ? (
            <Card loading={true}>Loading...</Card>
          ) : (
            <CompanyInfo companyData={companyData} />
          )}
        </Col>
      </Row>
    </div>
  );
};

const UsersTable: React.FC<UsersTableProps> = ({ companyUsers, userDetails }) => {
  const { data: profileData } = useGetIdentity<IProfileData>();

  const roleVariants: { [key: string]: { color: TagProps["color"]; icon: React.ReactNode } } = {
    admin: { color: "red", icon: <CrownOutlined /> },
    sales_intern: { color: "blue", icon: <UserOutlined /> },
    sales_person: { color: "geekblue", icon: <UserOutlined /> },
    sales_manager: { color: "cyan", icon: <StarOutlined /> },
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Phone",
      dataIndex: "phone_number",
      key: "phone_number",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag
          style={{ textTransform: "capitalize" }}
          color={roleVariants[role.toLowerCase()]?.color}
          icon={roleVariants[role.toLowerCase()]?.icon}
        >
          {role.replace("_", " ").toLowerCase()}
        </Tag>
      ),
    },
  ];

  const dataSource = companyUsers.map((user) => {
    const userDetail = userDetails[user.user_id] || null;
    return {
      key: user.user_id,
      name: userDetail?.full_name || "N/A",
      email: userDetail?.email || "N/A",
      phone_number: userDetail?.phone_number || "N/A",
      role: user.role,
    };
  });

  return (
    <Card
      bodyStyle={{ padding: 0 }}
      headStyle={{ borderBottom: "1px solid #D9D9D9", marginBottom: "1px" }}
      title={
        <Space size="middle">
          <TeamOutlined />
          <Text>Contacts</Text>
        </Space>
      }
      extra={
        <>
          <Text className="tertiary">Total users: </Text>
          <Text strong>{dataSource.length}</Text>
        </>
      }
    >
      <Table dataSource={dataSource} columns={columns} />
    </Card>
  );
};
const CompanyInfo: React.FC<CompanyInfoProps> = ({ companyData }) => {
  const companyInfo = [
    {
      label: "Address",
      value: companyData?.address || "N/A",
      icon: <EnvironmentOutlined className="tertiary" />,
    },
    {
      label: "Phone",
      value: companyData?.phone || "N/A",
      icon: <PhoneOutlined className="tertiary" />,
    },
    {
      label: "Email",
      value: companyData?.email || "N/A",
      icon: <MailOutlined className="tertiary" />,
    },
    {
      label: "Website",
      value: companyData?.website || "N/A",
      icon: <GlobalOutlined className="tertiary" />,
    },
  ];

  return companyData ? (
    <Card
      title={
        <Space>
          <ShopOutlined />
          <Text>Company info</Text>
        </Space>
      }
      headStyle={{ padding: "1rem" }}
      bodyStyle={{ padding: "0" }}
    >
      <div className={styles.list}>
        {companyInfo.map((item) => {
          return (
            <div key={item.label} className={styles.listItem}>
              <div>{item.icon}</div>
              <div className={styles.listItemContent}>
                <Text size="xs" className="tertiary">
                  {item.label}
                </Text>
                <Text className={cn(styles.listItemContent, "primary")}>
                  {item.value}
                </Text>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  ) : null;
}; 