import { useState, useEffect } from 'react';
import { Select, Button, Table, Input } from 'antd';
import { supabaseClient } from '../../../utility';
import { useParams } from 'react-router-dom';
import { useGetIdentity } from '@refinedev/core';
import { useCompanyId } from "../../../components/layout/current-company";

const { Option } = Select;

interface CompanyUser {
  user_id: string;
  full_name: string;
  salary_per_day: number | null;
}

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

const fetchProjectMembers = async (projectId) => {
  try {
    // Fetch the project members with salary_per_day
    const { data, error } = await supabaseClient
      .from('project_member')
      .select('company_user_id, company_user(user_id, profiles(full_name)), salary_per_day')
      .eq('project_id', projectId);

    if (error) {
      throw error;
    }

    const membersData = data.map((member) => ({
      user_id: member.company_user_id,
      full_name: member.company_user.profiles.full_name,
      salary_per_day: member.salary_per_day || null, // Set salary_per_day or null if it's not present
    }));

    return membersData;
  } catch (error) {
    console.error('Error fetching project members:', error);
    return [];
  }
};

export const AddProjectMembers = () => {
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [projectMembers, setProjectMembers] = useState<CompanyUser[]>([]);
  const { id: projectId } = useParams();
  const { data: user } = useGetIdentity<IUser>();
  const [companyId] = useCompanyId();

  useEffect(() => {
    const fetchCompanyUsers = async () => {
      try {
        // Fetch the company_id from the company_user table
        const { data: companyUserData, error: companyUserError } = await supabaseClient
          .from("company_user")
          .select("company_id")
          .eq("user_id", user?.id)
          .single();

        if (companyUserError) {
          console.error("Error fetching company_id:", companyUserError);
          return;
        }

        const companyId = companyUserData?.company_id;

        // Fetch the list of company users with their full names
        const { data, error } = await supabaseClient
          .from('company_user')
          .select('user_id, profiles(full_name)')
          .eq('company_id', companyId);

        if (error) {
          throw error;
        }

        setCompanyUsers(data.map((user) => ({ user_id: user.user_id, full_name: user.profiles.full_name })));
      } catch (error) {
        console.error('Error fetching company users:', error);
      }
    };

    fetchCompanyUsers();
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      const membersData = await fetchProjectMembers(projectId);
      setProjectMembers(membersData);
    };

    fetchData();
  }, [projectId]);

  const handleUserSelect = (userIds: string[]) => {
    setSelectedUsers(userIds);
  };

  const handleAddMembers = async () => {
    try {
      // Fetch the id for each user_id in selectedUsers
      const companyUserIds = await Promise.all(
        selectedUsers.map(async (userId) => {
          const { data, error } = await supabaseClient
            .from('company_user')
            .select('id')
            .eq('user_id', userId)
            .single();

          if (error) {
            throw error;
          }

          return data?.id;
        })
      );

      // Insert into project_member table using companyUserIds
      const { error } = await supabaseClient.from('project_member').insert(
        companyUserIds.map((companyUserId) => ({
          company_user_id: companyUserId,
          project_id: projectId,
          role: 'member',
          company_id: companyId,
        }))
      );

      if (error) {
        throw error;
      }

      console.log('Members added successfully');

      // Reset the selected users after successful addition
      setSelectedUsers([]);

      // Refetch the project members
      const membersData = await fetchProjectMembers(projectId);
      setProjectMembers(membersData);
    } catch (error) {
      console.error('Error adding project members:', error);
    }
  };

  const SalaryInput = ({ salary_per_day, userId, onSalaryChange }) => {
    const [value, setValue] = useState(salary_per_day || '');

    const handleChange = (e) => {
      setValue(e.target.value);
    };

    const handleBlur = async () => {
      try {
        const parsedValue = parseFloat(value);
        if (!isNaN(parsedValue)) {
          await onSalaryChange(userId, parsedValue);
        }
      } catch (error) {
        console.error('Error updating salary:', error);
      }
    };

    return <Input value={value} onChange={handleChange} onBlur={handleBlur} />;
  };

  const handleSalaryChange = async (userId, salary_per_day) => {
    try {
      const { error } = await supabaseClient
        .from('project_member')
        .update({ salary_per_day })
        .eq('company_user_id', userId)
        .eq('project_id', projectId);

      if (error) {
        throw error;
      }

      // Update the projectMembers state with the new salary_per_day value
      setProjectMembers((prevMembers) =>
        prevMembers.map((member) =>
          member.user_id === userId
            ? { ...member, salary_per_day }
            : member
        )
      );
    } catch (error) {
      console.error('Error updating salary:', error);
    }
  };

  const handleDeleteMember = async (userId) => {
    try {
      const { error } = await supabaseClient
        .from('project_member')
        .delete()
        .eq('company_user_id', userId)
        .eq('project_id', projectId);

      if (error) {
        throw error;
      }

      // Update the projectMembers state after successful deletion
      setProjectMembers((prevMembers) =>
        prevMembers.filter((member) => member.user_id !== userId)
      );
    } catch (error) {
      console.error('Error deleting project member:', error);
    }
  };

  const columns = [
    {
      title: 'Project Members',
      dataIndex: 'full_name',
      key: 'full_name',
    },
    {
      title: 'Salary Per Day',
      dataIndex: 'salary_per_day',
      key: 'salary_per_day',
      render: (salary_per_day, record) => (
        <SalaryInput
          salary_per_day={salary_per_day}
          userId={record.user_id}
          onSalaryChange={handleSalaryChange}
        />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (text, record) => (
        <Button onClick={() => handleDeleteMember(record.user_id)}>
          Delete
        </Button>
      ),
    },
  ];
  return (
    <div>
      <Select
        mode="multiple"
        style={{ width: '100%' }}
        placeholder="Select users to add as project members"
        onChange={handleUserSelect}
        optionLabelProp="label"
      >
        {companyUsers.map((user) => (
          <Option key={user.user_id} value={user.user_id} label={user.full_name}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {user.full_name}
            </div>
          </Option>
        ))}
      </Select>
      <Button type="primary" onClick={handleAddMembers} style={{ marginTop: '16px' }}>
        Add Members
      </Button>
      <Table columns={columns} dataSource={projectMembers} style={{ marginTop: '16px' }} />
    </div>
  );
};