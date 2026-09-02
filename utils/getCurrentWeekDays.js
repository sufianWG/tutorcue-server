const getCurrentWeekDays = () => {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const currentDay = today.getDay();

    const diff =
        currentDay === 0
            ? -6
            : 1 - currentDay;

    const monday = new Date(today);

    monday.setDate(today.getDate() + diff);

    const weekDays = [];

    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);

        date.setDate(monday.getDate() + i);

        weekDays.push({
            dateObject: date,

            dayFull: date.toLocaleDateString(
                "en-US",
                { weekday: "long" }
            ),

            dayShort: date.toLocaleDateString(
                "en-US",
                { weekday: "short" }
            ),

            dateNumber: String(
                date.getDate()
            ).padStart(2, "0"),

            month: date.toLocaleDateString(
                "en-US",
                { month: "short" }
            ),

            year: date.getFullYear()
        });
    }

    return weekDays;
};
module.exports = getCurrentWeekDays;