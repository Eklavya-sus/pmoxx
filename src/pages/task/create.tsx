import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Button, DatePicker, InputNumber, Select, Row, Col } from "antd";
import { supabaseClient } from "../../utility";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGetIdentity } from "@refinedev/core";

export const TaskCreate: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [visible, setVisible] = useState(true);
  const [unitSelected, setUnitSelected] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [projectID, setProjectID] = useState<string | null>(null); // State to store project ID
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCategoryProjectID() {
      try {
        const categoryIdParam = searchParams.get("categoryId");
        if (categoryIdParam) {
          const { data: categoryData, error: categoryError } = await supabaseClient
            .from("category")
            .select("project_id")
            .eq("id", categoryIdParam)
            .single();
          if (categoryError) {
            throw categoryError;
          }
          if (categoryData) {
            setProjectID(categoryData.project_id);
          }
        }
      } catch (error) {
        console.error("Error fetching category project ID:", error);
      }
    }

    fetchCategoryProjectID();
  }, [searchParams]);

  const goToListPage = () => {
    setVisible(false);
    navigate("/task");
    // Your navigation logic to go back to the list page
  };

  const handleCancel = () => {
    setVisible(false);
    goToListPage();
  };

  const handleSubmit = async (values: any) => {
    try {
      const {
        name,
        start_date,
        end_date,
        max_progress,
        cost_per_unit,
      } = values;

      const { data: taskData, error: taskError, status } = await supabaseClient
        .from("task")
        .insert({
          name,
          start_date,
          end_date,
          max_progress,
          unit: selectedUnit,
          cost_per_unit,
          categoryId: searchParams.get("categoryId"),
          project_id: projectID, // Use the fetched project ID
        });

      if (taskError) {
        throw taskError;
      }

      goToListPage();
    } catch (error) {
      console.error("Error creating task:", error);
      // Log the status code and response body
      if (error instanceof Error) {
        console.error("Error message:", error.message);
      } else {
        console.error("Unknown error:", error);
      }
    }
  };

  const unitOptions = [
    "sqft",
    "numbers",
    "cum",
    "meter",
    "sqm",
    "ft",
    "cft",
    "tonne",
    "kg",
    "quintal",
    "in",
    "trips",
    "cm",
    "yard",
    "yd",
    "km",
    "%",
    "hours",
    "kl",
    "litre",
    "bags",
    "each",
    "lumpsum",
    "manday",
    "pair",
    "points",
    "set",
    "shift",
    "sqmn"
  ];

  return (
    <Modal
      visible={visible}
      onCancel={handleCancel}
      title="Add new task"
      width={512}
      footer={null}
    >
      <Form onFinish={handleSubmit} layout="vertical">
        <Form.Item
          label="Task name"
          name="name"
          rules={[{ required: true, message: "Please enter task name" }]}
        >
          <Input placeholder="Please enter task name" />
        </Form.Item>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Unit"
              name="unit"
              rules={[{ required: true, message: "Please select unit" }]}
            >
              <Select
                placeholder="Please select unit"
                onChange={(value) => {
                  setUnitSelected(!!value);
                  setSelectedUnit(value);
                }}
              >
                {unitOptions.map(option => (
                  <Select.Option key={option} value={option}>
                    {option}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          {unitSelected && (
            <>
              <Col span={8}>
                <Form.Item
                  label={`Total (${selectedUnit})`}
                  name="max_progress"
                  rules={[{ required: true, message: `Please enter total ${selectedUnit}` }]}
                >
                  <InputNumber min={0} max={100} placeholder={`Please enter total ${selectedUnit}`} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Cost per Unit"
                  name="cost_per_unit"
                  rules={[{ required: true, message: "Please enter cost per unit" }]}
                >
                  <InputNumber
                    min={0}
                    placeholder="Please enter cost per unit"
                    addonAfter="₹"
                  />
                </Form.Item>
              </Col>
            </>
          )}
        </Row>
        <Form.Item
          label="Start Date"
          name="start_date"
          rules={[{ required: true, message: "Please select start date" }]}
        >
          <DatePicker />
        </Form.Item>
        <Form.Item
          label="End Date"
          name="end_date"
          rules={[{ required: true, message: "Please select end date" }]}
        >
          <DatePicker />
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
