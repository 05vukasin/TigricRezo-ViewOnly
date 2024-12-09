document.addEventListener('DOMContentLoaded', () => {
    const API_URL = "https://rezotest-dkg4dsdze2c3e7c5.italynorth-01.azurewebsites.net/api/Tigric/restaurant-details";
    const calendarGrid = document.querySelector('.calendar-grid');
    const monthYear = document.getElementById('monthYear');
    const reservationList = document.getElementById('reservationList');
    const selectedDateElement = document.getElementById('selectedDate');

    const popup = document.getElementById('reservationPopup');
    const closePopup = document.getElementById('closePopup');
    const popupClientName = document.getElementById('popupClientName');
    const popupClientPhone = document.getElementById('popupClientPhone');
    const popupClientEmail = document.getElementById('popupClientEmail');
    const popupReservationTime = document.getElementById('popupReservationTime');
    const popupNumberOfPeople = document.getElementById('popupNumberOfPeople');
    const popupComment = document.getElementById('popupComment');

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
            const data = await response.json();
            reservationsByDay = data.reservations.reduce((acc, res) => {
                if (res.status === "Active") {
                    const date = new Date(res.reservationDate).toISOString().split('T')[0];
                    acc[date] = true; // Označavanje da postoji rezervacija
                }
                return acc;
            }, {});
        } catch (error) {
            console.error("Greška prilikom preuzimanja rezervacija:", error);
        }
    
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('empty-cell');
            calendarGrid.appendChild(emptyCell);
        }
    
        for (let day = 1; day <= daysInMonth; day++) {
            const date = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const dayButton = document.createElement('button');
            dayButton.textContent = day;
            dayButton.classList.add('calendar-day');
    
            // Provera za današnje datume
            if (currentYear === today.getFullYear() && currentMonth === today.getMonth() && day === today.getDate()) {
                dayButton.classList.add('today');
            }
    
            // Provera za datume sa rezervacijama
            if (reservationsByDay[date]) {
                dayButton.classList.add('reserved-day');
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
    
            const reservations = data.reservations.filter(res =>
                res.status === "Active" &&
                new Date(res.reservationDate).toISOString().split('T')[0] === date
            );
    
            if (reservations.length === 0) {
                reservationList.innerHTML = '<li>Nema rezervacija za izabrani datum.</li>';
                return;
            }
    
            reservationList.innerHTML = reservations.map(res => ` 
                <li data-client='${JSON.stringify(res.client)}' data-time='${res.reservationDate}' data-people='${res.numberOfPeople}'>
                    <span>${res.client.name}</span>
                    <span>${new Date(res.reservationDate).toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })}</span>
                </li>
            `).join('');
    
            document.querySelectorAll('.reservation-list li').forEach(item => {
                item.addEventListener('click', () => {
                    const client = JSON.parse(item.getAttribute('data-client'));
                    popupClientName.textContent = client.name;
                    popupClientPhone.textContent = client.phone;
                    popupClientEmail.textContent = client.email || 'N/A';
                    popupReservationTime.textContent = new Date(item.getAttribute('data-time')).toLocaleString('sr-RS');
                    popupNumberOfPeople.textContent = item.getAttribute('data-people');
                    popupComment.textContent = client.comment || 'Nema komentara'; // Prikazuje komentar klijenta
                    popup.classList.remove('hidden');
                });
            });
        } catch (error) {
            console.error("Greška prilikom učitavanja rezervacija:", error);
            reservationList.innerHTML = '<li>Došlo je do greške prilikom učitavanja podataka.</li>';
        }
    }
    

    // Zatvaranje popupa
    closePopup.addEventListener('click', () => {
        popup.classList.add('hidden');
    });

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


closePopup.addEventListener('click', () => {
    popup.classList.add('hidden');
});
