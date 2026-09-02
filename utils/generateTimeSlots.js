const minutesToTime = (minutes) => {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;

    const formattedHour =
        String(hour).padStart(2, "0");

    const formattedMinute =
        String(minute).padStart(2, "0");

    return `${formattedHour}:${formattedMinute}`;
};


const generateTimeSlots = (
    start,
    end,
    duration = 60
) => {
    const [startHour, startMinute] =
        start.split(":").map(Number);

    const [endHour, endMinute] =
        end.split(":").map(Number);

    let current =
        startHour * 60 + startMinute;

    const endTime =
        endHour * 60 + endMinute;

    const slots = [];

    while (current + duration <= endTime) {

        slots.push({
            start: minutesToTime(current),
            end: minutesToTime(current + duration)
        });

        current += duration;
    }

    return slots;
};


module.exports = generateTimeSlots;