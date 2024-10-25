import { useState, useEffect } from "react";
import { Button } from "../../shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../shadcn/dialog";
import { Input } from "../../shadcn/input";
import { Label } from "../../shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../shadcn/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { userAttendance, fetchAllEvents } from "@/api/userService";
import moment from "moment";

const attendanceCodeSchema = z.object({
  attendanceCode: z
    .string()
    .length(6, "Attendance code must be exactly 6 digits.")
    .regex(/^\d{6}$/, "Attendance code must be a number."),
});

export default function EditRegistrationv1() {
  const [isEditing, setIsEditing] = useState(false);
  const [attendees, setAttendees] = useState([{ firstName: "", lastName: "" }]); // Store attendee details
  const [eventList, setEventList] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(""); // Store selected event
  const [eventDate, setEventDate] = useState(""); // Store selected event date
  const [eventTimeList, setEventTimeList] = useState([]); // Store event times

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(attendanceCodeSchema),
  });

  const attendanceSubmit = async (data) => {
    try {
      const { data: dataAttendance, error } = await userAttendance(
        data.attendanceCode,
      );

      if (error) {
        console.error("Error fetching attendance:", error);
        alert(error); // Consider using a better UI for errors
        return;
      }

      if (!dataAttendance || dataAttendance.length === 0) {
        alert("No attendance found for the provided code.");
        return;
      }

      if (dataAttendance.length > 0) {
        const newAttendees = dataAttendance.map((item) => ({
          id: item.id,
          firstName: item.attendee_first_name,
          lastName: item.attendee_last_name,
        }));
        setAttendees(newAttendees); // Update state with new attendees
      }

      // Populate the edit form with the retrieved data
      setIsEditing(true);
      setValue(
        "main_applicant_first_name",
        dataAttendance[0].main_applicant_first_name,
      );
      setValue(
        "main_applicant_last_name",
        dataAttendance[0].main_applicant_last_name,
      );
      setValue("telephone", dataAttendance[0].telephone);

      setSelectedEvent(dataAttendance[0].selected_event);
      console.log(selectedEvent);
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while submitting the attendance.");
    }
  };

  const handleEditSubmit = async (eventData) => {
    // Handle the editing of the registration here
    console.log("Editing registration data:", eventData);
    // You can call your update API here
    closeModal(); // Close modal after submission
  };

  const handleAddAttendee = () => {
    setAttendees([...attendees, { firstName: "", lastName: "" }]);
  };

  const handleRemoveAttendee = (index) => {
    const updatedAttendees = attendees.filter((_, i) => i !== index);
    setAttendees(updatedAttendees);
  };

  const handleAttendeeInputChange = (index, field, value) => {
    const updatedAttendees = [...attendees];
    updatedAttendees[index][field] = value;
    setAttendees(updatedAttendees);
  };

  const closeModal = () => {
    reset();
    setIsEditing(false);
  };

  // fetch events
  // Fetch all events on component mount
  useEffect(() => {
    const fetchedEvents = async () => {
      try {
        const events = await fetchAllEvents();
        if (events.length > 0) {
          setEventList(events);
        } else {
          console.error("No schedule found");
        }
      } catch (error) {
        console.error("Failed to load schedule", error);
      }
    };
    fetchedEvents();
  }, []);

  return (
    <Dialog onOpenChange={closeModal}>
      <DialogTrigger asChild>
        <Button variant="outline">Edit Registration</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Registration" : "Enter Code"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your registration details."
              : "Enter the code to make changes to your registration."}
          </DialogDescription>
        </DialogHeader>

        {/* Code Input Form */}
        {!isEditing && (
          <form onSubmit={handleSubmit(attendanceSubmit)}>
            <div className="grid w-full gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="code">Attendance Code</Label>
                <Input
                  id="code"
                  type="text" // Change to text for regex validation
                  placeholder="Enter your code"
                  {...register("attendanceCode")}
                  className="col-span-6"
                  required
                />
                {errors.attendanceCode && (
                  <span className="text-red-500">
                    {errors.attendanceCode.message}
                  </span>
                )}
              </div>
              <Button type="submit">Submit</Button>
            </div>
          </form>
        )}

        {/* Edit Registration Form */}
        {isEditing && (
          <form
            onSubmit={handleSubmit(handleEditSubmit)}
            className="no-scrollbar max-h-[30rem] overflow-scroll"
          >
            <div className="grid w-full items-center gap-4 p-2">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="event">Upcoming Events</Label>
                <Select
                  value={selectedEvent}
                  {...register("selected_event")}
                  onValueChange={(value) => {
                    const selectedEventDetails = eventList.find(
                      (item) => item.id === value,
                    );
                    if (selectedEventDetails) {
                      setSelectedEvent(selectedEventDetails.name);
                      setEventDate(selectedEventDetails.schedule_date);
                      setEventTimeList(selectedEventDetails.time);
                      setValue("selected_event", value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Event">
                      {selectedEvent || "Select Event"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {eventList.map((eventItem) => (
                      <SelectItem key={eventItem.id} value={eventItem.id}>
                        {`${eventItem.name} (${moment(eventItem.schedule_date).format("MMMM Do YYYY")})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedEvent && (
                  <span>
                    Event Date:{" "}
                    <strong>{moment(eventDate).format("MMMM Do YYYY")}</strong>
                  </span>
                )}
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="time">Select Time</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Time" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="time1">Time 1</SelectItem>
                    <SelectItem value="time2">Time 2</SelectItem>
                    {/* Add more times dynamically if needed */}
                  </SelectContent>
                </Select>
              </div>

              <Label>Parent/Carer Information</Label>
              <div className="flex flex-col gap-2 md:flex-row">
                <Input
                  {...register("main_applicant_first_name")}
                  placeholder="First name"
                  className="w-full md:w-1/3"
                />
                <Input
                  {...register("main_applicant_last_name")}
                  placeholder="Last name"
                  className="w-full md:w-1/3"
                />
                <Input
                  {...register("telephone")}
                  placeholder="Telephone"
                  className="w-full md:w-1/3"
                />
              </div>

              <Label>Attendee Information</Label>
              {attendees.map((attendee, index) => (
                <div key={index} className="flex flex-col gap-2 md:flex-row">
                  <Input
                    value={attendee.firstName}
                    onChange={(e) =>
                      handleAttendeeInputChange(
                        index,
                        "firstName",
                        e.target.value,
                      )
                    }
                    placeholder="First name"
                  />
                  <Input
                    value={attendee.lastName}
                    onChange={(e) =>
                      handleAttendeeInputChange(
                        index,
                        "lastName",
                        e.target.value,
                      )
                    }
                    placeholder="Last name"
                  />
                  {attendees.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => handleRemoveAttendee(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <div>
                <Button
                  type="button"
                  onClick={handleAddAttendee}
                  className="mt-2"
                >
                  Add
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit">Submit</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
