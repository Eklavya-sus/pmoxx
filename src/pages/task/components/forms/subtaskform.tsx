import { useForm } from "react-hook-form";
import { Form, Input, Select, Button } from "antd";
import { useCreate } from "@refinedev/core";
import { useState, useEffect } from "react";
import { useList } from "@refinedev/core";

interface SubtaskFormProps {
  taskId: string;
  onSuccess: () => void;
}
const SubtaskForm: React.FC<SubtaskFormProps> = ({ taskId, onSuccess }) => {
    const { formProps, formLoading } = useForm();
    const { mutate: createSubtask } = useCreate();
    const [taskMembers, setTaskMembers] = useState<{ id: string; name: string }[]>([]);
  
    const { data: taskMemberData } = useList<{ id: string; name: string; task_id: string }>({
      resource: "task_member",
      queryOptions: {
        enabled: !!taskId,
        filters: [{ field: "task_id", operator: "eq", value: taskId }],
      },
    });
  
    useEffect(() => {
      if (taskMemberData?.data) {
        setTaskMembers(taskMemberData.data.map(({ id, name }) => ({ id, name })));
      }
    }, [taskMemberData?.data]);
  
    const onFinish = (values: { content: string; task_member: string }) => {
      createSubtask({
        resource: "sub_tasks",
        values: {
          task_id: taskId,
          content: values.content,
          task_member: values.task_member,
        },
        successNotification: {
          message: "Subtask created successfully",
          description: "Subtask has been added to the task",
        },
        onSuccess,
      });
    };
  
    return (
      // ... (form implementation here)
    );
  };
  
  export default SubtaskForm;