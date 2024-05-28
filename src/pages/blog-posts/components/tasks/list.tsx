import { FC, PropsWithChildren, useEffect, useMemo } from "react";
import {
  HttpError,
  useDelete,
  useList,
  useNavigation,
  useUpdate,
  useUpdateMany,
} from "@refinedev/core";

import { CheckCircleFilled, CheckCircleOutlined, ClearOutlined, DeleteOutlined, EditOutlined, MoreOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Collapse, Dropdown, Menu, Select, Table, TableColumnsType, TableProps } from "antd";
import { supabaseClient } from "../../../../utility";
import { useCompanyId } from "../../../../components/layout/current-company/index";
import {  Form, Input, Modal, Checkbox } from 'antd';
import { useState } from 'react';
import { useParams } from "react-router-dom";
import { useModalForm } from "@refinedev/antd";
import SubtaskMembers from "../../../task/subTaskMembers";


type Task = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  max_progress: number | null;
  current_progress: number | null;
  unit: string | null;
  cost_per_unit: number | null;
  project_id: string;
  categoryId: string | null;
  subtasks: SubTask[];
};

type Category = {
  id: string;
  name: string;
  project_id: string;
};

type SubTask = {
  id: string;
  task_id: string;
  content: string;
  name: string;
  completed: boolean;
};

type CategoryRow = Category & {
  tasks: Task[];
};

