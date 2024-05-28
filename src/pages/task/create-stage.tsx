import { useModalForm } from "@refinedev/antd";
import { useInvalidate, useNavigation } from "@refinedev/core";
import { Form, Input, Modal, Select } from "antd";
import { supabaseClient } from "../../utility";
import { useCompanyId } from "../../components/layout/current-company/index";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const KanbanCreateCategory = () => {
  const invalidate = useInvalidate();
  const { list } = useNavigation();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [companyId] = useCompanyId();
  const navigate = useNavigate();

  const { formProps, modalProps, close } = useModalForm({
    action: "create",
    defaultVisible: true,
    resource: "category",
    onMutationSuccess: () => {
      invalidate({ invalidates: ["list"], resource: "task" });
      navigate("/task"); // Navigate to "/task" upon successful category creation
    },
    successNotification: () => {
      return {
        key: "create-category",
        type: "success",
        message: "Successfully created category",
        description: "Successful",
      };
    },
  });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabaseClient
         .from('project')
         .select('id, name')
         .eq('company_id', companyId);

        if (error) {
          throw error;
        }

        setProjects(data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, [companyId]);
  
  const onFinish = async (values: any) => {
    try {
      const { name, project_id } = values;
  
      const { data, error, status } = await supabaseClient.from("category").insert({
        name,
        project_id,
        company_id: companyId,
      });
  
      if (error) {
        throw error;
      }
  
      close();
      list("task", "replace");
      navigate("/task"); // Navigate to "/task" after closing the modal
    } catch (error) {
      console.error("Error creating category:", error);
    }
  };
  
  return (
    <Modal
      {...modalProps}
      onCancel={() => {
        close();
        // Refresh the list of categories
        navigate("/task"); // Navigate to "/task" upon modal close
      }}
      title="Add new category"
      width={512}
    >
      <Form {...formProps} layout="vertical" onFinish={onFinish}>
        <Form.Item label="Name" name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Project ID" name="project_id" rules={[{ required: true }]}>
          <Select loading={loading}>
            {projects.map((project) => (
              <Select.Option key={project.id} value={project.id}>
                {project.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};
