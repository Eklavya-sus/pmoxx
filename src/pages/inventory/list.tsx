import { List, useTable, FilterDropdown, useSelect } from "@refinedev/antd";
import { BaseRecord, CrudFilters, getDefaultFilter, useGetIdentity } from "@refinedev/core";
import { Space, Table, Input, Button, Select, Modal } from "antd";
import { supabaseClient } from "../../utility";
import { useEffect, useState } from "react";
import { DateField } from "@refinedev/antd";
import { useCompanyId } from "../../components/layout/current-company/index";
import { InventoryLogModal } from "./InventoryLogs";

interface IInventoryRecord extends BaseRecord {
  name: string;
  unit: string;
  quantity: number;
  price: number;
  expiry_date: string;
  location: string;
  last_updated: string;
  supplier: string;
  category: string;
  project_id: string;
  inventory_id: number;
}
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

export const InventoryList = () => {
  const [filters, setFilters] = useState<CrudFilters>([]);
  const [projectFilters, setProjectFilters] = useState<CrudFilters>([]);
  const [projects, setProjects] = useState<{ label: string; value: string }[]>([]);
  const [projectsMap, setProjectsMap] = useState<{ [key: string]: string }>({});
  const [companyId] = useCompanyId();
  const [selectedQuantity, setSelectedQuantity] = useState<number | null>(null);
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [selectedInventoryId, setSelectedInventoryId] = useState<number | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState<IInventoryRecord | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [inputQuantity, setInputQuantity] = useState<number | null>(null);
  const { data: user } = useGetIdentity<IUser>();

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch projects
        const { data: projectsData, error: projectsError } = await supabaseClient.from("project").select("id, name").eq("company_id", companyId);
        if (projectsError) {
          throw projectsError;
        }
        if (projectsData) {
          const projectOptions = projectsData.map((project: any) => ({
            label: project.name,
            value: project.id,
          }));
          setProjects(projectOptions);
          const projectMap = projectsData.reduce((map: any, project: any) => {
            map[project.id] = project.name;
            return map;
          }, {});
          setProjectsMap(projectMap);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
    
    fetchData();
  }, [companyId]);

  useEffect(() => {
    if (companyId !== undefined) {
      setFilters([
        ...filters,
        {
          field: "company_id",
          operator: "eq",
          value: companyId.toString(),
        },
      ]);
    }
  }, [companyId]);

  const { tableProps, searchFormProps } = useTable<IInventoryRecord>({
    syncWithLocation: true,
    resource: "inventory",
    filters: {
      permanent: [...filters, ...projectFilters],
    },
  });

  const unitOptions = [
    "kg",
    "gram",
    "liter",
    "milliliter",
    "meter",
    "square meter",
    "cubic meter",
  ];

  const { selectProps: unitSelectProps } = useSelect<IInventoryRecord>({
    resource: "inventory",
    options: unitOptions.map((unit) => ({ label: unit, value: unit })),
    defaultValue: getDefaultFilter("unit", filters),
  });

  const projectSelectProps = {
    value: projectFilters.find((filter) => filter.field === "project_id")?.value,
    onChange: (value: string) => {
      setProjectFilters([
        {
          field: "project_id",
          operator: "eq",
          value,
        },
      ]);
    },
    options: projects,
  };

  const openTaskModal = async (record: IInventoryRecord) => {
    try {
      setSelectedTaskId(null);
      const { data: tasksData, error: tasksError } = await supabaseClient
        .from("task")
        .select("*")
        .eq("project_id", record.project_id);

      if (tasksError) {
        throw tasksError;
      }

      if (tasksData) {
        setSelectedRecord(record);
        setShowTaskModal(true);
        setTaskOptions(tasksData.map((task: any) => ({
          label: task.name,
          value: task.id,
        })));
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const handleSelectTask = (taskId: string) => {
    setSelectedTask(taskId);
    setShowTaskModal(false);
    setShowQuantityModal(true);
  };
  const [taskOptions, setTaskOptions] = useState<{ label: string; value: string }[]>([]);

  const handleSelectQuantity = (record: IInventoryRecord) => {
    if (inputQuantity !== null && inputQuantity > record.quantity) {
      Modal.error({
        title: 'Error',
        content: 'Cannot assign more than the available inventory quantity',
      });
      return;
    }
    setSelectedQuantity(inputQuantity);
    setShowQuantityModal(false);
    handleAssignToTask(record, inputQuantity);
    setSelectedQuantity(null);
    setInputQuantity(null); // Reset inputQuantity to null
  };
  
  const handleAssignToTask = async (record: IInventoryRecord, quantity: number | null) => {
    if (selectedTask && quantity !== null) {
      try {
        // Update inventory first
        const { data, error: updateError } = await supabaseClient
          .from("inventory")
          .select("quantity")
          .eq("inventory_id", record.inventory_id)
          .single();

        if (updateError) {
          throw updateError;
        }

        const currentQuantity = data?.quantity || 0;
        const newQuantity = currentQuantity - quantity;

        const { error: updateQuantityError } = await supabaseClient
          .from("inventory")
          .update({ quantity: newQuantity })
          .eq("inventory_id", record.inventory_id);

        if (updateQuantityError) {
          throw updateQuantityError;
        }

        // Check if task is 'wasted'
        if (selectedTask === 'wasted') {
          // Insert into inventory_task_log with task_id as null
          const { error: logError } = await supabaseClient
            .from("inventory_task_log")
            .insert([
              {
                inventory_id: record.inventory_id,
                task_id: null,
                quantity,
                user_id: user?.id,
              },
            ]);

          if (logError) {
            throw logError;
          }

          console.log("Inventory wasted successfully");
          Modal.success({
            title: 'Success',
            content: 'Inventory wasted successfully',
          });
        } else {
          // Insert into inventory_task
          const { error: insertError } = await supabaseClient
            .from("inventory_task")
            .insert([
              {
                inventory_id: record.inventory_id,
                task_id: selectedTask,
                quantity,
              },
            ]);

          if (insertError) {
            throw insertError;
          }

          // Insert into inventory_task_log
          const { error: logError } = await supabaseClient
            .from("inventory_task_log")
            .insert([
              {
                inventory_id: record.inventory_id,
                task_id: selectedTask,
                quantity,
                user_id: user?.id,
              },
            ]);

          if (logError) {
            throw logError;
          }

          console.log("Inventory assigned to task successfully");
          Modal.success({
            title: 'Success',
            content: 'Inventory assigned to task successfully',
          });
        }
      } catch (error) {
        console.error("Error assigning inventory to task:", error);
        Modal.error({
          title: 'Error',
          content: 'Failed to assign inventory to task',
        });
      } finally {
        setSelectedTask(null);
        setInputQuantity(null); // Reset inputQuantity to null
        setShowQuantityModal(false);
      }
    }
  };

  const handleShowLogModal = (inventoryId: number) => {
    setSelectedInventoryId(inventoryId);
    setShowLogModal(true);
  };
  const handleDeleteInventory = async (inventoryId: number) => {
    try {
      // Show a confirmation modal before deleting
      const confirmed = await Modal.confirm({
        title: 'Confirm Deletion',
        content: 'Are you sure you want to delete this inventory item?',
        okText: 'Delete',
        okType: 'danger',
        cancelText: 'Cancel',
        onOk: async () => {
          // Delete the inventory item from Supabase
          const { error } = await supabaseClient.from('inventory').delete().eq('inventory_id', inventoryId);

          if (error) {
            throw error;
          }

          // Show a success message
          Modal.success({
            title: 'Success',
            content: 'Inventory item deleted successfully',
          });
        },
      });
    } catch (error) {
      console.error('Error deleting inventory:', error);
      Modal.error({
        title: 'Error',
        content: 'Failed to delete inventory item',
      });
    }
  };

  return (
    <List>
      <Space style={{ marginBottom: 16 }}>
        <Select {...projectSelectProps} placeholder="Select project" style={{ minWidth: 200 }} />
      </Space>
      <Table {...tableProps} rowKey="inventory_id">
        <Table.Column
          dataIndex="name"
          title="Name"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="Search name"
                value={getDefaultFilter("name", filters)}
                onChange={(e) =>
                  setFilters(
                    getDefaultFilter("name", filters, e.target.value, "contains")
                  )
                }
              />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="unit"
          title="Unit"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select {...unitSelectProps.select} style={{ minWidth: 200 }}>
                {unitOptions.map((option) => (
                  <Select.Option key={option} value={option}>
                    {option}
                  </Select.Option>
                ))}
              </Select>
            </FilterDropdown>
          )}
        />
        <Table.Column dataIndex="quantity" title="Quantity" />
        <Table.Column
          dataIndex="price"
          title="Price"
          render={(value: number) => <span>${value.toFixed(2)}</span>}
        />
        <Table.Column
          dataIndex="last_updated"
          title="Last Updated"
          render={(value: string) => <DateField value={value} format="LLL" />}
        />
        <Table.Column
          dataIndex="supplier"
          title="Supplier"
          render={(supplierName: string) => supplierName || "Unknown"}
        />
        <Table.Column
          dataIndex="project_id"
          title="Project Name"
          render={(projectId: string) => projectsMap[projectId] || "Unknown"}
        />
        <Table.Column
          title="Actions"
          dataIndex="actions"
          render={(_: any, record: IInventoryRecord) => (
            <Space>
              <Button type="primary" size="small" onClick={() => openTaskModal(record)}>
                Assign to Task
              </Button>
              <Button type="default" size="small" onClick={() => handleShowLogModal(record.inventory_id)}>
                Show Log
              </Button>
              <Button type="danger" size="small" onClick={() => handleDeleteInventory(record.inventory_id)}>
                Delete
              </Button>
            </Space>
          )}
        />
      </Table>
      <Modal
        title="Select Task"
        visible={showTaskModal}
        onCancel={() => setShowTaskModal(false)}
        footer={null}
      >
        <Select
          placeholder="Select a task"
          onChange={handleSelectTask}
          value={selectedTaskId}
          options={[
            ...taskOptions,
            { label: 'Wasted', value: 'wasted' },
          ]}
        >
          <Select.Option key="wasted" value="wasted">
            Wasted
          </Select.Option>
        </Select>
      </Modal>

      <Modal
        title="Enter Quantity"
        visible={showQuantityModal}
        onCancel={() => setShowQuantityModal(false)}
        onOk={() => {
          if (selectedRecord) {
            handleSelectQuantity(selectedRecord);
          }
        }}
      >
        <Input
          type="number"
          placeholder="Enter quantity"
          min={0}
          max={selectedRecord?.quantity}
          value={inputQuantity || ''} // Use inputQuantity as the controlled value
          onChange={(e) => setInputQuantity(parseInt(e.target.value, 10) || null)}
        />
      </Modal>

      <InventoryLogModal
        inventoryId={selectedInventoryId || 0}
        visible={showLogModal}
        onClose={() => setShowLogModal(false)}
      />
    </List>
  );
};