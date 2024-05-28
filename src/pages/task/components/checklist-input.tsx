import { Checkbox, Input, notification } from "antd";
import { useState } from "react";
import { supabaseClient } from "../../../utility";

interface ChecklistItem {
  id: string;
  task_id: string;
  title: string;
  is_checked: boolean;
}

type Props = {
  taskId: string;
  item?: ChecklistItem;
  onItemChange?: (item: ChecklistItem) => void;
};

export const CheckListInput = ({ taskId, item, onItemChange }: Props) => {
  const [title, setTitle] = useState(item?.title || "");
  const [isChecked, setIsChecked] = useState(item?.is_checked || false);

  const triggerChange = async (changedValue: { title?: string; is_checked?: boolean }) => {
    try {
      if (item?.id) {
        // Update existing item
        const { error } = await supabaseClient
          .from("task_checklist_item")
          .update({ title: changedValue.title, is_checked: changedValue.is_checked })
          .eq("id", item.id);

        if (!error && onItemChange) {
          onItemChange({ id: item.id, task_id: item.task_id, title: changedValue.title || title, is_checked: changedValue.is_checked || isChecked });
        }
      } else {
        // Create new item
        const { data, error } = await supabaseClient
          .from("task_checklist_item")
          .insert({ task_id: taskId, title: changedValue.title, is_checked: changedValue.is_checked });

        if (!error && onItemChange && data?.[0]) {
          onItemChange({ id: data[0].id, task_id: taskId, title: changedValue.title || title, is_checked: changedValue.is_checked || false });
        }
      }
    } catch (err) {
      console.error("Error updating or inserting checklist item:", err);
      notification.error({
        message: "Error updating or inserting checklist item",
        description: err.message,
      });
    }
  };

  const onTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    triggerChange({ title: newTitle });
  };

  const onCheckboxChange = (checked: boolean) => {
    setIsChecked(checked);
    triggerChange({ is_checked: checked });
  };

  return (
    <div style={{ display: "flex", flex: 1 }}>
      <Checkbox checked={isChecked} onChange={(e) => onCheckboxChange(e.target.checked)} />
      <Input
        bordered={false}
        value={title}
        onChange={onTitleChange}
        placeholder="Please enter item title"
        style={{ backgroundColor: "#fff", textDecoration: isChecked ? "line-through" : "none" }}
      />
    </div>
  );
};