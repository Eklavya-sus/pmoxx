import { useModalForm } from "@refinedev/antd";
import { useInvalidate, useNavigation } from "@refinedev/core";
import { Form, Input, Modal } from "antd";
import { supabaseClient } from "../../utility";

export const KanbanEditCategory = () => {
  const invalidate = useInvalidate();
  const { list } = useNavigation();

  const { formProps, modalProps, close, id } = useModalForm({
    action: "edit",
    defaultVisible: true,
    resource: "category",
    onMutationSuccess: () => {
      invalidate({ invalidates: ["list"], resource: "task" });
    },
    successNotification: () => {
      return {
        key: "edit-category",
        type: "success",
        message: "Successfully updated category",
        description: "Successful",
      };
    },
  });

  const handleSubmit = async (values: any) => {
    try {
      const { name, project_id } = values;

      const { data, error, status } = await supabaseClient
        .from("category")
        .update({ name, project_id })
        .eq("id", id);

      if (error) {
        throw error;
      }

      formProps.onFinish?.();
      close();
      list("task", "replace");
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  return (
    <Modal
      {...modalProps}
      onCancel={() => {
        close();
        list("task", "replace");
      }}
      title="Edit category"
      width={512}
    >
      <Form {...formProps} layout="vertical" onFinish={handleSubmit}>
        <Form.Item label="Name" name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
       
      </Form>
    </Modal>
  );
};