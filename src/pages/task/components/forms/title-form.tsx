import { useEffect, useState } from "react";
import { useForm } from "@refinedev/antd";
import { HttpError, useNotification, useInvalidate } from "@refinedev/core";
import { Form, Skeleton } from "antd";
import { supabaseClient } from "../../../../utility";
import { Text } from "../../../../components";

interface Task {
  id: string;
  name: string;
}

interface TaskUpdateInput {
  name: string;
}

const TitleInput = ({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (value: string) => void;
}) => {
  const onTitleChange = (newTitle: string) => {
    onChange?.(newTitle);
  };

  return (
    <Text editable={{ onChange: onTitleChange }} style={{ width: "98%" }}>
      {value}
    </Text>
  );
};

export const TitleForm = ({ taskId }: { taskId: string }) => {
  const { open } = useNotification();
  const invalidate = useInvalidate();
  const [initialValues, setInitialValues] = useState<{ name: string }>({ name: "" });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTaskName = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabaseClient
          .from("task")
          .select("name")
          .eq("id", taskId)
          .single();

        if (error) {
          console.error("Error fetching task name:", error);
        } else {
          setInitialValues({ name: data.name });
        }
      } catch (err) {
        console.error("Error fetching task name:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaskName();
  }, [taskId]);

  const { formProps } = useForm<Task, HttpError, TaskUpdateInput>({
    redirect: false,
    warnWhenUnsavedChanges: false,
    autoSave: {
      enabled: true,
      onFinish: async (values) => {
        try {
          const { error } = await supabaseClient
            .from("task")
            .update({ name: values.name })
            .eq("id", taskId);
          if (error) {
            open({
              type: "error",
              message: "Error updating task title",
              description: error.message,
            });
            return values;
          }
        } catch (error) {
          open({
            type: "error",
            message: "Error updating task title",
            description: String(error),
          });
        }
        return values;
      },
    },
    onMutationSuccess: () => {
      invalidate({ invalidates: ["list"], resource: "task" });
    },
  });

  useEffect(() => {
    formProps.form?.setFieldsValue(initialValues);
  }, [initialValues, formProps.form]);

  if (isLoading) {
    return <Skeleton.Input size="small" style={{ width: "95%", height: "22px" }} block />;
  }

  return (
    <Form {...formProps} initialValues={initialValues}>
      <Form.Item noStyle name="name">
        <TitleInput />
      </Form.Item>
    </Form>
  );
};