export const ProjectTaskPage: FC<PropsWithChildren> = ({ children }) => {
  const { create, edit, replace } = useNavigation();
  const [companyId] = useCompanyId();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [subtaskCompletionStatus, setSubtaskCompletionStatus] = useState({});
  const [assignUsersModalVisible, setAssignUsersModalVisible] = useState(false);
  const [selectedSubtaskId, setSelectedSubtaskId] = useState('');
  const { id: projectId } = useParams();

  

  const { data: categories, isLoading: isLoadingCategories } = useList<Category>({
    resource: "category",
    pagination: {
      mode: "off",
    },
    sorters: [
      {
        field: "name",
        order: "asc",
      },
    ],
    filters: [
      {
        field: "project_id",
        operator: "eq",
        value: projectId,
      },
    ],
  });

  const { data: tasks, isLoading: isLoadingTasks } = useList<Task>({
    resource: "task",
    sorters: [
      {
        field: "start_date",
        order: "asc",
      },
    ],
    queryOptions: {
      enabled:!!categories,
    },
    pagination: {
      mode: "off",
    },
  });

  const { data: subtasks, isLoading: isLoadingSubtasks } = useList<SubTask>({
    resource: "sub_task",
    pagination: {
      mode: "off",
    },
    queryOptions: {
      enabled: !!tasks?.data, // Only fetch subtasks if tasks data is available
    },
  });

  const taskCategories = useMemo(() => {
    if (!tasks?.data ||!categories?.data)
      return {
        unassignedCategory: [],
        categories: [],
      };

    const unassignedCategory = tasks.data.filter((task) => task.categoryId === null);

    const grouped = categories.data.map((category) => ({
     ...category,
      tasks: tasks.data.filter((task) => task.categoryId?.toString() === category.id),
    }));

    return {
      unassignedCategory,
      categories: grouped,
    };
  }, [tasks, categories]);

  const getSubtasksForTask = (taskId: string) => {
    const taskSubtasks = (subtasks?.data ?? []).filter((subtask) => subtask.task_id === taskId);
    return taskSubtasks.map((subtask) => ({
      ...subtask,
      key: subtask.id,
      name: subtask.name,
      content: subtask.content,
    }));
  };

  const AssignUsersModal = ({ visible, onClose, subtaskId }) => {
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [users, setUsers] = useState([]);
  
    useEffect(() => {
      // Fetch task id for the subtask
      supabaseClient
       .from('sub_task')
       .select('task_id')
       .eq('id', subtaskId)
       .then((response) => {
          if (response.error) {
            console.error('Error fetching task id:', response.error);
          } else {
            const taskId = response.data[0].task_id;
  
            // Fetch task members for the task
            supabaseClient
             .from('task_member')
             .select('project_member_id, project_member:project_member(company_user(profiles(full_name)))')
             .eq('task_id', taskId)
             .then((response) => {
                if (response.error) {
                  console.error('Error fetching task members:', response.error);
                } else {
                  const users = response.data.map((taskMember) => ({
                    id: taskMember.project_member_id,
                    name: taskMember.project_member.company_user.profiles.full_name,
                  }));
                  setUsers(users);
                }
              });
          }
        });
    }, [subtaskId]);

    const handleAssign = async () => {
      try {
        // Insert the selected task members and subtask into the sub_task_member table
        const { error } = await supabaseClient
         .from('sub_task_member')
         .insert(
            selectedUsers.map((projectMemberId) => ({
              task_member_id: projectMemberId,
              sub_task_id: subtaskId,
            }))
          );
  
        if (error) {
          console.error('Error assigning users to subtask:', error);
        } else {
          console.log('Users assigned to subtask successfully');
          onClose(); // Close the modal after successful assignment
        }
      } catch (error) {
        console.error('Error assigning users to subtask:', error);
      }
    };

    return (
      <Modal
        title="Assign users"
        visible={visible}
        onCancel={onClose}
        onOk={handleAssign}
      >
        {Array.isArray(users)? (
          <Select
            mode="multiple"
            value={selectedUsers}
            onChange={(values) => setSelectedUsers(values)}
            style={{ width: '100%' }}
          >
            {users.map((user) => (
              <Select.Option key={user.id} value={user.id}>
                {user.name}
              </Select.Option>
            ))}
          </Select>
        ) : (
          <div>Loading users...</div>
        )}
      </Modal>
    );
  };

  const handleAssignUsers = (subtaskId: number) => {
    setSelectedSubtaskId(subtaskId);
    setAssignUsersModalVisible(true);
  };
  
  const handleCloseAssignUsersModal = () => {
    setAssignUsersModalVisible(false);
  };
  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      const { error } = await supabaseClient
        .from('sub_task')
        .delete()
        .eq('id', subtaskId);

      if (error) {
        console.error('Error deleting subtask:', error);
      } else {
        console.log('Subtask deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting subtask:', error);
    }
  };

  const { mutate: updateTask } = useUpdate<Task, HttpError, Task>();
  const { mutate: updateManyTask } = useUpdateMany();
  const { mutate: deleteTask } = useDelete();
  const { mutate: deleteCategory } = useDelete();
  

  const handleEditTask = (args: { taskId: string }) => {
    edit("tasks", args.taskId);
  };

  const handleDeleteTask = (args: { taskId: string }) => {
    deleteTask({
      resource: "task",
      id: args.taskId,
      successNotification: () => ({
        key: "delete-task",
        type: "success",
        message: "Successfully deleted task",
        description: "Successful",
      }),
    });
  };

  const handleEditCategory = (args: { categoryId: string }) => {
    edit("category", args.categoryId);
  };

  const handleDeleteCategory = (args: { categoryId: string }) => {
    deleteCategory({
      resource: "category",
      id: args.categoryId,
      successNotification: () => ({
        key: "delete-category",
        type: "success",
        message: "Successfully deleted category",
        description: "Successful",
      }),
    });
  };

  
  const handleAddCard = (args: { categoryId: string }) => {
    const path =
      args.categoryId === "unassigned"
       ? "create"
        : `create?categoryId=${args.categoryId}`;

    replace(path);
  };

  const handleClearCards = (args: { taskIds: string[] }) => {
    updateManyTask({
      resource: "task",
      ids: args.taskIds,
      values: {
        categoryId: null,
      },
      successNotification: false,
    });
  };

  const { modalProps, formProps, show } = useModalForm({
    action: "create",
    resource: "category",
    onMutationSuccess: () => {
      // You can add any additional logic here after successful mutation
    },
    successNotification: () => ({
      key: "create-category",
      type: "success",
      message: "Successfully created category",
      description: "Successful",
    }),
  });

  const handleSubmit = async (values: any) => {
    try {
      const { name } = values;
      const { data, error } = await supabaseClient
        .from('category')
        .insert({ name, project_id: projectId, company_id: companyId });

      formProps.onFinish?.({});
      window.location.reload();
    } catch (error) {
      
    }
  };

  const handleCreateCategory = () => {
    show();
  };

  const handleAddSubtask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsModalOpen(true);
  };
  

  const SubtaskModal = () => {
    const [form] = Form.useForm();
    const [completed, setCompleted] = useState(false);
  
    const handleOk = () => {
      form.validateFields().then((values) => {
        const newSubtask = {
          task_id: selectedTaskId,
          content: values.content,
          name: values.name,
          completed,
        };
  
        supabaseClient
          .from('sub_task')
          .insert(newSubtask)
          .then((data) => {
            console.log(`Subtask created`);
            setIsModalOpen(false);
            setSelectedTaskId('');
            form.resetFields();
            setCompleted(false);
          });
      });
    };
  
    const handleCancel = () => {
      setIsModalOpen(false);
      setSelectedTaskId('');
      setCompleted(false);
    };
  
    const handleCompletedChange = (e) => {
      setCompleted(e.target.checked);
    };
  
    return (
      <Modal
        title="Add Subtask"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter a name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="content"
            label="Content"
            rules={[{ required: true, message: 'Please enter content' }]}
          >
            <Input.TextArea />
          </Form.Item>
          <Form.Item>
            <Checkbox checked={completed} onChange={handleCompletedChange}>
              Completed
            </Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    );
  };

  const handleSubtaskCompletionChange = (subtaskId: string, completed: boolean) => {
    // Update the local state first
    setSubtaskCompletionStatus((prevStatus) => ({
      ...prevStatus,
      [subtaskId]: completed,
    }));
  
    // Update the database
    supabaseClient
      .from('sub_task')
      .update({ completed })
      .eq('id', subtaskId)
      .then(() => {
        console.log(`Subtask ${subtaskId} completion status updated`);
      });
  };
  
  const getContextMenuItems = (row: CategoryRow) => {
    const hasItems = row.tasks.length > 0;

    const items = [
      {
        label: "Edit category",
        key: "1",
        icon: <EditOutlined />,
        onClick: () => handleEditCategory({ categoryId: row.id }),
      },
      {
        label: "Clear all cards",
        key: "2",
        icon: <ClearOutlined />,
        disabled:!hasItems,
        onClick: () =>
          handleClearCards({
            taskIds: row.tasks.map((task) => task.id),
          }),
      },
      {
        danger: true,
        label: "Delete category",
        key: "3",
        icon: <DeleteOutlined />,
        disabled: hasItems,
        onClick: () => handleDeleteCategory({ categoryId: row.id }),
      },
    ];

    return items;
  };

  const getTaskContextMenuItems = (task: Task) => {
    const items = [
      {
        label: "Edit task",
        key: "1",
        icon: <EditOutlined />,
        onClick: () => handleEditTask({ taskId: task.id }),
      },
      {
        danger: true,
        label: "Delete task",
        key: "2",
        icon: <DeleteOutlined />,
        onClick: () => handleDeleteTask({ taskId: task.id }),
      },
      {
      label: "Add subtask",
      key: "3",
      icon: <PlusOutlined />,
      onClick: () => handleAddSubtask(task.id),
    },
    ];

    return items;
  };

  const columns: TableProps<Task>["columns"] = [
    {
      title: "Task Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Start Date",
      dataIndex: "start_date",
      key: "start_date",
      render: (date: string) => (
        <span style={{ color: date? "green" : "red" }}>{date}</span>
      ),
    },
    {
      title: "End Date",
      dataIndex: "end_date",
      key: "end_date",
      render: (date: string) => (
        <span style={{ color: date? "green" : "red" }}>{date}</span>
      ),
    },
    {
      title: "Max Progress",
      dataIndex: "max_progress",
      key: "max_progress",
    },
    {
      title: "Current Progress",
      dataIndex: "current_progress",
      key: "current_progress",
    },
    {
      title: "Unit",
      dataIndex: "unit",
      key: "unit",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (_, record) => {
        if (record.current_progress === null) {
          return "Not started";
        } else if (record.current_progress < record.max_progress) {
          return "In Progress";
        } else {
          return "Completed";
        }
      },
    },
    {
      title: "Cost per Unit",
      dataIndex: "cost_per_unit",
      key: "cost_per_unit",
    },
    
    {
      title: "Actions",
      key: "actions",
      render: (task: Task) => (
        <Dropdown
          trigger={["click"]}
          menu={{
            items: getTaskContextMenuItems(task),
            onClick: (e) => e.domEvent.stopPropagation(),
          }}
          placement="bottomRight"
        >
          <Button
            type="text"
            shape="circle"
            icon={<MoreOutlined style={{ transform: "rotate(90deg)" }} />}
          />
        </Dropdown>
      ),
    },
    {
      title: "Subtasks",
      key: "subtasks",
      render: (task: Task) => (
        <a>
          {getSubtasksForTask(task.id).length} Subtask(s)
        </a>
      ),
    },
  ];

  const isLoading = isLoadingTasks || isLoadingCategories;



  return (
    <div>
      <Button type="primary" onClick={handleCreateCategory}>
        Create Category
      </Button>
      <Modal {...modalProps} title="Create Category" width={512}>
        <Form {...formProps} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Please enter a name" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
      {taskCategories.categories.map((category) => (
        <div key={category.id}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2>{category.name}</h2>
            <div>
              <Dropdown
                trigger={["click"]}
                menu={{
                  items: getContextMenuItems(category),
                  onClick: (e) => e.domEvent.stopPropagation(),
                }}
                placement="bottomRight"
              >
                <Button
                  type="text"
                  shape="circle"
                  icon={<MoreOutlined style={{ transform: "rotate(90deg)" }} />}
                />
              </Dropdown>
              <Button type="primary" onClick={() => handleAddCard({ categoryId: category.id })}>
                Add Task
              </Button>
              <SubtaskModal />
              
            </div>
          </div>
          <Table
  columns={columns}
  dataSource={category.tasks}
  loading={isLoading}
  rowKey={(record) => record.id}
  expandable={{
    expandedRowRender: (record) => {
      const subtaskColumns: TableColumnsType<SubTask & { key: string }> = [
        {
          title: 'Subtask Name',
          dataIndex: 'name',
          key: 'name',
        },
        {
          title: 'Content',
          dataIndex: 'content',
          key: 'content',
        },
     {
  title: 'Completed',
  dataIndex: 'completed',
  key: 'completed',
  render: (_, record: SubTask & { key: string }) => {
    const handleCompletionChange = (value: boolean) => {
      handleSubtaskCompletionChange(record.key, value);
    };

    const completedStatus = subtaskCompletionStatus[record.key] !== undefined
      ? subtaskCompletionStatus[record.key]
      : record.completed;

    return (
      <Select
        value={completedStatus}
        onChange={handleCompletionChange}
        style={{ width: 120 }}
      >
        <Select.Option value={true}>True</Select.Option>
        <Select.Option value={false}>False</Select.Option>
      </Select>
    );
  },
},
{
  title: 'Assigned Users',
  key: 'assignedUsers',
  render: (_, record: SubTask & { key: string }) => (
    <SubtaskMembers subtaskId={record.id} />
  ),
},
{
  title: 'Assign to users',
  key: 'assign',
  render: (_, record: SubTask & { key: string }) => (
    <Button type="primary" onClick={() => handleAssignUsers(record.key)}>
      Assign to users
    </Button>
  ),
},
{
  title: 'Actions',
  key: 'actions',
  render: (_, record: SubTask & { key: string }) => (
    <Button
      type="link"
      danger
      onClick={() => handleDeleteSubtask(record.key)}
    >
      Delete
    </Button>
  ),
},
      ];

      return (
        <div>
          <Table
            columns={subtaskColumns}
            dataSource={getSubtasksForTask(record.id)}
            pagination={false}
            rowKey="id"
          />
          {assignUsersModalVisible && (
            <AssignUsersModal
              visible={assignUsersModalVisible}
              onClose={handleCloseAssignUsersModal}
              subtaskId={selectedSubtaskId}
            />
          )}
        </div>
      );
    },
  }}
/>
          
        </div>
      ))}
    </div>
  );
};

