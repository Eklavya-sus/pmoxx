import { useEffect, useState } from "react";
import { Modal, Table } from "antd";
import { DateField } from "@refinedev/antd";
import { supabaseClient } from "../../utility";

interface IInventoryTaskLog {
  id: number;
  inventory_id: number;
  task_id: string;
  task_name: string;
  quantity: number;
  created_at: string;
  user_id: string;
  user_name: string | null; // Make user_name nullable
}

interface InventoryLogModalProps {
  inventoryId: number;
  visible: boolean;
  onClose: () => void;
}

export const InventoryLogModal = ({
  inventoryId,
  visible,
  onClose,
}: InventoryLogModalProps) => {
  const [logs, setLogs] = useState<IInventoryTaskLog[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data, error } = await supabaseClient
          .from("inventory_task_log")
          .select(
            `*, task(name), profiles(full_name)` // Select the full_name from the profiles table
          )
          .eq("inventory_id", inventoryId);

        if (error) {
          throw error;
        }

        const formattedLogs = data.map((log: any) => ({
          id: log.id,
          inventory_id: log.inventory_id,
          task_id: log.task_id,
          task_name: log.task ? log.task.name : "Wasted",
          quantity: log.quantity,
          created_at: log.created_at,
          user_id: log.user_id,
          user_name: log.profiles ? log.profiles.full_name : null, // Check if log.profiles exists
        }));

        setLogs(formattedLogs);
      } catch (error) {
        console.error("Error fetching logs:", error);
      }
    };

    if (visible) {
      fetchLogs();
    } else {
      setLogs([]);
    }
  }, [inventoryId, visible]);

  return (
    <Modal
      title={`Logs for Inventory ID: ${inventoryId}`}
      visible={visible}
      onCancel={onClose}
      footer={null}
    >
      <Table dataSource={logs} rowKey="id">
      <Table.Column
          dataIndex="user_name"
          title="User Name"
          render={(value: string | null) => value || "N/A"} // Render "N/A" if user_name is null
        />
        <Table.Column dataIndex="task_name" title="Task Name" />
        <Table.Column dataIndex="quantity" title="Quantity" />
        <Table.Column
          dataIndex="created_at"
          title="Timestamp"
          render={(value: string) => <DateField value={value} format="LLL" />}
        />
      </Table>
    </Modal>
  );
};