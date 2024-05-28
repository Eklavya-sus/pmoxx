import { useState, useEffect, SetStateAction } from 'react';
import { useParams } from 'react-router-dom';
import { EditOutlined } from "@ant-design/icons";
import { Skeleton } from "antd";
import { supabaseClient } from '../../../utility';
import { Text } from '../../../components';
import styles from "./title-form.module.css";

export const TitleInput = () => {
  const { id: projectId } = useParams();
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);

  useEffect(() => {
    const fetchProjectName = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabaseClient
          .from('project')
          .select('name')
          .eq('id', projectId)
          .single();

        if (error) {
          throw error;
        }

        setProjectName(data.name);
      } catch (error) {
        console.error('Error fetching project name:', error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProjectName();
    }
  }, [projectId]);

  const handleNameChange = async (newName: SetStateAction<string>) => {
    try {
      setLoading(true);
      const { error } = await supabaseClient
        .from('project')
        .update({ name: newName })
        .eq('id', projectId);

      if (error) {
        throw error;
      }

      setProjectName(newName);
      setEditingName(false);
    } catch (error) {
      console.error('Error updating project name:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Text
      className={styles.title}
      size="xl"
      strong
      editable={{
        triggerType: ["text", "icon"],
        icon: <EditOutlined className={styles.titleEditIcon} />,
        editing: editingName,
        onStart: () => setEditingName(true),
        onChange: handleNameChange,
      }}
    >
      {loading ? (
        <Skeleton.Input size="small" style={{ width: 200 }} active />
      ) : (
        projectName
      )}
    </Text>
  );
};