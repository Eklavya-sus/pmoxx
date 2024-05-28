import { DeleteButton } from "@refinedev/antd";
import { useNavigation } from "@refinedev/core";

export const ModalFooter = () => {
  const { list } = useNavigation();

  return (
    <DeleteButton
      type="link"
      onSuccess={() => {
        list("task", "replace");
      }}
    >
      Delete card
    </DeleteButton>
  );
};
