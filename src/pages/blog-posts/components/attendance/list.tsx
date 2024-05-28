import { List, useTable, FilterDropdown, useSelect } from "@refinedev/antd";
import { BaseRecord, CrudFilters, getDefaultFilter } from "@refinedev/core";
import { Space, Table, Input, Select, DatePicker,Switch, Button } from "antd";
import { supabaseClient } from "../../../../utility";
import { useEffect, useState } from "react";
import { useCompanyId } from "../../../../components/layout/current-company";
import moment from "moment";
import { useParams } from'react-router-dom';

interface IProjectMemberRecord extends BaseRecord {
  company_user_id: string;
  project_id: string;
  role: string;
}

interface IProfileRecord {
  id: string;
  full_name: string;
}

interface ITaskRecord {
  id: string;
  name: string;
}

interface ITaskMemberRecord {
  id: string;
  task_id: string;
  project_member_id: string;
}

interface IAttendanceRecord {
  id: string;
  project_member_id: string;
  attendance_date: string;
  status: string;
}

export const ProjectAttendanceList = () => {
  const [filters, setFilters] = useState<CrudFilters>([]);
  const [projects, setProjects] = useState<{ label: string; value: string }[]>([]);
  const [companyId] = useCompanyId();
  const [selectedDate, setSelectedDate] = useState<moment.Moment | null>(moment());
  const [userProfileMap, setUserProfileMap] = useState<{ [key: string]: IProfileRecord }>({});
  const [companyUserMap, setCompanyUserMap] = useState<{ [key: string]: string }>({});
  const [taskMap, setTaskMap] = useState<{ [key: string]: ITaskRecord }>({});
  const [taskMemberMap, setTaskMemberMap] = useState<{ [key: string]: ITaskMemberRecord[] }>({});
  const [attendanceRecords, setAttendanceRecords] = useState<{ [key: string]: IAttendanceRecord }>({});
  const [attendanceStatusMap, setAttendanceStatusMap] = useState<{ [key: string]: string }>({});
  const [unpaidSalaryMap, setUnpaidSalaryMap] = useState<{ [key: string]: number }>({});
  const [lastPaidDateMap, setLastPaidDateMap] = useState<{ [key: string]: string }>({});
  const { id: projectId } = useParams();

  
  const handleSubmitAttendance = async () => {
    try {
      // Update attendance records
      await Promise.all(Object.entries(attendanceStatusMap).map(([projectMemberId, status]) => 
        updateAttendanceRecord(projectMemberId, selectedDate?.format('YYYY-MM-DD'), status)
      ));
  
      // Fetch all attendance records again
      const { data: allAttendanceData, error: allAttendanceError } = await supabaseClient
       .from("attendance")
       .select("*");
  
      if (allAttendanceError) {
        throw allAttendanceError;
      }
  
      // Update attendance records state with the fetched data
      if (allAttendanceData) {
        const allAttendanceRecords = allAttendanceData.reduce((map: { [key: string]: IAttendanceRecord }, record: IAttendanceRecord) => {
          map[`${record.project_member_id}-${record.attendance_date}`] = record;
          return map;
        }, {});
        setAttendanceRecords(allAttendanceRecords);
      }
  
      // Refetch unpaid salary data
      fetchUnpaidSalaryData(); // Add this line
    } catch (error) {
      console.error('Error updating attendance and fetching updated data:', error);
    } finally {
      // Clear attendance status map after submission
      setAttendanceStatusMap({});
    }
  };
  
  const fetchUnpaidSalaryData = async () => {
    try {
      const { data: projectMemberData, error: projectMemberError } = await supabaseClient
       .from("project_member")
       .select("id, salary_per_day, last_paid_date");
  
      if (projectMemberError) {
        throw projectMemberError;
      }
  
      if (projectMemberData) {
        const unpaidSalaryMap = projectMemberData.reduce((map, projectMember) => {
          const { id, salary_per_day, last_paid_date } = projectMember;
          const lastPaidDate = last_paid_date? moment(last_paid_date) : null;
          const presentDays = Object.values(attendanceRecords).filter(
            (record) =>
              record.project_member_id === id &&
              record.status === "present" &&
              (!lastPaidDate || moment(record.attendance_date).isAfter(lastPaidDate))
          ).length;
          const unpaidSalary = presentDays * salary_per_day;
          map[id] = unpaidSalary;
          return map;
        }, {});
        setUnpaidSalaryMap(unpaidSalaryMap);
        setLastPaidDateMap(projectMemberData.reduce((map, projectMember) => {
          map[projectMember.id] = projectMember.last_paid_date || '';
          return map;
        }, {}));
      }
    } catch (error) {
      console.error("Error fetching unpaid salary data:", error);
    }
  };
  

  

  useEffect(() => {
    async function fetchData() {
      try {
        if (companyId) {
          // Fetch projects only when companyId is available
          const { data: projectsData, error: projectsError } = await supabaseClient
           .from("project")
           .select("id, name")
           .eq("company_id", companyId);

          if (projectsError) {
            throw projectsError;
          }

          if (projectsData) {
            const projectOptions = projectsData.map((project: any) => ({
              label: project.name,
              value: project.id,
            }));
            setProjects(projectOptions);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }

    if (companyId) {
      // Call fetchData only when companyId is available
      fetchData();
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId !== undefined && projectId !== undefined) {
      setFilters([
        {
          field: "company_id",
          operator: "eq",
          value: companyId.toString(),
        },
        {
          field: "project_id",
          operator: "eq",
          value: projectId,
        },
      ]);
    }
  }, [companyId, projectId]);

  useEffect(() => {
    async function fetchUserProfiles() {
      try {
        const { data: companyUserData, error: companyUserError } = await supabaseClient
         .from("company_user")
         .select("id, user_id");

        if (companyUserError) {
          throw companyUserError;
        }

        if (companyUserData) {
          const userIds = companyUserData.map((companyUser: any) => companyUser.user_id);

          const { data: profilesData, error: profilesError } = await supabaseClient
           .from("profiles")
           .select("id, full_name")
           .in("id", userIds);

          if (profilesError) {
            throw profilesError;
          }

          if (profilesData) {
            const userProfileMap = profilesData.reduce((map: { [key: string]: IProfileRecord }, profile: IProfileRecord) => {
              map[profile.id] = profile;
              return map;
            }, {});
            setUserProfileMap(userProfileMap);

            const companyUserMap = companyUserData.reduce((map: { [key: string]: string }, companyUser: any) => {
              map[companyUser.id] = companyUser.user_id;
              return map;
            }, {});
            setCompanyUserMap(companyUserMap);
          }
        }
      } catch (error) {
        console.error("Error fetching user profiles:", error);
      }
    }

    fetchUserProfiles();
  }, [companyId]);

  useEffect(() => {
    async function fetchTaskData() {
      try {
        const { data: taskData, error: taskError } = await supabaseClient
         .from("task")
         .select("id, name");

        if (taskError) {
          throw taskError;
        }

        if (taskData) {
          const taskMap = taskData.reduce((map: { [key: string]: ITaskRecord }, task: ITaskRecord) => {
            map[task.id] = task;
            return map;
          }, {});
          setTaskMap(taskMap);
        }
      } catch (error) {
        console.error("Error fetching task data:", error);
      }
    }

    async function fetchTaskMemberData() {
      try {
        const { data: taskMemberData, error: taskMemberError } = await supabaseClient
         .from("task_member")
         .select("id, task_id, project_member_id");

        if (taskMemberError) {
          throw taskMemberError;
        }

        if (taskMemberData) {
          const taskMemberMap = taskMemberData.reduce((map: { [key: string]: ITaskMemberRecord[] }, taskMember: ITaskMemberRecord) => {
            if (!map[taskMember.project_member_id]) {
              map[taskMember.project_member_id] = [];
            }
            map[taskMember.project_member_id].push(taskMember);
            return map;
          }, {});
          setTaskMemberMap(taskMemberMap);
        }
      } catch (error) {
        console.error("Error fetching task member data:", error);
      }
    }

    fetchTaskData();
    fetchTaskMemberData();
  }, [companyId]);

    useEffect(() => {
      async function fetchAttendanceData() {
        try {
          const { data: attendanceData, error: attendanceError } = await supabaseClient
            .from("attendance")
            .select("id, project_member_id, attendance_date, status");
    
          if (attendanceError) {
            throw attendanceError;
          }
    
          if (attendanceData) {
            const attendanceRecords = attendanceData.reduce((map: { [key: string]: IAttendanceRecord }, record: IAttendanceRecord) => {
              map[`${record.project_member_id}-${record.attendance_date}`] = record;
              return map;
            }, {});
            setAttendanceRecords(attendanceRecords);
    
            // Calculate unpaid salary for each project member
            const { data: projectMemberData, error: projectMemberError } = await supabaseClient
              .from("project_member")
              .select("id, salary_per_day, last_paid_date");
    
            if (projectMemberError) {
              throw projectMemberError;
            }
    
            if (projectMemberData) {
              const unpaidSalaryMap = projectMemberData.reduce((map, projectMember) => {
                const { id, salary_per_day, last_paid_date } = projectMember;
                const lastPaidDate = last_paid_date ? moment(last_paid_date) : null;
                const presentDays = Object.values(attendanceRecords).filter(
                  (record) =>
                    record.project_member_id === id &&
                    record.status === "present" &&
                    (!lastPaidDate || moment(record.attendance_date).isAfter(lastPaidDate))
                ).length;
                const unpaidSalary = presentDays * salary_per_day;
                map[id] = unpaidSalary;
                return map;
              }, {});
              setUnpaidSalaryMap(unpaidSalaryMap);
              setLastPaidDateMap(projectMemberData.reduce((map, projectMember) => {
                map[projectMember.id] = projectMember.last_paid_date || '';
                return map;
              }, {}));
            }
          }
        } catch (error) {
          console.error("Error fetching attendance data:", error);
        }
      }
    
      fetchAttendanceData();
    }, [companyId]);

  const { tableProps, searchFormProps } = useTable<IProjectMemberRecord>({
    syncWithLocation: true,
    resource: "project_member",
    filters: {
      permanent: filters,
    },
  });

  const projectSelectProps = {
    value: filters.find((filter) => filter.field === "project_id")?.value,
    onChange: (value: string) => {
      // Remove any existing filter for project_id
      const updatedFilters = filters.filter((filter) => filter.field!== "project_id");

      // Add the new filter for project_id
      if (value) {
        updatedFilters.push({
          field: "project_id",
          operator: "eq",
          value,
        });
      }

      setFilters(updatedFilters);
    },
    options: projects,
  };

  const handleDateChange = (date: moment.Moment | null) => {
    setSelectedDate(date);
    
  };

  const handleAttendanceToggle = (projectMemberId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'present' ? 'absent' : 'present';
    setAttendanceStatusMap((prevMap) => ({
      ...prevMap,
      [projectMemberId]: newStatus,
    }));
  };

  async function updateAttendanceRecord(projectMemberId: string, attendanceDateStr: string, status: string) {
    try {
      const attendanceDate = moment(attendanceDateStr);
      const startOfDay = attendanceDate.startOf('day').toISOString();
      const endOfDay = attendanceDate.endOf('day').toISOString();
  
      const { data: existingRecord, error: selectError } = await supabaseClient
        .from('attendance')
        .select('id')
        .eq('project_member_id', projectMemberId)
        .eq('attendance_date', attendanceDate.toISOString());
  
      if (selectError) {
        throw selectError;
      }
  
      if (existingRecord && existingRecord.length > 0) {
        // Update the existing record
        const { error: updateError } = await supabaseClient
          .from('attendance')
          .update({ status })
          .eq('id', existingRecord[0].id)
          .single();
  
        if (updateError) {
          throw updateError;
        }
  
        console.log('Attendance record updated:', existingRecord[0].id);
      } else {
        // Insert a new record
        const { data: newRecord, error: insertError } = await supabaseClient
          .from('attendance')
          .insert({ project_member_id: projectMemberId, attendance_date: attendanceDate.toISOString(), status })
          .single();
  
        if (insertError) {
          throw insertError;
        }
  
        if (newRecord) {
          console.log('Attendance record inserted:', newRecord);
        }
      }
    } catch (error) {
      console.error('Error updating attendance record:', error);
    }
  }


  useEffect(() => {
    const initialAttendanceStatusMap = Object.entries(attendanceRecords).reduce((map, [key, record]) => {
      const [projectMemberId, attendanceDate] = key.split('-');
      if (attendanceDate === selectedDate?.format('YYYY-MM-DD')) {
        map[projectMemberId] = record.status;
      }
      return map;
    }, {});
    setAttendanceStatusMap(initialAttendanceStatusMap);
  }, [attendanceRecords, selectedDate]);

  
  return (
    <List>
      <Space style={{ marginBottom: 16 }}>
        <DatePicker
          value={selectedDate}
          onChange={handleDateChange}
          allowClear={false}
          placeholder="Select date"
        />
      </Space>
      <Table {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="company_user_id"
          title="User Name"
          render={(companyUserId: string) => {
            const userId = companyUserMap[companyUserId];
            const userProfile = userProfileMap[userId];
            return userProfile ? userProfile.full_name : "Unknown";
          }}
        />
        <Table.Column dataIndex="role" title="Role" />
        <Table.Column
          dataIndex="project_id"
          title="Project Name"
          render={(projectId: string) =>
            projects.find((project) => project.value === projectId)?.label || "Unknown"
          }
        />
        <Table.Column
          dataIndex="id"
          title="Task Name"
          render={(id: string) => {
            const taskMembers = taskMemberMap[id];
            if (taskMembers) {
              const taskIds = taskMembers.map((taskMember) => taskMember.task_id);
              const taskNames = taskIds.map((taskId) => taskMap[taskId]?.name).filter(Boolean);
              return taskNames.join(", ");
            }
            return "Unknown";
          }}
        />
<Table.Column
  dataIndex="id"
  title="Unpaid Salary"
  render={(id: string) => {
    const unpaidSalary = unpaidSalaryMap[id] || 0;
    const lastPaidDate = lastPaidDateMap[id] ? moment(lastPaidDateMap[id]).format('YYYY-MM-DD') : 'Never';

    const handlePaySalary = async (id: string) => {
      try {
        const { error: updateError } = await supabaseClient
          .from('project_member')
          .update({ last_paid_date: selectedDate?.format('YYYY-MM-DD') })
          .eq('id', id)
          .single();
    
        if (updateError) {
          throw updateError;
        }
    
        setUnpaidSalaryMap((prevMap) => ({
          ...prevMap,
          [id]: 0,
        }));
        setLastPaidDateMap((prevMap) => ({
          ...prevMap,
          [id]: new Date().toISOString(),
        }));
      } catch (error) {
        console.error('Error updating salary status:', error);
      }
    };

    return (
      <Space>
        <span>{unpaidSalary}</span>
        <span>Last Paid: {lastPaidDate}</span>
        {unpaidSalary > 0 && (
          <Button type="primary" onClick={() => handlePaySalary(id)}>
            Pay
          </Button>
        )}
      </Space>
    );
  }}
/>
        <Table.Column
  dataIndex="id"
  title="Attendance"
  render={(id: string) => {
    const attendanceKey = `${id}-${selectedDate?.format('YYYY-MM-DD')}`;
    const attendanceRecord = attendanceRecords[attendanceKey];
    const currentStatus = attendanceStatusMap[id] || attendanceRecord?.status || 'absent';
    const isPresent = currentStatus === 'present';

    return (
      <Space>
        <Switch
          checked={isPresent}
          onChange={() => handleAttendanceToggle(id, currentStatus)}
        />
        <span>{currentStatus.toUpperCase()}</span>
      </Space>
    );
  }}
/>
      </Table>
      <Space style={{ marginTop: 16 }}>
      <Button
          type="primary"
          onClick={handleSubmitAttendance}
        >
          Submit Attendance
        </Button>
      </Space>
      
    </List>
  );
};