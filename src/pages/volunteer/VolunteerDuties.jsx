// src/components/volunteer/VolunteerDuties.jsx

import React, { useState, useEffect } from "react";
import supabase from "../../api/supabase";
// Remove the sidebar import
// import VolunteerSidebar from "../../components/volunteer/VolunteerSidebar";
import DutyCard from "../../components/volunteer/duty/DutyCard"; // Import the DutyCard component
import DutyFormModal from "../../components/volunteer/duty/DutyFormModal"; // Modal component for adding duties
import EditDutyModal from "../../components/volunteer/duty/EditDutyModal"; // Modal component for editing duties
import DeleteDutyModal from "../../components/volunteer/duty/DeleteDutyModal"; // Modal component for deleting duties
import AssignUsersModal from "../../components/volunteer/duty/AssignUsersModal"; // Import AssignUsersModal
import OverviewModal from "../../components/volunteer/duty/OverviewModal";
import { Button } from "../../shadcn/button"; // Import Shadcn Button component
import useUserData from "../../api/useUserData"; // Hook to get logged-in user data

const VolunteerDuties = () => {
  const { userData } = useUserData(); // Get logged-in user data
  const [loading, setLoading] = useState(true); // State to manage loading status
  const [duties, setDuties] = useState([]); // State to store fetched duties
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // State to control Add Duty modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // State to control Edit Duty modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // State to control Delete Duty modal
  const [selectedDuty, setSelectedDuty] = useState(null); // Duty selected for editing or deleting

  const [isOverviewModalOpen, setIsOverviewModalOpen] = useState(false); // State for Overview modal

  const [users, setUsers] = useState([]); // State to store group users
  const [isAssignUsersModalOpen, setIsAssignUsersModalOpen] = useState(false);
  const [currentDuty, setCurrentDuty] = useState(null); // Duty selected for assigning users

  // Fetch users based on group_id
  const fetchUsers = async (dutyId = null) => {
    try {
      if (!userData?.group_id) return; // Ensure group_id is available

      // Fetch all users based on group_id
      const { data: allUsers, error: userError } = await supabase
        .from("user_list")
        .select("*")
        .eq("group_id", userData.group_id);

      if (userError) throw userError;

      // If dutyId is provided, fetch assigned users for that duty
      let assignedUserIds = [];
      if (dutyId) {
        const { data: assignments, error: assignmentError } = await supabase
          .from("user_assignments")
          .select("user_id")
          .eq("duties_id", dutyId);

        if (assignmentError) throw assignmentError;

        assignedUserIds = assignments.map((assignment) => assignment.user_id);
      }

      // Filter out users who are already assigned to the current duty
      const filteredUsers = dutyId
        ? allUsers.filter((user) => !assignedUserIds.includes(user.user_id))
        : allUsers;

      setUsers(filteredUsers);
    } catch (error) {
      console.error("Error fetching users:", error.message);
    }
  };

  // Fetch users when the component mounts or group_id changes
  useEffect(() => {
    fetchUsers();
  }, [userData?.group_id]); // Refetch when group_id becomes available

  // Fetch duties based on group_id, including assigned users
  const fetchDuties = async () => {
    try {
      if (!userData?.group_id) return; // Ensure group_id is available
      setLoading(true);
      const { data, error } = await supabase
        .from("duties_list")
        .select(
          `*,
          user_assignments (
            user_id,
            user_list (user_name, user_last_name)
          )`,
        )
        .eq("group_id", userData.group_id); // Fetch only duties for the user's group

      if (error) throw error;

      // Transform data to include assigned users
      const dutiesWithAssignments = data.map((duty) => ({
        ...duty,
        assigned_users: duty.user_assignments
          ? duty.user_assignments.map((assignment) => ({
              user_id: assignment.user_id,
              user_name: assignment.user_list.user_name,
              user_last_name: assignment.user_list.user_last_name,
            }))
          : [],
      }));

      setDuties(dutiesWithAssignments);
    } catch (error) {
      console.error("Error fetching duties:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch duties when the component mounts or group_id changes
  useEffect(() => {
    fetchDuties();
  }, [userData?.group_id]); // Refetch when group_id becomes available

  const handleAddDuty = async (newDuty) => {
    try {
      const {
        dutyName,
        dutyDescription,
        dutyStartTime,
        dutyEndTime,
        selectedDays, // Get the selected days
      } = newDuty;

      // Create a single duty object to insert
      const dutyToInsert = {
        duty_name: dutyName,
        duty_description: dutyDescription,
        duty_start_time: dutyStartTime,
        duty_end_time: dutyEndTime,
        recurrence_pattern: "weekly", // Set the recurrence pattern to weekly
        recurrence_days: selectedDays, // Use selectedDays directly (no need to wrap in an array)
        group_id: userData.group_id, // Include group_id when adding the duty
      };

      const { data, error } = await supabase
        .from("duties_list")
        .insert([dutyToInsert]); // Insert a single duty

      if (error) throw error;

      console.log("Duty added successfully:", data);
      fetchDuties(); // Refresh the duties list after adding
    } catch (error) {
      console.error("Error adding duty:", error.message);
      // Optionally, set an error state to display a message in the UI
    } finally {
      setIsAddModalOpen(false); // Close the modal after submission
    }
  };

  const handleRemoveUser = async (dutyId, userId) => {
    try {
      const { error } = await supabase
        .from("user_assignments")
        .delete()
        .eq("duties_id", dutyId)
        .eq("user_id", userId);

      if (error) throw error;

      console.log("User unassigned successfully");
      fetchDuties(); // Refresh the duties list after unassigning
    } catch (error) {
      console.error("Error unassigning user:", error.message);
    }
  };

  // Handle opening the Edit Duty modal
  const handleOpenEditModal = (duty) => {
    setSelectedDuty(duty);
    setIsEditModalOpen(true);
  };

  // Handle editing a duty
  const handleEditDuty = async (updatedDuty) => {
    try {
      const { dutyName, dutyDescription, dutyDueDate } = updatedDuty;

      const { error } = await supabase
        .from("duties_list")
        .update({
          duty_name: dutyName,
          duty_description: dutyDescription,
          duty_due_date: dutyDueDate,
        })
        .eq("duties_id", selectedDuty.duties_id);

      if (error) throw error;

      console.log("Duty updated successfully");
      fetchDuties(); // Refresh the duties list after editing
    } catch (error) {
      console.error("Error editing duty:", error.message);
    } finally {
      setIsEditModalOpen(false); // Close the modal after editing
      setSelectedDuty(null);
    }
  };

  // Handle opening the Delete Duty modal
  const handleOpenDeleteModal = (duty) => {
    setSelectedDuty(duty);
    setIsDeleteModalOpen(true);
  };

  // Handle deleting a duty
  const handleDeleteDuty = async () => {
    try {
      const { error } = await supabase
        .from("duties_list")
        .delete()
        .eq("duties_id", selectedDuty.duties_id);

      if (error) throw error;

      console.log("Duty deleted successfully");
      fetchDuties(); // Refresh the duties list after deleting
    } catch (error) {
      console.error("Error deleting duty:", error.message);
    } finally {
      setIsDeleteModalOpen(false); // Close the modal after deleting
      setSelectedDuty(null);
    }
  };

  // Handle opening the Assign Users modal
  const handleOpenAssignModal = (duty) => {
    setCurrentDuty(duty);
    fetchUsers(duty.duties_id); // Fetch users for the selected duty
    setIsAssignUsersModalOpen(true);
  };

  // Handle assigning users to a duty
  const handleAssignUsers = async (userIds) => {
    try {
      const assignments = userIds.map((userId) => ({
        duties_id: currentDuty.duties_id,
        user_id: userId,
      }));

      const { error } = await supabase
        .from("user_assignments")
        .insert(assignments);

      if (error) throw error;

      console.log("Users assigned successfully");
      fetchDuties(); // Refresh the duties list after assigning users
    } catch (error) {
      console.error("Error assigning users:", error.message);
    } finally {
      setIsAssignUsersModalOpen(false); // Close the modal after assigning
      setCurrentDuty(null);
    }
  };

  // Handle opening the Overview modal
  const handleOpenOverviewModal = (duty) => {
    setSelectedDuty(duty);
    setIsOverviewModalOpen(true);
  };

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">Volunteer Duties</h1>
      <Button onClick={() => setIsAddModalOpen(true)}>Add Duty</Button>
      <div className="mt-4 grid grid-cols-1 gap-4">
        {loading ? (
          <p>Loading duties...</p>
        ) : (
          duties.map((duty) => (
            <DutyCard
              key={duty.duties_id}
              duty={duty}
              onEdit={() => handleOpenEditModal(duty)}
              onDelete={() => handleOpenDeleteModal(duty)}
              onAssignUsers={() => handleOpenAssignModal(duty)}
              onOpenOverview={() => handleOpenOverviewModal(duty)}
            />
          ))
        )}
      </div>

      {/* Duty Form Modal */}
      <DutyFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddDuty}
      />

      {/* Edit Duty Modal */}
      {selectedDuty && (
        <EditDutyModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleEditDuty}
          duty={selectedDuty}
        />
      )}

      {/* Delete Duty Modal */}
      {selectedDuty && (
        <DeleteDutyModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteDuty}
        />
      )}

      {/* Assign Users Modal */}
      {currentDuty && (
        <AssignUsersModal
          isOpen={isAssignUsersModalOpen}
          onClose={() => setIsAssignUsersModalOpen(false)}
          onAssign={handleAssignUsers}
          users={users}
        />
      )}

      {/* Overview Modal */}
      {selectedDuty && (
        <OverviewModal
          isOpen={isOverviewModalOpen}
          onClose={() => setIsOverviewModalOpen(false)}
          duty={selectedDuty}
          onRemoveUser={handleRemoveUser}
        />
      )}
    </div>
  );
};

export default VolunteerDuties;
