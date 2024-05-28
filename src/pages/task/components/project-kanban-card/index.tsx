import { memo, useMemo } from "react";
import { useDelete, useNavigation } from "@refinedev/core";
import {
  CheckSquareOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
  MessageOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, Skeleton, Space, Tag, Tooltip } from "antd";
import dayjs from "dayjs";
import styled from "styled-components";
import { CustomAvatar, Text, TextIcon } from "../../../../components";
import { getDateColor } from "../../../../utilities";

const StyledRow = styled.div`
  display: grid;
  grid-template-columns: minmax(200px, 1fr) minmax(300px, 2fr) minmax(150px, 1fr) 50px;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
`;

const TaskName = styled.span`
  font-weight: 500;
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AvatarWrapper = styled.div`
  display: flex;
  gap: 4px;
`;

type ProjectRowProps = {
  id: string;
  name: string;
  max_progress: number | null;
  current_progress: number | null;
  unit: string | null;
  cost_per_unit: number | null;
  start_date: string | null;
  end_date: string | null;
  project_id: string;
  comments: {
    totalCount: number;
  };
  users: {
    id: string;
    name: string;
    avatarUrl?: string;
  }[];
  checkList: {
    title: string;
    checked: boolean;
  }[];
};


export const ProjectRow = ({
  id,
  name,
  comments,
  users,
  checkList,
  start_date,
  end_date,
}: ProjectRowProps) => {
  const { edit } = useNavigation();
  const { mutate } = useDelete();

  const dropdownItems = useMemo(() => {
    return [
      {
        label: "View card",
        key: "1",
        icon: <EyeOutlined />,
        onClick: () => {
          edit("task", id, "replace");
        },
      },
      {
        danger: true,
        label: "Delete card",
        key: "2",
        icon: <DeleteOutlined />,
        onClick: () => {
          mutate({
            resource: "task",
            id,
            meta: {
              operation: "task",
            },
          });
        },
      },
    ];
  }, []);

  const dateOptions = useMemo(() => {
    if (!start_date || !end_date) return null;

    const startDate = dayjs(start_date);
    const endDate = dayjs(end_date);

    return {
      color: getDateColor({ start: start_date, end: end_date }) as string,
      startText: startDate.format("MMM D"),
      endText: endDate.format("MMM D"),
    };
  }, [start_date, end_date]);

  const checkListCompletionCountOptions = useMemo(() => {
    const hasCheckList = checkList && checkList.length > 0;
    if (!hasCheckList) {
      return null;
    }

    const total = checkList.length;
    const checked = checkList.filter((item) => item.checked).length;

    const defaulOptions = {
      color: "default",
      text: `${checked}/${total}`,
      allCompleted: false,
    };

    if (checked === total) {
      defaulOptions.color = "success";
      defaulOptions.allCompleted = true;
      return defaulOptions;
    }

    return defaulOptions;
  }, [checkList]);

  return (
    <StyledRow>
      <TaskName>{name}</TaskName>
      <IconWrapper>
        <TextIcon style={{ marginRight: "4px" }} />
        {!!comments?.totalCount && (
          <div>
            <MessageOutlined style={{ fontSize: "12px" }} />
            <Text size="xs" type="secondary">
              {comments.totalCount}
            </Text>
          </div>
        )}
        {dateOptions && (
          <>
            <Tag
              icon={<ClockCircleOutlined style={{ fontSize: "12px" }} />}
              style={{ padding: "0 4px", marginInlineEnd: "0" }}
              color={dateOptions.color}
            >
              {dateOptions.startText}
            </Tag>
            <Tag
              icon={<ClockCircleOutlined style={{ fontSize: "12px" }} />}
              style={{ padding: "0 4px", marginInlineEnd: "0" }}
              color={dateOptions.color}
            >
              {dateOptions.endText}
            </Tag>
          </>
        )}
        {checkListCompletionCountOptions && (
          <Tag
            icon={<CheckSquareOutlined style={{ fontSize: "12px" }} />}
            style={{
              padding: "0 4px",
              marginInlineEnd: "0",
              backgroundColor:
                checkListCompletionCountOptions.color === "default"
                  ? "transparent"
                  : "unset",
            }}
            color={checkListCompletionCountOptions.color}
            bordered={checkListCompletionCountOptions.color !== "default"}
          >
            {checkListCompletionCountOptions.text}
          </Tag>
        )}
      </IconWrapper>
      <AvatarWrapper>
        {users?.map((user) => (
          <Tooltip key={user.id} title={user.name}>
            <CustomAvatar name={user.name} src={user.avatarUrl} />
          </Tooltip>
        ))}
      </AvatarWrapper>
      <Dropdown
        trigger={["click"]}
        menu={{
          items: dropdownItems,
          onClick: (e) => e.domEvent.stopPropagation(),
        }}
        placement="bottomRight"
      >
        <Button
          type="text"
          shape="circle"
          icon={<MoreOutlined style={{ transform: "rotate(90deg)" }} />}
        />
      </Dropdown>
    </StyledRow>
  );
};

export const ProjectRowSkeleton = () => {
  return (
    <StyledRow>
      <Skeleton.Input active size="small" style={{ width: "200px" }} />
      <IconWrapper>
        <Skeleton.Button active size="small" style={{ width: "50px" }} />
        <Skeleton.Button active size="small" style={{ width: "80px" }} />
        <Skeleton.Button active size="small" style={{ width: "80px" }} />
      </IconWrapper>
      <AvatarWrapper>
        <Skeleton.Avatar active size="small" />
        <Skeleton.Avatar active size="small" />
      </AvatarWrapper>
      <Skeleton.Button active size="small" shape="circle" />
    </StyledRow>
  );
};


export const ProjectRowMemo = memo(ProjectRow, (prevProps, nextProps) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.name === nextProps.name &&
    prevProps.max_progress === nextProps.max_progress &&
    prevProps.current_progress === nextProps.current_progress &&
    prevProps.unit === nextProps.unit &&
    prevProps.cost_per_unit === nextProps.cost_per_unit &&
    prevProps.start_date === nextProps.start_date &&
    prevProps.end_date === nextProps.end_date &&
    prevProps.project_id === nextProps.project_id &&
    prevProps.comments.totalCount === nextProps.comments.totalCount &&
    prevProps.users.length === nextProps.users.length &&
    prevProps.checkList.length === nextProps.checkList.length
  );
});