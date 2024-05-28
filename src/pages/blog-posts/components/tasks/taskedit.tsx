import React, { useState, useEffect } from'react';
import { useModal } from '@refinedev/antd';
import { useNavigation, useGetIdentity } from '@refinedev/core';
import { useNavigate, useParams } from'react-router-dom';
import { Button, Drawer, Space, Typography, Progress, Form, InputNumber, Select, Table, Input, Avatar } from 'antd';
import {  DescriptionForm, DueDateForm, TitleForm, UsersForm } from '../../../task/components/forms';
import { Accordion, DescriptionHeader, DueDateHeader } from '../../../task/components';
import { AlignLeftOutlined, CheckOutlined, CalendarOutlined, InfoOutlined, PlusOutlined, CommentOutlined, SendOutlined } from '@ant-design/icons';
import { supabaseClient } from '../../../../utility';
import { ShoppingCartOutlined } from '@ant-design/icons';
import styled from'styled-components';

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

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
}

const StyledDrawer = styled(Drawer)`
 .ant-drawer-header {
    padding: 16px 24px;
  }

 .ant-drawer-body {
    padding: 24px;
  }
`;

const HeaderButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const ProgressSection = styled.div`
  margin-bottom: 16px;
`;

interface CommentInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
}

const CommentInput: React.FC<CommentInputProps> = ({ value, onChange, onSubmit }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = () => {
    onSubmit(value);
    onChange(""); // Clear the input field after submitting
  };
  

  const handleCommentSubmit = async (commentValue: any) => {
    if (typeof commentValue ==='string' && commentValue.trim()) {
      try {
        const { data, error } = await supabaseClient
      .from("task_comment")
      .insert([{ task_id: taskId, content: commentValue.trim(), user_id: specificUserId,  }]);
  
        if (error) {
          console.error("Error adding comment:", error.message);
        } else {
          setComments([...comments, { content: commentValue.trim(), user_id: specificUserId, created_at: new Date().toISOString() }]);
        }
      } catch (error) {
        console.error("Error adding comment:", error);
      }
    }
  
    if (file) {
      setUploading(true);
      try {
        console.log('Uploading file:', file);
        const { data: fileUploadData, error: fileUploadError } = await supabaseClient.storage
         .from("avatars")
         .upload(`${file.name}`, file, {
            cacheControl: '3600',
            upsert: false,
          });
       
          const { data } = supabaseClient
  .storage
  .from('avatars')
  .getPublicUrl(`${file.name}`)
  console.log(data.publicUrl)

        if (fileUploadError) {
          console.error("Error uploading file:", fileUploadError.message);
        } else {
          const { data: fileInsertData, error: fileInsertError } = await supabaseClient
        .from("task_comment")
        .insert([
              {
                file_paths: data.publicUrl,
                task_id: taskId,
                content: "test",
                user_id: specificUserId
              },
            ]);
  
          if (fileInsertError) {
            console.error("Error inserting file:", fileInsertError.message);
          }
        }
      } catch (error) {
        console.error("Error uploading file:", error);
      } finally {
        setUploading(false);
      }
    }
  };

  const { data: user } = useGetIdentity<IUser>();
  const specificUserId = user?.id; // Get the current user ID
  const [userProfiles, setUserProfiles] = useState<Profile[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const { id: taskId } = useParams();

  useEffect(() => {
    const fetchUserProfiles = async () => {
      try {
        const { data: profiles, error } = await supabaseClient
       .from('profiles')
       .select('*');

        if (error) {
          console.error('Error fetching user profiles:', error);
        } else {
          setUserProfiles(profiles);
        }
      } catch (error) {
        console.error('Error fetching user profiles:', error);
      }
    };

    fetchUserProfiles();
  }, []);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const { data: comments, error } = await supabaseClient
       .from('task_comment')
       .select('*')
       .eq('task_id', taskId)
       .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching comments:', error);
        } else {
          setComments(comments);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };

    fetchComments();
  }, [taskId]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <Input
          value={value}
          onChange={handleChange}
          placeholder="Add a comment..."
          prefix={<CommentOutlined style={{ marginRight: 8 }} />}
          suffix={
            <Button
              type="primary"
              shape="circle"
              icon={<SendOutlined />}
              onClick={handleSubmit}
              disabled={!value.trim()}
            />
          }
        />
        <input type="file" onChange={handleFileChange} />
        {uploading? (
          <Progress percent={50} />
        ) : (
          <Button type="primary" onClick={handleCommentSubmit}>
            Upload File
          </Button>
        )}
      </div>
      <div>
      {comments.map((comment, index) => {
  const profile = userProfiles.find((p) => p.id === comment.user_id);
  const timestamp = new Date(comment.created_at).toLocaleString();
  const fileUrl = comment.file_paths; // Get the file URL from the comment object

  return (
    <div key={index} style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
      <Avatar src={profile?.avatar_url} />
      <div style={{ marginLeft: "8px" }}>
        <div>{profile?.full_name || 'Unknown User'}</div>
        <div>{comment.content}</div>
        {fileUrl && (
          <div>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              View File
            </a>
          </div>
        )}
        <div style={{ fontSize: "12px", color: "#888" }}>{timestamp}</div>
      </div>
    </div>
  );
})}
      </div>
    </div>
  );
};
export const ProjectTaskEdit: React.FC = () => {
  const { list } = useNavigation();
  const { data: user } = useGetIdentity<IUser>();
  const specificUserId = user?.id; // Get the current user ID
  const [activeKey, setActiveKey] = useState<string | undefined>("description");
  const [activeButton, setActiveButton] = useState<string>("task-details");
  const { modalProps, close } = useModal({ modalProps: { open: true } });
  const { id: taskId } = useParams();
  const navigate = useNavigate();
  const [taskInventory, setTaskInventory] = useState([]);
  const [initialValues, setInitialValues] = useState<{ name: string; end_date: string | null; max_progress: number; current_progress: number; unit: string }>({
    name: "",
    end_date: null,
    max_progress: 0,
    current_progress: 0,
    unit: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [inputProgress, setInputProgress] = useState<number | undefined>(0);


  // Comments
  const [comment, setComment] = useState<string>("");
  const [comments, setComments] = useState<string[]>([]);

  const handleCommentChange = (newValue: string) => {
    setComment(newValue);
  };
  

  const handleCommentSubmit = async (commentValue: string) => {
    if (commentValue.trim()) {
      try {
        const { data, error } = await supabaseClient
          .from("task_comment")
          .insert([{ task_id: taskId, content: commentValue.trim(), user_id: specificUserId }]); // Include user_id

        if (error) {
          console.error("Error adding comment:", error.message);
        } else {
          setComments([...comments, commentValue.trim()]);
        }
      } catch (error) {
        console.error("Error adding comment:", error);
      }
    }
  };

  useEffect(() => {
    const fetchTaskData = async () => {
      try {
        setIsLoading(true);
        const [taskData, projectData] = await Promise.all([
          supabaseClient
            .from("task")
            .select("name, end_date, max_progress, current_progress, unit")
            .eq("id", taskId)
            .single(),
          supabaseClient
            .from("task")
            .select("project_id")
            .eq("id", taskId)
            .single(),
        ]);

        if (taskData.error || projectData.error) {
          console.error("Error fetching task data:", taskData.error, projectData.error);
        } else {
          setInitialValues({
            name: taskData.data.name,
            end_date: taskData.data.end_date,
            max_progress: taskData.data.max_progress,
            current_progress: taskData.data.current_progress,
            unit: taskData.data.unit,
          });
          setInputProgress(Math.round((taskData.data.current_progress / taskData.data.max_progress) * 100));
          const projectId = projectData.data.project_id;
          console.log("Project ID:", projectId);
          // Store the project_id in the component state
          setProjectId(projectId);
        }
      } catch (err) {
        console.error("Error fetching task data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTaskData();
  }, [taskId]);

  useEffect(() => {
    const fetchTaskInventory = async () => {
      try {
        const { data: taskInventory, error } = await supabaseClient
          .from('inventory_task')
          .select('*, inventory:inventory_id(*)')
          .eq('task_id', taskId);
  
        if (error) {
          console.error('Error fetching task inventory:', error);
        } else {
          setTaskInventory(taskInventory);
        }
      } catch (error) {
        console.error('Error fetching task inventory:', error);
      }
    };
  
    fetchTaskInventory();
  }, [taskId]);
  
  const TaskInventory = () => {
    const columns = [
      { title: 'Name', dataIndex: ['inventory', 'name'], key: 'name' },
      { title: 'Unit', dataIndex: ['inventory', 'unit'], key: 'unit' },
      { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
      { title: 'Price', dataIndex: ['inventory', 'price'], key: 'price', render: (value) => `$${value}` },
    ];
  
    return (
      <div>
        <h3>Task Inventory</h3>
        <Table dataSource={taskInventory} columns={columns} rowKey="id" />
      </div>
    );
  };


  const handleAccordionChange = (key: string) => {
    setActiveKey(key);
  };

  const handleButtonClick = (button: string) => {
    setActiveButton(button);
  };

  const [projectId, setProjectId] = useState<string | null>(null);

  const cancelForm = () => {
    close();
    list("", "replace");
    // Navigate to the project route based on the projectId
    if (projectId) {
      navigate(`/blog-posts/show/${projectId}`);
    }
  };
  const handleProgressChange = (progress: number | undefined) => {
    if (progress !== undefined) {
      setInputProgress(progress);
      const newCurrentProgress = Math.round((progress / 100) * initialValues.max_progress);
      setInitialValues({ ...initialValues, current_progress: newCurrentProgress });
      updateCurrentProgress(newCurrentProgress); // Update current progress in the database
    }
  };
  
  const updateCurrentProgress = async (newCurrentProgress: number) => {
    try {
      await supabaseClient.from("task").update({ current_progress: newCurrentProgress }).eq("id", taskId);
    } catch (error) {
      console.error("Error updating current progress:", error);
    }
  };

  
  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Unit", dataIndex: "unit", key: "unit" },
    { title: "Quantity", dataIndex: "quantity", key: "quantity" },
    { title: "Price", dataIndex: "price", key: "price", render: (value) => `$${value}` },
  ];
  
  return (
    <StyledDrawer {...modalProps} className="task-edit-drawer" onClose={cancelForm} title={<TitleForm taskId={taskId} />} width="40%" footer={null}>
      <HeaderButtons>
        <Button icon={<InfoOutlined />} onClick={() => handleButtonClick("task-details")} type={activeButton === "task-details" ? "primary" : "default"}>
          Task Details
        </Button>
        <Button icon={<CheckOutlined />} onClick={() => handleButtonClick("progress")} type={activeButton === "progress" ? "primary" : "default"}>
          Progress
        </Button>
        <Button icon={<CommentOutlined />} onClick={() => handleButtonClick("comment")} type={activeButton === "comment" ? "primary" : "default"}>
          Comment
        </Button>
        <Button icon={<ShoppingCartOutlined />} onClick={() => handleButtonClick("task-inventory")} type={activeButton === "task-inventory" ? "primary" : "default"}>
          Task Inventory
        </Button>
      </HeaderButtons>

      {activeButton === "task-details" && (
        <div>
          <Accordion accordionKey="description" activeKey={activeKey} setActive={handleAccordionChange} fallback={<DescriptionHeader taskId={taskId || ""} />} icon={<AlignLeftOutlined />} label="Description">
            {activeKey === "description" && <DescriptionForm taskId={taskId} />}
          </Accordion>
          <UsersForm taskId={taskId} cancelForm={cancelForm} />
        </div>
      )}
  
  {activeButton === "progress" && (
  <ProgressSection>
    <Typography.Paragraph style={{ marginBottom: 8 }}>
      <Typography.Text strong>Current Progress:</Typography.Text> 
      <InputNumber
        value={inputProgress}
        min={0}
        max={initialValues.max_progress}
        formatter={(value) => (value!== undefined? `${value} ${initialValues.unit}` : "")}
        parser={(value) => (value? parseInt(value, 10) : undefined)}
        onChange={handleProgressChange}
        style={{ width: 120, marginRight: 8 }}
      />
      / {initialValues.max_progress} {initialValues.unit}
    </Typography.Paragraph>
    <Progress percent={(inputProgress / initialValues.max_progress) * 100} />
  </ProgressSection>
)}
  
  
      {activeButton === "comment" && (
        <div>
          <CommentInput
            value={comment}
            onChange={handleCommentChange}
            onSubmit={handleCommentSubmit}
          />
          <ul>
            {comments.map((comment, index) => (
              <li key={index}>{comment}</li>
            ))}
          </ul>
        </div>
      )}
      {activeButton === "task-inventory" && <TaskInventory />}
    </StyledDrawer>
  );
 };