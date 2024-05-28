import { useEffect, useState } from 'react';
import { supabaseClient } from '../../utility';

interface SubtaskMembersProps {
  subtaskId: string;
}

const SubtaskMembers: React.FC<SubtaskMembersProps> = ({ subtaskId }) => {
  const [assignedUsers, setAssignedUsers] = useState<string[]>([]);

  useEffect(() => {
    const fetchAssignedUsers = async () => {
      try {
        const { data, error } = await supabaseClient
          .from('sub_task_member')
          .select('task_member_id, task_member:project_member(company_user(profiles(full_name)))')
          .eq('sub_task_id', subtaskId);

        if (error) {
          console.error('Error fetching assigned users:', error);
        } else {
          const users = data.map((member) => member.task_member.company_user.profiles.full_name);
          setAssignedUsers(users);
        }
      } catch (error) {
        console.error('Error fetching assigned users:', error);
      }
    };

    fetchAssignedUsers();
  }, [subtaskId]);

  return (
    <div>
      {assignedUsers.length > 0 ? (
        assignedUsers.join(', ')
      ) : (
        <span>No assigned users</span>
      )}
    </div>
  );
};

export default SubtaskMembers;