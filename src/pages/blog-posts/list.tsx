import { DateField, DeleteButton, EditButton, List, ShowButton, useTable } from "@refinedev/antd";
import { BaseRecord, CrudFilters, useGetIdentity } from "@refinedev/core";
import { Space, Table } from "antd";
import { supabaseClient } from "../../utility";
import { useEffect, useState } from "react";
import { useCompanyId } from "../../components/layout/current-company/index"; 
import { authProvider } from "../../authProvider";


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

interface IProjectRecord extends BaseRecord {
  name: string;
  address: string;
  city: string;
  start_date: string;
  end_date: string;
  value: number;
  document: string;
  company_id: number;
}

export const BlogPostList = () => {
  const { data: user } = useGetIdentity<IUser>();
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CrudFilters>([]);
  const [companyUserId, setCompanyUserId] = useState<string | undefined>(undefined);
  const [projectIds, setProjectIds] = useState<string[]>([]);
  // Use the custom hook to fetch the company ID
  const [companyId] = useCompanyId();
  const [role, setRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchCompanyUser = async () => {
      try {
        const { data, error } = await supabaseClient
          .from('company_user')
          .select('id')
          .eq('user_id', user?.id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setCompanyUserId(data.id);
        }
      } catch (error) {
        console.error("Error fetching company user:",);
        setError("Error fetching company user");
      }
    };

    if (user?.id) {
      fetchCompanyUser();
    }
  }, [user]);

  

  useEffect(() => {
    // Fetch the role from the authProvider
    const fetchRole = async () => {
      try {
        const role = await (authProvider.getPermissions as Function)();
        setRole(role);
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };

    fetchRole();
  }, []);


  useEffect(() => {
    const fetchProjectIds = async () => {
      try {
        const { data: projectMembers, error } = await supabaseClient
          .from("project_member")
          .select("project_id")
          .eq("company_user_id", companyUserId);

        if (error) {
          throw error;
        }

        if (projectMembers) {
          const ids = projectMembers.map((member) => member.project_id);
          setProjectIds(ids);
        }
      } catch (error) {
        console.error("Error fetching project ids:");
      }
    };

    if (companyUserId) {
      fetchProjectIds();
    }
  }, [companyUserId]);


  useEffect(() => {
    if (role === 'employee') {
      setFilters([
        {
          field: "id",
          operator: "in",
          value: projectIds,
        },
        {
          field: "company_id",
          operator: "eq",
          value: companyId,
        },
      ]);
    } else {
      setFilters([
        {
          field: "company_id",
          operator: "eq",
          value: companyId,
        },
      ]);
    }
  }, [role, projectIds, companyId]);

  const { tableProps } = useTable<IProjectRecord>({
    syncWithLocation: true,
    resource: "project",
    filters: {
      permanent: filters,
    },
  });

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column title="Serial No." render={(_value, _record, index) => index + 1} />
        <Table.Column dataIndex="name" title="Project Name" />
        <Table.Column dataIndex="address" title="Address" />
        <Table.Column dataIndex="city" title="City" />
        <Table.Column
          dataIndex="start_date"
          title="Start Date"
          render={(value: string) => <DateField value={value} />}
        />
        <Table.Column
          dataIndex="end_date"
          title="End Date"
          render={(value: string) => <DateField value={value} />}
        />
        <Table.Column dataIndex="value" title="Value of Project" />
        
        <Table.Column
          title="Actions"
          dataIndex="actions"
          render={(_: any, record: IProjectRecord) => (
            <Space>
              <EditButton hideText size="small" recordItemId={record.id} />
              <ShowButton hideText size="small" recordItemId={record.id} />
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
