import { useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { FaCalendar, FaClock  } from "react-icons/fa6";

export default function Calendar({ selectedDate, onDateSelect }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hour, setHour] = useState(
    selectedDate ? selectedDate.getHours() : 8
  ); 
  const [minute, setMinute] = useState(
    selectedDate ? selectedDate.getMinutes() : 0
  );
  const [ampm, setAmPm] = useState(
    selectedDate && selectedDate.getHours() >= 12 ? "PM" : "AM"
  );

  const daysInMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const firstDayOfMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const generateCalendar = () => {
    const totalDays = daysInMonth(currentMonth);
    const firstDay = firstDayOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        i
      );
      days.push(date);
    }
    return days;
  };

  const updateSelected = (date, h = hour, m = minute, ap = ampm) => {
    let newHour = h;
    if (ap === "AM" && newHour === 12) newHour = 0;
    if (ap === "PM" && newHour !== 12) newHour = newHour + 12;

    const updated = new Date(date);
    updated.setHours(newHour);
    updated.setMinutes(m);
    updated.setSeconds(0);

    if (onDateSelect) onDateSelect(updated);
  };

  const handleDateClick = (date) => {
    updateSelected(date);
  };

  const handleHourChange = (val) => {
    setHour(val);
    if (selectedDate) updateSelected(selectedDate, val, minute, ampm);
  };

  const handleMinuteChange = (val) => {
    setMinute(val);
    if (selectedDate) updateSelected(selectedDate, hour, val, ampm);
  };

  const handleAmPmChange = (val) => {
    setAmPm(val);
    if (selectedDate) updateSelected(selectedDate, hour, minute, val);
  };

  const calendarDays = generateCalendar();

  const prevMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );

  const nextMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );

  const monthYearFormat = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(currentMonth);

  const displayHour = (() => {
    const h = selectedDate ? selectedDate.getHours() : hour;
    if (h === 0) return 12;
    if (h > 12) return h - 12;
    return h;
  })();

  return (
    <div className="rounded-sm mb-6">
      <legend className="label flex items-center gap-2"><FaCalendar />Date</legend>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1 rounded-full hover:bg-base-200">
          <FiChevronLeft size={20} />
        </button>
        <h4 className="font-medium">{monthYearFormat}</h4>
        <button onClick={nextMonth} className="p-1 rounded-full hover:bg-base-200">
          <FiChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-xs font-medium opacity-60 py-1">
            {day}
          </div>
        ))}

        {calendarDays.map((date, idx) => (
          <div key={idx} className="text-center py-0.5 px-4">
            {date ? (
              <button
                onClick={() => handleDateClick(date)}
                className={`w-full rounded-sm ${
                  selectedDate && date.toDateString() === selectedDate.toDateString()
                    ? "bg-primary text-white"
                    : "hover:bg-secondary hover:text-white"
                }`}
              >
                {date.getDate()}
              </button>
            ) : (
              <div className="py-2" />
            )}
          </div>
        ))}
      </div>

      <legend className="label flex items-center gap-2 mt-6"><FaClock />Time</legend>
      <div className="flex justify-center items-center gap-2 mt-1">
        <select
          value={displayHour}
          onChange={(e) => handleHourChange(parseInt(e.target.value))}
          className="select select-bordered select-sm"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
            <option key={h} value={h}>
              {h.toString().padStart(2, "0")}
            </option>
          ))}
        </select>
        :
        <select
          value={minute}
          onChange={(e) => handleMinuteChange(parseInt(e.target.value))}
          className="select select-bordered select-sm"
        >
          {Array.from({ length: 60 }, (_, i) => (
            <option key={i} value={i}>
              {i.toString().padStart(2, "0")}
            </option>
          ))}
        </select>
        <select
          value={ampm}
          onChange={(e) => handleAmPmChange(e.target.value)}
          className="select select-bordered select-sm"
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}
