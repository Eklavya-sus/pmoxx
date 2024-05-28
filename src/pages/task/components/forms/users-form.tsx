import React, { useEffect, useState } from "react";
import { useForm } from "@refinedev/antd";
import { Button, Form, Select, Space, Table } from "antd";
import { supabaseClient } from "../../../../utility";

interface User {
  id: string;
  role: string;
  company_user_id: string;
  full_name: string;
}

interface UsersFormProps {
  taskId: string;
  initialValues: { userIds?: string[] };
  cancelForm: () => void;
}



export const UsersForm: React.FC<UsersFormProps> = ({ taskId, initialValues, cancelForm }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [taskMembers, setTaskMembers] = useState<string[]>([]);
  const { formProps, saveButtonProps } = useForm({
    mutationMode: "undoable",
  });
  const columns = [
    {
      title: 'Full Name',
      dataIndex: 'full_name',
      key: 'full_name',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: User) => (
        <Button
          type="link"
          danger
          onClick={() => handleRemoveUser(record.id)}
        >
          Remove
        </Button>
      ),
    },
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data: taskData, error: taskError } = await supabaseClient
          .from("task")
          .select("project_id")
          .eq("id", taskId)
          .single();

        if (taskError) {
          throw taskError;
        }

        const { data, error } = await supabaseClient
          .from("project_member")
          .select("id, company_user_id")
          .eq("project_id", taskData?.project_id);

        if (error) {
          throw error;
        }

        const companyUserIds = data.map((projectMember) => projectMember.company_user_id);

        const { data: companyUsers, error: companyUserError } = await supabaseClient
          .from("company_user")
          .select("id, profiles(full_name)")
          .in("id", companyUserIds);

        if (companyUserError) {
          throw companyUserError;
        }

        const usersWithFullNames = data.map((projectMember) => {
          const companyUser = companyUsers.find((cu) => cu.id === projectMember.company_user_id);
          return {
            id: projectMember.id,
            role: "", // You didn't provide the role column in the query, so I left it empty
            company_user_id: projectMember.company_user_id,
            full_name: companyUser?.profiles.full_name,
          };
        });

        setUsers(usersWithFullNames);
      } catch (error) {
        console.error("Error fetching users:", error.message);
      }
    };

    const fetchTaskMembers = async () => {
      try {
        const { data: taskMembersData, error: taskMembersError } = await supabaseClient
          .from("task_member")
          .select("project_member_id")
          .eq("task_id", taskId);

        if (taskMembersError) {
          throw taskMembersError;
        }

        setTaskMembers(taskMembersData.map((taskMember) => taskMember.project_member_id));
      } catch (error) {
        console.error("Error fetching task members:", error.message);
      }
    };

    fetchTaskMembers();
    fetchUsers();
  }, [taskId]);

  const handleSave = async () => {
    try {
      const { form } = formProps;
      const selectedUserIds = form.getFieldValue("userIds");

      const insertTasks = selectedUserIds.map((userId) =>
        supabaseClient.from("task_member").insert({ task_id: taskId, project_member_id: userId })
      );

      const insertResults = await Promise.all(insertTasks);

      insertResults.forEach((result) => {
        if (result.error) {
          throw result.error;
        }
      });

      // Update the users state with the new data
      const { data: taskData, error: taskError } = await supabaseClient
        .from("task")
        .select("project_id")
        .eq("id", taskId)
        .single();

      if (taskError) {
        throw taskError;
      }

      const { data, error } = await supabaseClient
        .from("project_member")
        .select("id, company_user_id")
        .eq("project_id", taskData?.project_id);

      if (error) {
        throw error;
      }

      const companyUserIds = data.map((projectMember) => projectMember.company_user_id);

      const { data: companyUsers, error: companyUserError } = await supabaseClient
        .from("company_user")
        .select("id, profiles(full_name)")
        .in("id", companyUserIds);

      if (companyUserError) {
        throw companyUserError;
      }

      const updatedUsers = data.map((projectMember) => {
        const companyUser = companyUsers.find((cu) => cu.id === projectMember.company_user_id);
        return {
          id: projectMember.id,
          role: "", // You didn't provide the role column in the query, so I left it empty
          company_user_id: projectMember.company_user_id,
          full_name: companyUser?.profiles.full_name,
        };
      });

      setUsers(updatedUsers);
    } catch (error) {
      console.error("Error inserting users:", error.message);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      const { error } = await supabaseClient
        .from("task_member")
        .delete()
        .eq("task_id", taskId)
        .eq("project_member_id", userId);

      if (error) {
        throw error;
      }

      // Update the users state with the new data
      const updatedUsers = users.filter((user) => user.id !== userId);
      setUsers(updatedUsers);

      // Update the taskMembers state with the new data
      const updatedTaskMembers = taskMembers.filter((id) => id !== userId);
      setTaskMembers(updatedTaskMembers);
    } catch (error) {
      console.error("Error removing user:", error.message);
    }
  };

  const filteredUsers = users.filter((user) => taskMembers.includes(user.id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Form {...formProps} layout="vertical" style={{ width: "100%" }} initialValues={initialValues}>
        <Form.Item
          label="Select Users"
          name="userIds"
          rules={[{ required: true, message: "Please select at least one user" }]}
        >
          <Select
            className="kanban-users-form-select"
            dropdownStyle={{ padding: "0px" }}
            style={{ width: "100%" }}
            mode="multiple"
            placeholder="Select users"
          >
            {users.map((user) => (
              <Select.Option key={user.id} value={user.id}>
                {user.full_name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
      <Space style={{ justifyContent: "flex-end" }}>
        <Button type="default" onClick={cancelForm}>
          Cancel
        </Button>
        <Button {...saveButtonProps} type="primary" onClick={handleSave}>
          Save
        </Button>
      </Space>
      <Table
        dataSource={filteredUsers}
        columns={columns}
        rowKey="id"
        pagination={false}
        style={{ marginTop: '16px' }}
        bordered
        size="small"
      />
    </div>
  );
};