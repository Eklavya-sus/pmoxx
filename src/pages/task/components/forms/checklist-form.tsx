import { useEffect, useState } from "react";
import { useForm } from "@refinedev/antd";
import { HttpError, useInvalidate } from "@refinedev/core";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Form } from "antd";
import { supabaseClient } from "../../../../utility";
import { AccordionHeaderSkeleton, ChecklistHeader, CheckListInput } from "../";

type ChecklistItem = {
  id: string;
  title: string;
  is_checked: boolean;
};

type Props = {
  taskId: string;
  isLoading?: boolean;
};

export const CheckListForm = ({ taskId, isLoading }: Props) => {
  const invalidate = useInvalidate();
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const handleItemDelete = async (itemId: string) => {
    try {
      const { error } = await supabaseClient
        .from("task_checklist_item")
        .delete()
        .eq("id", itemId);

      if (!error) {
        // Update the checklist state to remove the deleted item
        setChecklist((prevChecklist) => prevChecklist.filter((item) => item.id !== itemId));
      } else {
        console.error("Error deleting checklist item:", error);
        notification.error({
          message: "Error deleting checklist item",
          description: error.message,
        });
      }
    } catch (err) {
      console.error("Error deleting checklist item:", err);
      notification.error({
        message: "Error deleting checklist item",
        description: err.message,
      });
    }
  };

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

  const { formProps } = useForm<{ checklist: ChecklistItem[] }, HttpError, { checklist: ChecklistItem[] }>({
    queryOptions: { enabled: false },
    redirect: false,
    autoSave: {
      enabled: true,
      onFinish: async (values) => {
        const updatedChecklist = values.checklist.map(async (item) => {
          if (item.id) {
            const { error } = await supabaseClient
              .from("task_checklist_item")
              .update({ title: item.title, is_checked: item.is_checked })
              .eq("id", item.id);

            if (error) {
              console.error("Error updating checklist item:", error);
            }
          } else {
            const { error } = await supabaseClient
              .from("task_checklist_item")
              .insert({ task_id: taskId, title: item.title, is_checked: item.is_checked });

            if (error) {
              console.error("Error inserting checklist item:", error);
            }
          }

          return item;
        });

        await Promise.all(updatedChecklist);
        return values;
      },
    },
    successNotification: false,
    onMutationSuccess: () => {
      invalidate({ invalidates: ["list"], resource: "tasks" });
    },
  });

  useEffect(() => {
    formProps.form?.setFieldsValue({ checklist });
  }, [checklist, formProps.form]);

  if (isLoading) {
    return <AccordionHeaderSkeleton />;
  }

  return (
    <div style={{ padding: "12px 24px", borderBottom: "1px solid #d9d9d9" }}>
      <ChecklistHeader taskId={taskId} />
      <div style={{ border: "1px solid #d9d9d9", borderRadius: "8px", marginLeft: "30px" }}>
        <Form {...formProps} initialValues={{ checklist }}>
          <Form.List name="checklist">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <div
                    key={field.key}
                    style={{
                      display: "flex",
                      flex: 1,
                      alignItems: "center",
                      padding: "8px",
                      borderBottom: "1px solid #d9d9d9",
                    }}
                  >
                    <Form.Item {...field} noStyle name={[field.name]}>
                      <CheckListInput taskId={taskId} />
                    </Form.Item>
                    <Button
                      type="text"
                      size="small"
                      onClick={() => remove(field.name)}
                      style={{ opacity: "0.15" }}
                      icon={<DeleteOutlined />}
                    />
                  </div>
                ))}
                <Form.Item noStyle>
                  <Button
                    type="link"
                    onClick={() => add({ title: "", is_checked: false })}
                    block
                    icon={<PlusOutlined />}
                    style={{
                      textAlign: "left",
                      marginTop: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    Add item
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </div>
    </div>
  );
};