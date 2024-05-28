import { useState, useEffect } from "react";
import { CheckSquareOutlined } from "@ant-design/icons";
import { Space } from "antd";
import { Text } from "../../../../components";
import { supabaseClient } from "../../../../utility";

type Props = {
  taskId: string;
};

export const ChecklistHeader = ({ taskId }: Props) => {
  const [checklist, setChecklist] = useState<{ id: string; title: string; is_checked: boolean }[]>([]);

  useEffect(() => {
    const fetchChecklist = async () => {
      try {
        const { data, error } = await supabaseClient
          .from("task_checklist_item")
          .select("id, title, is_checked")
          .eq("task_id", taskId);

        if (error) {
          console.error("Error fetching checklist:", error);
        } else {
          setChecklist(data);
        }
      } catch (err) {
        console.error("Error fetching checklist:", err);
      }
    };

    fetchChecklist();
  }, [taskId]);

  const completed = checklist.filter((item) => item.is_checked).length;
  const total = checklist.length;

  return (
    <Space size={15} align="start" style={{ marginBottom: "12px" }}>
      <CheckSquareOutlined />
      <Text strong>Checklist</Text>
      <Text type="secondary">
        {completed}/{total}
      </Text>
    </Space>
  );
};