const TableSkeleton = () => {
  const rowCount = 6;

return (
  <div>
    <Button type="primary">
      Create Category
    </Button>
    {Array.from({ length: rowCount }).map((_, index) => (
      <div key={index}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2>Skeleton Category</h2>
          <div>
            <Button type="text" shape="circle" icon={<MoreOutlined style={{ transform: "rotate(90deg)" }} />} />
            <Button type="primary">Add Task</Button>
          </div>
        </div>
        <Table
          columns={[
            {
              title: "Task Name",
              dataIndex: "name",
              key: "name",
            },
            {
              title: "Start Date",
              dataIndex: "start_date",
              key: "start_date",
              render: (date: string) => (
                <span style={{ color: date? "green" : "red" }}>{date}</span>
              ),
            },
            {
              title: "End Date",
              dataIndex: "end_date",
              key: "end_date",
              render: (date: string) => (
                <span style={{ color: date? "green" : "red" }}>{date}</span>
              ),
            },
            {
              title: "Max Progress",
              dataIndex: "max_progress",
              key: "max_progress",
            },
            {
              title: "Current Progress",
              dataIndex: "current_progress",
              key: "current_progress",
            },
            {
              title: "Unit",
              dataIndex: "unit",
              key: "unit",
            },
            {
              title: "Cost per Unit",
              dataIndex: "cost_per_unit",
              key: "cost_per_unit",
            },
            {
              title: "Actions",
              key: "actions",
              render: () => (
                <Dropdown
                  trigger={["click"]}
                  menu={{
                    items: [],
                    onClick: (e) => e.domEvent.stopPropagation(),
                  }}
                  placement="bottomRight"
                >
                  <Button
                    type="text"
                    shape="circle"
                    icon={<MoreOutlined style={{ transform: "rotate(90deg)" }} />}
                  />
                </Dropdown>
              ),
            },
          ]}
          dataSource={[]}
          loading={true}
          rowKey={(record) => record.id}
        />
      </div>
    ))}
  </div>
);
};