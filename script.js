document.addEventListener('DOMContentLoaded', () => {
    const API_URL = "https://rezotest-dkg4dsdze2c3e7c5.italynorth-01.azurewebsites.net/api/Tigric/restaurant-details";
    const calendarGrid = document.querySelector('.calendar-grid');
    const monthYear = document.getElementById('monthYear');
    const reservationList = document.getElementById('reservationList');
    const selectedDateElement = document.getElementById('selectedDate');

    const today = new Date();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();

    // Prikaz meseca i godine
    function displayMonthYear() {
        const date = new Date(currentYear, currentMonth);
        monthYear.textContent = date.toLocaleString('sr-Latn', {
            year: 'numeric',
            month: 'long'
        });
    }

    // Generisanje kalendarskih dana
    async function generateCalendar() {
        calendarGrid.innerHTML = '';
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        // Preuzimanje rezervacija za označavanje dana
        let reservationsByDay = {};
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("Greška prilikom preuzimanja podataka");
            const data = await response.json();

            // Grupisanje rezervacija po datumu sa statusom "Active"
            data.reservations.forEach(res => {
                if (res.status === "Active") {
                    const date = new Date(res.reservationDate).toISOString().split('T')[0];
                    if (!reservationsByDay[date]) {
                        reservationsByDay[date] = 1; // Inicijalizujemo broj rezervacija za taj datum
                    } else {
                        reservationsByDay[date]++; // Povećavamo broj rezervacija za taj datum
                    }
                }
            });
        } catch (error) {
            console.error("Greška prilikom preuzimanja rezervacija:", error);
        }

        // Dodavanje praznih ćelija za dane pre prvog dana meseca
        for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('empty-cell');
            calendarGrid.appendChild(emptyCell);
        }

        // Kreiranje dana u mesecu
        for (let day = 1; day <= daysInMonth; day++) {
            const date = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const dayButton = document.createElement('button');
            dayButton.textContent = day;
            dayButton.classList.add('calendar-day');

            // Provera za današnji datum
            if (currentYear === today.getFullYear() && currentMonth === today.getMonth() && day === today.getDate()) {
                dayButton.classList.add('today');
            }

            // Provera za datume sa aktivnim rezervacijama
            if (reservationsByDay[date]) {
                dayButton.classList.add('reserved-day'); // Dodaj klasu za žutu boju
            }

            // Klik na dan
            dayButton.addEventListener('click', () => {
                // Očisti prethodni selektovani dan
                document.querySelectorAll('.calendar-day').forEach(btn => btn.classList.remove('selected-day'));
                dayButton.classList.add('selected-day'); // Dodaj klasu za selektovani dan
                loadReservations(date);
            });

            calendarGrid.appendChild(dayButton);
        }
    }

    // Učitavanje rezervacija
    async function loadReservations(date) {
        selectedDateElement.textContent = date;
        reservationList.innerHTML = '<li>Učitavanje rezervacija...</li>';
        try {
            const response = await fetch(API_URL);
            const data = await response.json();

            const activeReservations = data.reservations.filter(res =>
                res.status === "Active" &&
                new Date(res.reservationDate).toISOString().split('T')[0] === date
            );

            const pendingReservations = data.reservations.filter(res =>
                res.status === "Pending" &&
                new Date(res.reservationDate).toISOString().split('T')[0] === date
            );

            if (activeReservations.length === 0 && pendingReservations.length === 0) {
                reservationList.innerHTML = '<li>Nema rezervacija za izabrani datum.</li>';
                return;
            }

            reservationList.innerHTML = `
                ${activeReservations.map(res => `
                    <li class="active-reservation">
                        <span>${res.client.name} </span>
                        <span>${new Date(res.reservationDate).toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })}</span>
                    </li>
                `).join('')}
                ${pendingReservations.map(res => `
                    <li class="pending-reservation">
                        <span>${res.client.name} (Na čekanju)</span>
                        <span>${new Date(res.reservationDate).toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })}</span>
                    </li>
                `).join('')}
            `;
        } catch (error) {
            console.error("Greška prilikom učitavanja rezervacija:", error);
            reservationList.innerHTML = '<li>Došlo je do greške prilikom učitavanja podataka.</li>';
        }
    }

    // Navigacija meseca
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        displayMonthYear();
        generateCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        displayMonthYear();
        generateCalendar();
    });

    // Inicijalizacija
    displayMonthYear();
    generateCalendar();
    loadReservations(`${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`);
});
