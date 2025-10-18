//  -----------------------------------------
//  AENTIS FANTASY CALENDAR (with Years & Events)
//  -----------------------------------------

const aentisCalendar = {
    days: [
        "Priun", "Seduo", "Teria", "Quor", "Kinque",
        "Lisea", "Derko", "Octre", "Norqu", "Dectium"
    ],
    months: [
        "Mane", "Occa", "Solis", "Dinem", "Tae",
        "Pluvia", "Tibus", "Zardus", "Iffen", "Mirtes", "Phobos"
    ],
    daysPerMonth: 40,
    weeksPerMonth: 4,

    // Historical events
    events: {
        "750-Mane-1": {
            title: "Beginning of the 750th Year",
            desc: "The start of a new cycle in the Era of Equilibrium, celebrated with grand festivals."
        },
        "750-Solis-15": {
            title: "Festival of Sunreach",
            desc: "Honoring the longest day of the Aentian calendar. Citizens feast under banners of gold and white."
        },
        "748-Tibus-40": {
            title: "End of the War of Mists",
            desc: "A peace treaty was signed, ending decades of conflict among the mist-covered isles."
        },
        "746-Mirtes-12": {
            title: "Birth of Allen II Hestein",
            desc: "The future Emperor of the Hestein Empire was born in the royal city of Roseward."
        }
    },

    getEvent(year, month, day) {
        const key = `${year}-${month}-${day}`;
        return this.events[key] || null;
    },

    // Season logic
    getSeason(monthName, day) {
        const order = this.months.indexOf(monthName) + 1;
        const dayOfYear = (order - 1) * 40 + day;
        const seasonBoundaries = [
            { start: 1, name: "Jenous (Season of Blossom)" },
            { start: 89, name: "Maethur (Season of Heat)" },
            { start: 177, name: "Sindder (Season of Ashes)" },
            { start: 265, name: "Laghor (Season of Mist and Wither)" },
            { start: 353, name: "Hobttus (Season of Snow)" },
        ];

        let season = seasonBoundaries[0].name;
        for (let i = 0; i < seasonBoundaries.length; i++) {
            if (dayOfYear >= seasonBoundaries[i].start) {
                season = seasonBoundaries[i].name;
            }
        }
        return season;
    }
};

let currentMonth = 0;
let currentYear = 750;

//  -----------------------------------------
//  RENDER CALENDAR
//  -----------------------------------------
function renderAentisCalendar() {
    const monthName = aentisCalendar.months[currentMonth];
    const grid = document.getElementById("calendar-grid");
    const monthLabel = document.getElementById("month-name");
    const seasonLabel = document.getElementById("season-name");
    const yearDisplay = document.getElementById("year-display");

    if (!grid || !monthLabel || !seasonLabel || !yearDisplay) return;

    grid.innerHTML = "";
    monthLabel.textContent = monthName;
    yearDisplay.textContent = `${currentYear} EE`;
    seasonLabel.textContent = aentisCalendar.getSeason(monthName, 1);

    // Weekday headers
    aentisCalendar.days.forEach(day => {
        const cell = document.createElement("div");
        cell.className = "day header";
        cell.textContent = day;
        grid.appendChild(cell);
    });

    // Generate 40 days
    for (let i = 1; i <= aentisCalendar.daysPerMonth; i++) {
        const cell = document.createElement("div");
        cell.className = "day";
        const event = aentisCalendar.getEvent(currentYear, monthName, i);
        cell.textContent = i;

        if (event) {
            cell.classList.add("special");

            // Custom tooltip
            const tooltip = document.createElement("div");
            tooltip.className = "event-tooltip";
            tooltip.innerHTML = `<strong>${event.title}</strong><br>${event.desc}`;
            cell.appendChild(tooltip);

            // show/hide tooltip on hover
            cell.addEventListener("mouseenter", () => {
                tooltip.style.opacity = "1";
                tooltip.style.visibility = "visible";
            });
            cell.addEventListener("mouseleave", () => {
                tooltip.style.opacity = "0";
                tooltip.style.visibility = "hidden";
            });
        }

        grid.appendChild(cell);
    }
}

//  -----------------------------------------
//  INIT AND NAVIGATION
//  -----------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    const prev = document.getElementById("prev-month");
    const next = document.getElementById("next-month");

    if (prev && next) {
        prev.addEventListener("click", () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = aentisCalendar.months.length - 1;
                currentYear--;
            }
            renderAentisCalendar();
        });

        next.addEventListener("click", () => {
            currentMonth++;
            if (currentMonth >= aentisCalendar.months.length) {
                currentMonth = 0;
                currentYear++;
            }
            renderAentisCalendar();
        });
    }

    renderAentisCalendar();

    // -----------------------------------------
    //  MONTH-YEAR POPUP SELECTOR
    // -----------------------------------------
    const popup = document.getElementById("month-year-popup");
    const monthYearDisplay = document.getElementById("month-year-display");
    const monthGrid = document.getElementById("month-grid");
    const popupYearLabel = document.getElementById("popup-year-label");
    const prevYearBtn = document.getElementById("prev-year");
    const nextYearBtn = document.getElementById("next-year");

    if (!popup || !monthYearDisplay || !monthGrid) return;

    function updatePopup() {
        popupYearLabel.textContent = `${currentYear} EE`;
        monthGrid.innerHTML = "";

        aentisCalendar.months.forEach((m, i) => {
            const div = document.createElement("div");
            div.className = "month-option" + (i === currentMonth ? " active" : "");
            div.textContent = m;
            div.addEventListener("click", () => {
                currentMonth = i;
                renderAentisCalendar();
                popup.classList.add("hidden");
            });
            monthGrid.appendChild(div);
        });
    }

    // Toggle popup visibility
    monthYearDisplay.addEventListener("click", (e) => {
        e.stopPropagation();
        updatePopup();
        popup.classList.toggle("hidden");
    });

    prevYearBtn.addEventListener("click", () => {
        currentYear--;
        updatePopup();
    });

    nextYearBtn.addEventListener("click", () => {
        currentYear++;
        updatePopup();
    });

    // Close popup when clicking outside
    document.addEventListener("click", (e) => {
        if (!popup.contains(e.target) && !monthYearDisplay.contains(e.target)) {
            popup.classList.add("hidden");
        }
    });
});
