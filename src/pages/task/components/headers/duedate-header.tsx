import { Space, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { Text } from "../../../../components";
import { supabaseClient } from "../../../../utility";
import { useEffect, useState } from "react";
import { getDateColor } from "../../../../utilities";

type Task = {
  id: string;
  due_date: string | null;
};

type Props = {
  taskId: string;
};

export const DueDateHeader = ({ taskId }: Props) => {
  const [dueData, setDueData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchTaskData = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabaseClient
          .from("task")
          .select("due_date")
          .eq("id", taskId)
          .single();
        if (error) {
          setError(error);
        } else {
          setDueData(data?.due_date || null);
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
    return null; // or render a loading state
  }

  if (error) {
    console.error(error);
    return null;
  }

  if (dueData) {
    const color = getDateColor({ end: dueData });
    const getTagText = () => {
      switch (color) {
        case "error":
          return "Overdue";
        case "warning":
          return "Due soon";
        default:
          return "Processing";
      }
    };

    return (
      <Space size={[0, 8]}>
        <Tag color={color}>{getTagText()}</Tag>
        <Text>{dayjs(dueData).format("MMMM D, YYYY - h:ma")}</Text>
      </Space>
    );
  }

  return <Typography.Link>Add due date</Typography.Link>;
};