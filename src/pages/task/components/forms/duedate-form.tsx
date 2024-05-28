import { useEffect } from "react";
import { useForm } from "@refinedev/antd";
import { HttpError, useNotification } from "@refinedev/core";
import { Button, DatePicker, Form, Space } from "antd";
import dayjs from "dayjs";
import { supabaseClient } from "../../../../utility";
import { DueDateHeader } from "../headers";

type Props = {
  taskId: string;
  initialValues: { end_date?: string | null };
  cancelForm: () => void;
};

export const DueDateForm = ({ taskId, initialValues, cancelForm }: Props) => {
  const { open } = useNotification();
  const { formProps, saveButtonProps } = useForm<
    { end_date?: string | null },
    HttpError,
    { end_date?: string | null }
  >({
    queryOptions: { enabled: false },
    redirect: false,
    onMutationSuccess: () => {
      cancelForm();
    },
    autoSave: {
      enabled: true,
      onFinish: async (values) => {
        try {
          const { error } = await supabaseClient
            .from("task")
            .update({ end_date: values.end_date })
            .eq("id", taskId);
          if (error) {
            open({
              type: "error",
              message: "Error updating due date",
              description: error.message,
            });
            return values;
          }
        } catch (error) {
          open({
            type: "error",
            message: "Error updating due date",
            description: String(error),
          });
        }
        return values;
      },
    },
  });

  useEffect(() => {
    formProps.form?.setFieldsValue(initialValues);
  }, [initialValues, formProps.form]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Space size={[8, 0]}>
       {/* Render DueDateHeader */}
        <Form {...formProps} initialValues={initialValues}>
          <Form.Item
            noStyle
            name="end_date"
            getValueProps={(value) => {
              if (!value) return { value: undefined };
              return { value: dayjs(value) };
            }}
          >
            <DatePicker
              format="YYYY-MM-DD HH:mm"
              showTime={{ showSecond: false, format: "HH:mm" }}
              style={{ backgroundColor: "#fff" }}
            />
          </Form.Item>
        </Form>
        <Button {...saveButtonProps} type="primary">
          Save
        </Button>
      </Space>
    </div>
  );
};
