import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Button, InputNumber, Select } from "antd";
import { supabaseClient } from "../../utility";
import { useNavigate } from "react-router-dom";
import { useCompanyId } from "../../components/layout/current-company"

export const InventoryCreate: React.FC = () => {
  const [visible, setVisible] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [projects, setProjects] = useState<any[]>([]);
  const [companyId] = useCompanyId();
  const navigate = useNavigate();
 

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabaseClient
         .from("project")
         .select("id, name")
         .eq("company_id", companyId);

        if (error) {
          throw error;
        }

        setProjects(data || []);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    fetchProjects();
  }, [companyId]);

  const unitOptions = [
    // List of possible units for inventory
    "kg",
    "gram",
    "liter",
    "milliliter",
    "meter",
    "square meter",
    "cubic meter",
    // Add more units as needed
  ];

  const handleCancel = () => {
    setVisible(false);
    // Your navigation logic to go back to the list page
  };

  const handleSubmit = async (values: any) => {
    try {
      const { name, quantity, unit_price, supplier } = values;

      // Calculate the total price
      const price = quantity * unit_price;

      // Insert the inventory data into the database
      await supabaseClient.from("inventory").insert({
        name,
        unit: selectedUnit,
        quantity,
        unit_price,
        price,
        supplier,
        company_id: companyId,
        project_id: selectedProject,
      });

      // After successful creation, navigate back to the list page
      navigate("/inventory");
    } catch (error) {
      console.error("Error creating inventory:", error);
      // Handle error
    }
  };

  return (
    <Modal
      visible={visible}
      onCancel={handleCancel}
      title="Add new inventory"
      width={512}
      footer={null}
    >
      <Form onFinish={handleSubmit} layout="vertical">
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Please enter inventory name" }]}
        >
          <Input placeholder="Enter inventory name" />
        </Form.Item>
        <Form.Item
          label="Unit"
          name="unit"
          rules={[{ required: true, message: "Please select unit" }]}
        >
          <Select
            placeholder="Select unit"
            onChange={(value) => setSelectedUnit(value)}
          >
            {unitOptions.map((option) => (
              <Select.Option key={option} value={option}>
                {option}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          label="Quantity"
          name="quantity"
          rules={[{ required: true, message: "Please enter quantity" }]}
        >
          <InputNumber min={0} placeholder="Enter quantity" />
        </Form.Item>
        <Form.Item
          label="Unit Price"
          name="unit_price"
          rules={[{ required: true, message: "Please enter unit price" }]}
        >
          <InputNumber min={0} placeholder="Enter unit price" />
        </Form.Item>
        <Form.Item
          label="Project"
          name="project"
          rules={[{ required: true, message: "Please select project" }]}
        >
          <Select
            placeholder="Select project"
            onChange={(value) => setSelectedProject(value)}
          >
            {projects.map((project) => (
              <Select.Option key={project.id} value={project.id}>
                {project.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          label="Supplier"
          name="supplier"
        >
          <Input placeholder="Enter supplier (optional)" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Create
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};