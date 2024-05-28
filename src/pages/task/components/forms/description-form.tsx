import { useEffect, useState } from "react";
import { useForm } from "@refinedev/antd";
import { HttpError, useNotification, useInvalidate } from "@refinedev/core";
import { Form, Skeleton } from "antd";
import { supabaseClient } from "../../../../utility";
import { Text } from "../../../../components";

interface Task {
  id: string;
  description: string; // Adjust according to your Supabase schema
}

interface TaskUpdateInput {
  description: string; // Adjust according to your Supabase schema
}

const DescriptionInput = ({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (value: string) => void;
}) => {
  const onDescriptionChange = (newDescription: string) => {
    onChange?.(newDescription);
  };

  return (
    <Text editable={{ onChange: onDescriptionChange }} style={{ width: "98%" }}>
      {value}
    </Text>
  );
};

export const DescriptionForm = ({ taskId }: { taskId: string }) => {
  const { open } = useNotification();
  const invalidate = useInvalidate();
  const [initialValues, setInitialValues] = useState<{ description: string }>({ description: "" });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTaskDescription = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabaseClient
          .from("task")
          .select("description")
          .eq("id", taskId)
          .single();

        if (error) {
          console.error("Error fetching task description:", error);
        } else {
          setInitialValues({ description: data.description || "" }); // Ensure empty string if description is null
        }
      } catch (err) {
        console.error("Error fetching task description:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaskDescription();
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
            .update({ description: values.description })
            .eq("id", taskId);
          if (error) {
            open({
              type: "error",
              message: "Error updating task description",
              description: error.message,
            });
            return values;
          }
        } catch (error) {
          open({
            type: "error",
            message: "Error updating task description",
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
      <Form.Item noStyle name="description">
        <DescriptionInput />
      </Form.Item>
    </Form>
  );
};
