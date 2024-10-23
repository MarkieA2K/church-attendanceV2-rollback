import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "../../../shadcn/dialog"; // Import Shadcn Dialog components
import { Button } from "../../../shadcn/button"; // Import Shadcn Button component
import FullCalendar from "@fullcalendar/react"; // Import FullCalendar
import dayGridPlugin from "@fullcalendar/daygrid"; // Import Day Grid plugin
import timeGridPlugin from "@fullcalendar/timegrid"; // Import Time Grid plugin
import moment from "moment"; // Import moment.js for date manipulation

const OverviewModal = ({ isOpen, onRequestClose, duties }) => {
  // Create events based on the duties data
  const events = duties.flatMap((duty) =>
    duty.recurrence_days.map((day) => {
      const dayMoment = moment().day(day); // Get the current week's date for the specific day

      // Set the start and end time based on the duty's start and end times
      const startTime = dayMoment
        .set({
          hour: parseInt(duty.duty_start_time.split(":")[0]),
          minute: parseInt(duty.duty_start_time.split(":")[1]),
        })
        .format("YYYY-MM-DDTHH:mm:ss");

      const endTime = dayMoment
        .set({
          hour: parseInt(duty.duty_end_time.split(":")[0]),
          minute: parseInt(duty.duty_end_time.split(":")[1]),
        })
        .format("YYYY-MM-DDTHH:mm:ss");

      return {
        title: duty.duty_name,
        start: startTime, // Correctly set start date-time
        end: endTime, // Correctly set end date-time
        allDay: false, // Set to true if it's an all-day event
      };
    }),
  );

  return (
    <Dialog open={isOpen} onOpenChange={onRequestClose}>
      <DialogContent className="sm:max-w-[800px]">
        {/* FullCalendar Section */}
        <div className="py-4">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin]} // Include both plugins
            initialView="timeGridWeek" // Set the initial view to week
            events={events}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "timeGridWeek,timeGridDay", // Only week and day views
            }}
            height="500px" // Adjust height as needed
          />
        </div>

        {/* Dialog Footer with Actions */}
        <DialogFooter className="flex justify-end">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OverviewModal;