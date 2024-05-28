import { MarkdownField } from "@refinedev/antd";
import { Typography } from "antd";
import { supabaseClient } from "../../../../utility";
import { useState, useEffect } from "react";

type Task = {
  id: string;
  description: string;
};

type Props = {
  taskId: string;
};

export const DescriptionHeader = ({ taskId }: Props) => {
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchTaskData = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabaseClient
          .from("task")
          .select("id, description")
          .eq("id", taskId)
          .single();

        if (error) {
          setError(error);
        } else {
          setTask(data as Task);
        }
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaskData();
  }, [taskId]);

  if (isLoading) {
    return <div>Loading...</div>; // Render a loading state
  }

  if (error) {
    console.error(error);
    return <div>Error fetching task description</div>;
  }

  if (task?.description) {
    return (
      <Typography.Paragraph ellipsis={{ rows: 8 }}>
        <MarkdownField value={task.description} />
      </Typography.Paragraph>
    );
  }

  return <Typography.Link>Add task description</Typography.Link>;
};