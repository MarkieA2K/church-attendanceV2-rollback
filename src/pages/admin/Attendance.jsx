import { useState, useEffect, useCallback } from "react";
import supabase from "../../api/supabase";
import { useForm } from "react-hook-form";
import AdminSidebar from "../../components/admin/AdminSidebar";
// import AddManualAttendance from "../../components/admin/AddManualAttendance";
import Table from "../../components/Table";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { CalendarIcon, Clock, Filter } from "lucide-react";
import { format } from "date-fns";
import { Button } from "../../shadcn/button";
import { Switch } from "../../shadcn/switch";
import { Calendar } from "../../shadcn/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../shadcn/popover";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../../shadcn/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../shadcn/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../shadcn/alert-dialog";
import { Label } from "../../shadcn/label";
import { Input } from "../../shadcn/input";
import downloadIcon from "../../assets/svg/download.svg";
import DialogWalkInRegister from "../registration/DialogWalkInRegister";
import { Icon } from "@iconify/react";

// Headers for table
const headers = [
  "Action",
  "#",
  "Children Name",
  "Guardian Name",
  "Telephone",
  "Status",
];

export default function Attendance() {
  const [data, setData] = useState([]); // Data from the database
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [availableTimes, setAvailableTimes] = useState([]);
  const [uniqueEvent, setUniqueEvent] = useState([]);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const itemsPerPage = 7;

  //isEditing
  const [editId, setEditId] = useState(null);

  //hook form
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  // Handle Update using react hook form
  const onSubmit = async (data) => {
    try {
      const { error } = await supabase
        .from("attendance_pending")
        .update(data)
        .eq("id", editId);

      if (error) throw error;

      // update local state to reflect the changes without needing to refetch
      setData((prevData) =>
        prevData.map((item) =>
          item.id === editId ? { ...item, ...data } : item,
        ),
      );
    } catch (error) {
      console.log("Error editing registration: ", error.message);
    }
  };

  const fetchData = useCallback(
    async (date, status, time, eventName) => {
      setLoading(true);
      setError(null);
      try {
        // Prepare query without date filter if no date is selected
        let query = supabase
          .from("attendance_pending")
          .select("*", { count: "exact" })
          .range(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage - 1,
          ); // Pagination

        // Apply date filter only if date is selected
        if (date) {
          const formattedDate = new Date(date).toISOString().split("T")[0]; // format the date
          query = query.eq("schedule_day", formattedDate);
        }

        // fetch or filter from preferred time
        if (time) {
          query = query.eq("preferred_time", time);
        }

        // fetch or filter from status
        if (status !== "all") {
          query = query.eq("has_attended", status === "attended");
        }

        // fetch the event name
        if (eventName && eventName !== "all") {
          query = query.eq("selected_event", eventName);
        }

        // fetching the data
        const { data: fetchedData, error, count } = await query;

        if (error) throw error;

        // calculate the pages
        setTotalPages(Math.ceil(count / itemsPerPage));

        // formatting the date
        const formattedData = fetchedData.map((item) => ({
          ...item,
          formattedDate: new Date(item.schedule_day).toLocaleDateString(
            "en-GB",
            {
              day: "numeric",
              month: "long",
              year: "numeric",
            },
          ),
        }));

        // extract the times and events
        const allData = await supabase
          .from("attendance_pending")
          .select("preferred_time, selected_event");

        const uniqueTimes = [
          ...new Set(allData.data.map((item) => item.preferred_time)),
        ];
        const uniqueEvent = [
          ...new Set(allData.data.map((item) => item.selected_event)),
        ];

        setData(formattedData); // formatted data
        console.log(data.map((item) => console.log(item.id)))
        setAvailableTimes(uniqueTimes); // format the available times
        setUniqueEvent(uniqueEvent); // set the events
      } catch (error) {
        setError("Error fetching data. Please try again.");
        console.error("Error in fetchData function:", error);
      } finally {
        setLoading(false);
      }
    },
    [currentPage, itemsPerPage],
  );

  // Fetch data when selectedDate, selectedTime, statusFilter, selectedEvent, or currentPage changes
  useEffect(() => {
    fetchData(selectedDate, statusFilter, selectedTime, selectedEvent);
  }, [
    selectedDate,
    selectedTime,
    statusFilter,
    selectedEvent,
    currentPage,
    fetchData,
  ]);

  // Set the selected date and reset to the first page
  const handleDateChange = (date) => {
    setSelectedDate(date ? new Date(date) : new Date());
    setCurrentPage(1);
  };

  // Set the Event and reset to the first page
  const handleEventName = (event) => {
    setSelectedEvent(event.target.value);
    setCurrentPage(1);
  };

  // Set the selected time and reset to the first page
  const handleTimeChange = (event) => {
    setSelectedTime(event.target.value);
    setCurrentPage(1);
  };

  // Set the status filter and reset to the first page
  const handleStatusChange = (event) => {
    setStatusFilter(event.target.value);
    setCurrentPage(1);
  };

  const handleUpdate = async (id) => {
    try {
      const itemToEdit = data.find((item) => item.id === id);
      if (itemToEdit) {
        setEditId(id);
        setValue("guardian_first_name", itemToEdit.guardian_first_name);
        setValue("guardian_last_name", itemToEdit.guardian_last_name);
        setValue("guardian_telephone", itemToEdit.guardian_telephone);
        // setValue("selectedEvent", itemToEdit.selected_event);
        // setValue("preferredTime", itemToEdit.preferred_time);
        setValue("children_first_name", itemToEdit.children_first_name);
        setValue("children_last_name", itemToEdit.children_last_name);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from("attendance_pending")
        .delete()
        .eq("id", id);

      if (error) throw error;

      //update local state to reflect the deletion
      setData((prevData) => prevData.filter((item) => item.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleSwitchChange = async (itemId, checked) => {
    try {
      // Update attendance status in the database
      const { error } = await supabase
        .from("attendance_pending")
        .update({ has_attended: checked })
        .eq("id", itemId);

      if (error) throw error;

      // Update the local data with the new attendance status
      const updatedData = data.map((dataItem) =>
        dataItem.id === itemId
          ? { ...dataItem, has_attended: checked }
          : dataItem,
      );
      setData(updatedData);
    } catch (error) {
      setError("Error updating attendance. Please try again.");
      console.error("Error in handleSwitchChange function:", error);
    }
  };

  // Filter attended data and format it for the Excel file
  const handleExportExcel = async () => {
    const attendedData = data
      .filter((item) => item.has_attended)
      .map((item) => ({
        "#": item.id,
        "Children Name": `${item.children_first_name} ${item.children_last_name}`,
        "Guardian Name": `${item.guardian_first_name} ${item.guardian_last_name}`,
        Telephone: item.guardian_telephone,
        Status: "Attended",
      }));

    // Create a new workbook and worksheet for the attendance data
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance");

    // Set the headers for the worksheet columns
    worksheet.columns = headers.map((header) => ({ header, key: header }));

    // Add the attended data to the worksheet
    attendedData.forEach((dataRow) => {
      worksheet.addRow(dataRow);
    });

    // Create a buffer and download the Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    const dataBlob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(dataBlob, "attendance_records.xlsx");
  };

  const rows = data.map((item, index) => [
    <Switch
      key={item.id}
      checked={item.has_attended}
      onCheckedChange={(checked) => handleSwitchChange(item.id, checked)}
      aria-label="Toggle attendance status"
    />,
    index + 1 + (currentPage - 1) * itemsPerPage,
    `${item.children_first_name} ${item.children_last_name}`,
    `${item.guardian_first_name} ${item.guardian_last_name}`,
    item.guardian_telephone,
    item.has_attended ? "Attended" : "Pending",
    <DropdownMenu key={item.id}>
      <DropdownMenuTrigger asChild>
        <button aria-label="Options">
          <Icon icon="tabler:dots" width="2em" height="2em" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <AlertDialog>
            <AlertDialogTrigger onClick={() => handleUpdate(item.id)}>
              Edit
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Edit</AlertDialogTitle>
              </AlertDialogHeader>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-2"
              >
                <div>
                  <Label>Guardian First Name</Label>
                  <Input
                    {...register("guardian_first_name", {
                      required: "First name is required",
                    })}
                    placeholder="Guardian First Name"
                  />
                  {errors.guardian_first_name && (
                    <p className="text-red-500">
                      {errors.guardian_first_name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Guardian Last Name</Label>
                  <Input
                    {...register("guardian_last_name", {
                      required: "Last name is required",
                    })}
                    placeholder="Guardian Last Name"
                  />
                  {errors.guardian_last_name && (
                    <p className="text-red-500">
                      {errors.guardian_last_name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Telephone</Label>
                  <Input
                    {...register("guardian_telephone", {
                      required: "Telephone is required",
                    })}
                    placeholder="Telephone"
                  />
                  {errors.guardian_telephone && (
                    <p className="text-red-500">
                      {errors.guardian_telephone.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Children First Name</Label>
                  <Input
                    {...register("children_first_name", {
                      required: "First name is required",
                    })}
                    placeholder="Children First Name"
                  />
                  {errors.children_first_name && (
                    <p className="text-red-500">
                      {errors.children_first_name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Children Last Name</Label>
                  <Input
                    {...register("children_last_name", {
                      required: "Last name is required",
                    })}
                    placeholder="Children Last Name"
                  />
                  {errors.children_last_name && (
                    <p className="text-red-500">
                      {errors.children_last_name.message}
                    </p>
                  )}
                </div>

                <AlertDialogFooter className="mt-2">
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction type="submit">Continue</AlertDialogAction>
                </AlertDialogFooter>
              </form>
              ;
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <AlertDialog>
            <AlertDialogTrigger>Delete</AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(item.id)}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  ]);

  return (
    <AdminSidebar>
      <main className="mx-auto max-w-7xl p-4 lg:p-8">
        <div className="mb-2 md:flex md:justify-between">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold">Attendance</h1>
            <p className="text-muted-foreground">
              Manage and track attendance records.
            </p>
          </div>
          <div className="pl-8">
            <DialogWalkInRegister
              btnName="Add manually"
              title="Add manually"
              description="Add attendance manually"
              btnSubmit="Submit"
            />
          </div>
        </div>
        <div className="mb-6 flex flex-col items-start space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
          <div className="flex items-center space-x-2 sm:w-auto">
            <CalendarIcon className="mr-2 h-4 w-4" />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal sm:w-[200px]"
                >
                  {format(selectedDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex w-full items-center space-x-2 sm:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedEvent || "all"}
              onChange={handleEventName}
              className="rounded-md border border-input bg-background p-2"
            >
              <option value="all">All</option>
              {uniqueEvent.map((events, index) => (
                <option key={index} value={events}>
                  {events}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-full items-center space-x-2 sm:w-auto">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedTime}
              onChange={handleTimeChange}
              className="rounded-md border border-input bg-background p-2"
            >
              <option value="" disabled={availableTimes.length === 0}>
                {availableTimes.length > 0
                  ? "Select Time"
                  : "No time available"}
              </option>
              {availableTimes.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          <div className="flex w-full items-center space-x-2 sm:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className="rounded-md border border-input bg-background p-2"
            >
              <option value="all">All</option>
              <option value="attended">Attended</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <Button
            onClick={handleExportExcel}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <img src={downloadIcon} alt="Download Icon" />
          </Button>
        </div>
        <div className="rounded-lg bg-card shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">
                Loading attendance records...
              </p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-destructive">{error}</p>
            </div>
          ) : data.length > 0 ? (
            <>
              <Table headers={headers} rows={rows} />
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage((prev) => prev - 1);
                      }}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, index) => (
                    <PaginationItem key={index}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === index + 1}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(index + 1);
                        }}
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages)
                          setCurrentPage((prev) => prev + 1);
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </>
          ) : (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">
                No attendance records found.
              </p>
            </div>
          )}
        </div>
      </main>
    </AdminSidebar>
  );
}
