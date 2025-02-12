import { useShow, useOne } from "@refinedev/core";
import { Show, DateField } from "@refinedev/antd";
import { Typography, Tag } from "antd";

import { ITask, ILabel, IPriority, IStatus, IProfile } from "../../interfaces";

const { Title, Text } = Typography;

export const TaskShow: React.FC = () => {
  const { queryResult } = useShow<ITask>();
  const { data, isLoading } = queryResult;
  const record = data?.data;

  const { data: assigned } = useOne<IProfile>({
    resource: "profiles",
    id: record?.users || "",
  });

  const { data: label } = useOne<ILabel>({
    resource: "label",
    id: record?.label || "",
  });

  const { data: priority } = useOne<IPriority>({
    resource: "priority",
    id: record?.priority || "",
  });

  const { data: status } = useOne<IStatus>({
    resource: "status",
    id: record?.status || "",
  });

  console.log(status?.data);

  return (
    <Show isLoading={isLoading}>
      <Title level={5}>Task:</Title>
      <Text>{record?.title || "-"}</Text>

      <Title level={5}>Task Description:</Title>
      <Text>{record?.description}</Text>

      <Title level={5}>Assigned To:</Title>
      
      <Title level={5}>Label:</Title>
      <Text>
        <Tag>{label?.data?.title ?? "-"}</Tag>
      </Text>

      <Title level={5}>Priority:</Title>
      <Text>{priority?.data?.title ?? "-"}</Text>

      <Title level={5}>Status:</Title>
      <Text>{status?.data?.title ?? "-"}</Text>

      <Title level={5}>Start Date:</Title>
      <DateField format="DD/MM/YYYY" value={record?.start_time ?? "-"} />

      <Title level={5}>Due Date:</Title>
      <DateField format="DD/MM/YYYY" value={record?.end_time ?? "-"} />
    </Show>
  );
};