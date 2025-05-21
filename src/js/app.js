// filepath: d:\Github-Master\RK-Calendar\app.js
document.addEventListener('DOMContentLoaded', () => {
    const currentMonthYearEl = document.getElementById('currentMonthYear');
    const calendarGridEl = document.getElementById('calendarGrid');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const activityForm = document.getElementById('activityForm');
    const activityTableBody = document.getElementById('activityTableBody');
    const departmentSelect = document.getElementById('department');
    const filterDepartmentDashboardSelect = document.getElementById('filterDepartmentDashboard');
    const activityListEl = document.getElementById('activityList');
    const filterTimeRangeSelect = document.getElementById('filterTimeRange');
    const itemsPerPageSelect = document.getElementById('itemsPerPage');
    const paginationControlsEl = document.getElementById('paginationControls');
    const activityDetailPopup = document.getElementById('activityDetailPopup');
    const popupDateEl = document.getElementById('popupDate');
    const popupActivityListEl = document.getElementById('popupActivityList');
    const closePopupBtn = document.getElementById('closePopupBtn');
    const popupOverlay = document.getElementById('popupOverlay');
    const saveButtonText = document.getElementById('saveButtonText');
    const activityIdInput = document.getElementById('activityId');
    const resetFormButton = document.getElementById('resetFormButton');
    const addActivityButton = document.getElementById('addActivityButton');
    const activityFormModal = document.getElementById('activityFormModal');
    const closeFormModalBtn = document.getElementById('closeFormModalBtn');
    const activityFormOverlay = document.getElementById('activityFormOverlay');


    // !!! IMPORTANT: REPLACE WITH YOUR DEPLOYED GOOGLE APPS SCRIPT URL !!!
    const GOOGLE_APPS_SCRIPT_URL = 'YOUR_DEPLOYED_WEB_APP_URL_HERE';

    const departments = [
        "วิชาการ", "งบประมาณ", "บุคคล", "ทั่วไป", "นวัตกรรม",
        "ปกครอง", "อาคารสถานที่", "โครงการสานฝันฯ", "โครงการประชารัฐฯ", "โครงการพระราชดำริ"
    ];

    const departmentColors = {
        "วิชาการ": "#3498db", "งบประมาณ": "#2ecc71", "บุคคล": "#e74c3c", "ทั่วไป": "#f1c40f",
        "นวัตกรรม": "#9b59b6", "ปกครอง": "#e67e22", "อาคารสถานที่": "#1abc9c",
        "โครงการสานฝันฯ": "#34495e", "โครงการประชารัฐฯ": "#7f8c8d", "โครงการพระราชดำริ": "#d35400"
    };

    const holidays = { // YYYY-MM-DD: "Description"
        "2025-01-01": "วันขึ้นปีใหม่",
        "2025-01-01": "วันใช้รัฐธรรมนูญ",
        "2025-01-02": "วันหยุดชดเชยวันสิ้นปี",
        "2025-02-13": "วันมาฆบูชา",
        "2025-04-06": "วันจักรี",
        "2025-04-13": "วันสงกรานต์",
        "2025-04-14": "วันสงกรานต์",
        "2025-04-15": "วันสงกรานต์",
        "2025-04-16": "วันหยุดชดเชยวันสงกรานต์",
        "2025-05-01": "วันแรงงานแห่งชาติ",
        "2025-05-05": "วันฉัตรมงคล",
        "2025-05-12": "วันหยุดชดเชยวันพืชมงคล",
        "2025-05-24": "วันวิสาขบูชา",
        "2025-06-03": "วันเฉลิมพระชนมพรรษาสมเด็จพระราชินี",
        "2025-07-21": "วันอาสาฬหบูชา",
        "2025-07-22": "วันเข้าพรรษา",
        "2025-07-28": "วันเฉลิมพระชนมพรรษา ร.10",
        "2025-08-12": "วันแม่แห่งชาติ",
        "2025-10-13": "วันคล้ายวันสวรรคต ร.9",
        "2025-10-23": "วันปิยมหาราช",
        "2025-12-05": "วันคล้ายวันพระราชสมภพ ร.9",
        "2025-12-10": "วันรัฐธรรมนูญ",
        "2025-12-31": "วันสิ้นปี",
    };


    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let activities = loadActivitiesFromLocalStorage();
    let pieChartInstance = null;
    let ganttChartInstance = null;

    let currentPage = 1;
    let itemsPerPage = parseInt(itemsPerPageSelect.value) || 10; // Ensure a default value

    function populateDepartmentDropdowns() {
        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept;
            option.textContent = dept;
            departmentSelect.appendChild(option.cloneNode(true));
            filterDepartmentDashboardSelect.appendChild(option);
        });
    }    // Activity Form Modal Handlers
    function openActivityFormModal() {
        activityFormModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
    }

    function closeActivityFormModal() {
        activityFormModal.classList.add('hidden');
        document.body.style.overflow = ''; // Restore scrolling
    }

    addActivityButton.addEventListener('click', () => {
        // Reset form when opening it for a new activity
        activityForm.reset();
        activityIdInput.value = '';
        saveButtonText.textContent = 'บันทึกข้อมูล';
        flatpickr("#startDate").clear();
        flatpickr("#endDate").clear();
        openActivityFormModal();
    });

    closeFormModalBtn.addEventListener('click', closeActivityFormModal);
    activityFormOverlay.addEventListener('click', closeActivityFormModal);

    function getLocalDate(date) {
        const offset = new Date().getTimezoneOffset();
        return new Date(date.getTime() - (offset * 60 * 1000));
    }

    function renderCalendar(month, year) {
        calendarGridEl.innerHTML = '';
        const thaiYear = year + 543;
        currentMonthYearEl.textContent = `${new Date(year, month).toLocaleString('th-TH', { month: 'long' })} ${thaiYear}`;

        const firstDayOfMonth = getLocalDate(new Date(year, month, 1)).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const dayNames = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];
        dayNames.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'font-semibold text-blue-750 p-2 text-center text-xs md:text-sm';
            dayHeader.textContent = day;
            calendarGridEl.appendChild(dayHeader);
        });

        let dayOffset = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1;

        for (let i = 0; i < dayOffset; i++) {
            calendarGridEl.appendChild(document.createElement('div'));
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            const currentDate = getLocalDate(new Date(year, month, day));
            const dateStr = currentDate.toISOString().split('T')[0];

            dayCell.className = 'calendar-day p-1 md:p-2 border border-white border-opacity-20 rounded-lg cursor-pointer flex flex-col items-center justify-start text-white relative min-h-[80px] md:min-h-[100px]';
            dayCell.dataset.date = dateStr;

            const dateNumberWrapper = document.createElement('div');
            dateNumberWrapper.className = 'date-number-wrapper w-6 h-6 md:w-7 md:h-7 flex items-center justify-center mb-1 text-sm md:text-base';
            const dateNumber = document.createElement('span');
            dateNumber.className = 'date-number';
            dateNumber.textContent = day;
            dateNumberWrapper.appendChild(dateNumber);
            dayCell.appendChild(dateNumberWrapper);

            if (holidays[dateStr]) {
                dayCell.setAttribute('data-holiday', 'true');
                dateNumberWrapper.classList.add('bg-pink-300');
                const holidayName = document.createElement('div');
                holidayName.className = 'holiday-name';
                holidayName.textContent = holidays[dateStr];
                holidayName.title = holidays[dateStr];
                dayCell.appendChild(holidayName);
            }

            const activitiesOnThisDay = getActivitiesForDate(currentDate);
            if (activitiesOnThisDay.length > 0 && !holidays[dateStr]) {
                dateNumberWrapper.classList.add('bg-blue-300'); // Uses CSS for color
            }

            if (activitiesOnThisDay.length > 0) {
                const activityIndicatorContainer = document.createElement('div');
                activityIndicatorContainer.className = 'activity-indicator-container';
                activitiesOnThisDay.slice(0, 2).forEach(act => {
                    const activityText = document.createElement('div');
                    activityText.className = 'activity-text';
                    activityText.textContent = act.name;
                    activityText.title = act.name;
                    activityIndicatorContainer.appendChild(activityText);
                });
                if (activitiesOnThisDay.length > 2) {
                    const moreText = document.createElement('div');
                    moreText.className = 'more-activities';
                    moreText.textContent = `+${activitiesOnThisDay.length - 2} เพิ่มเติม`;
                    activityIndicatorContainer.appendChild(moreText);
                }
                dayCell.appendChild(activityIndicatorContainer);
            }
            dayCell.addEventListener('click', () => openPopup(currentDate, activitiesOnThisDay));
            calendarGridEl.appendChild(dayCell);
        }
    }

    prevMonthBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar(currentMonth, currentYear);
    });

    nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar(currentMonth, currentYear);
    });

    function openPopup(date, activitiesOnDay) {
        const localDate = getLocalDate(date);
        popupDateEl.textContent = `กิจกรรมวันที่ ${localDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}`;
        popupActivityListEl.innerHTML = '';
        let contentExists = false;

        const dateStr = localDate.toISOString().split('T')[0];
        if (holidays[dateStr]) {
            const holidayItem = document.createElement('div');
            holidayItem.className = 'p-3 mb-2 bg-pink-100 rounded-lg shadow text-gray-800';
            holidayItem.innerHTML = `<h4 class="font-semibold text-pink-700">${holidays[dateStr]} (วันหยุดพิเศษ)</h4>`;
            popupActivityListEl.appendChild(holidayItem);
            contentExists = true;
        }

        activitiesOnDay.forEach(activity => {
            const item = document.createElement('div');
            item.className = 'p-3 mb-2 bg-blue-50 rounded-lg shadow text-gray-800';
            item.innerHTML = `
                <h4 class="font-semibold text-blue-700">${activity.name}</h4>
                <p class="text-sm text-gray-600">สำนัก: ${activity.department}</p>
                <p class="text-sm text-gray-600">วันที่: ${new Date(activity.startDate).toLocaleDateString('th-TH')} - ${new Date(activity.endDate).toLocaleDateString('th-TH')}</p>
                ${activity.remarks ? `<p class="text-xs text-gray-500 mt-1">หมายเหตุ: ${activity.remarks}</p>` : ''}
            `;
            popupActivityListEl.appendChild(item);
            contentExists = true;
        });

        if (!contentExists) {
            popupActivityListEl.innerHTML = '<p class="text-gray-600">ไม่มีกิจกรรมหรือวันหยุดในวันนี้</p>';
        }
        activityDetailPopup.classList.remove('hidden');
        popupOverlay.classList.remove('hidden');
    }

    function closePopup() {
        activityDetailPopup.classList.add('hidden');
        popupOverlay.classList.add('hidden');
    }
    closePopupBtn.addEventListener('click', closePopup);
    popupOverlay.addEventListener('click', closePopup);

    function loadActivitiesFromLocalStorage() {
        const data = localStorage.getItem('activities_romklao'); // Use a more specific key
        return data ? JSON.parse(data) : [];
    }

    function saveAllActivitiesToLocalStorage() {
        localStorage.setItem('activities_romklao', JSON.stringify(activities));
    }

    function addActivityToLocalStorage(activity) {
        activity.id = activity.id || Date.now().toString();
        activities.push(activity);
        saveAllActivitiesToLocalStorage();
    }

    function updateActivityInLocalStorage(updatedActivity) {
        const index = activities.findIndex(act => act.id === updatedActivity.id);
        if (index > -1) {
            activities[index] = updatedActivity;
            saveAllActivitiesToLocalStorage();
        }
    }

    function deleteActivityFromLocalStorage(activityId) {
        activities = activities.filter(activity => activity.id !== activityId);
        saveAllActivitiesToLocalStorage();
    }

    flatpickr("#startDate", { dateFormat: "Y-m-d", locale: "th", altInput: true, altFormat: "j F พ.ศ. Y", allowInput: true });
    flatpickr("#endDate", { dateFormat: "Y-m-d", locale: "th", altInput: true, altFormat: "j F พ.ศ. Y", allowInput: true });

    activityForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = new FormData(activityForm);
        const activityId = formData.get('activityId');
        const activity = {
            id: activityId || Date.now().toString(),
            name: formData.get('activityName'),
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
            department: formData.get('department'),
            remarks: formData.get('remarks'),
        };

        if (!activity.name || !activity.startDate || !activity.endDate || !activity.department) {
            Swal.fire('ข้อผิดพลาด!', 'กรุณากรอกข้อมูลที่จำเป็น (ชื่อ, วันที่เริ่ม-สิ้นสุด, สำนัก)', 'error');
            return;
        }
        if (new Date(activity.endDate) < new Date(activity.startDate)) {
            Swal.fire('ข้อผิดพลาด!', 'วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น', 'error');
            return;
        }

        if (activityId) { // Editing existing activity
            updateActivityInLocalStorage(activity);
        } else { // Adding new activity
            addActivityToLocalStorage(activity);
        }

        if (GOOGLE_APPS_SCRIPT_URL !== 'YOUR_DEPLOYED_WEB_APP_URL_HERE' && GOOGLE_APPS_SCRIPT_URL !== '') {
             sendDataToGoogleAppsScript(activity, !!activityId); // Pass true if it's an update
        } else {
            console.warn("Google Apps Script URL not configured. Data not sent to Google Sheet.");
        }        Swal.fire({
            title: 'สำเร็จ!',
            text: `กิจกรรม "${activity.name}" ถูก${activityId ? 'อัปเดต' : 'บันทึก'}เรียบร้อยแล้ว`,
            icon: 'success',
            confirmButtonText: 'ตกลง',
            confirmButtonColor: '#3b82f6'
        });

        activityForm.reset();
        activityIdInput.value = '';
        saveButtonText.textContent = 'บันทึกข้อมูล';
        flatpickr("#startDate").clear(); // Clear flatpickr instances
        flatpickr("#endDate").clear();
        closeActivityFormModal(); // Close the modal after submission

        activities = loadActivitiesFromLocalStorage();
        renderActivityTable();
        renderCalendar(currentMonth, currentYear);
        renderActivityList();
        renderPieChart();
        renderGanttChart();
    });

    resetFormButton.addEventListener('click', () => {
        activityForm.reset();
        activityIdInput.value = '';
        saveButtonText.textContent = 'บันทึกข้อมูล';
        flatpickr("#startDate").clear();
        flatpickr("#endDate").clear();
    });

    function sendDataToGoogleAppsScript(activity, isUpdate = false) {
        if (GOOGLE_APPS_SCRIPT_URL === 'YOUR_DEPLOYED_WEB_APP_URL_HERE' || GOOGLE_APPS_SCRIPT_URL === '') {
            console.warn("Skipping sendDataToGoogleAppsScript: URL not configured.");
            return;
        }
        const callbackName = 'gasCallback_' + Date.now();
        window[callbackName] = function(response) {
            console.log('GAS Response:', response);
            if (response && response.status === 'success') {
                console.log('Data successfully sent to Google Sheet:', response.message);
            } else {
                console.error('Error sending data to Google Sheet:', response ? response.message : 'Unknown error');
                Swal.fire('ข้อผิดพลาด Google Sheet', `ไม่สามารถบันทึกข้อมูลไปยัง Google Sheet ได้: ${response ? response.message : 'ไม่ทราบสาเหตุ'}`, 'warning');
            }
            delete window[callbackName];
            const scriptTag = document.getElementById(callbackName); // Get script by ID
            if (scriptTag) scriptTag.remove();
        };

        const script = document.createElement('script');
        script.id = callbackName; // Assign an ID to the script tag for removal
        const params = new URLSearchParams({
            callback: callbackName,
            action: isUpdate ? 'update' : 'append', // Add action parameter
            id: activity.id,
            name: activity.name,
            startDate: activity.startDate,
            endDate: activity.endDate,
            department: activity.department,
            remarks: activity.remarks,
            timestamp: new Date().toISOString()
        });
        script.src = `${GOOGLE_APPS_SCRIPT_URL}?${params.toString()}`;
        script.onerror = () => { // Handle network errors or if Apps Script URL is wrong
            console.error('Error loading Google Apps Script. Check URL and network.');
             Swal.fire('ข้อผิดพลาดการเชื่อมต่อ', 'ไม่สามารถเชื่อมต่อกับ Google Apps Script ได้. กรุณาตรวจสอบ URL และการเชื่อมต่ออินเทอร์เน็ต', 'error');
            delete window[callbackName];
            if (script.parentNode) script.parentNode.removeChild(script);
        };
        document.head.appendChild(script);
    }

    function renderActivityTable() {

        console.log('renderActivityTable START. activities.length:', activities.length, 'currentPage:', currentPage, 'itemsPerPage:', itemsPerPage);
        activityTableBody.innerHTML = '';
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedActivities = activities.slice().sort((a,b) => new Date(b.startDate) - new Date(a.startDate)).slice(startIndex, endIndex); // Sort by most recent first for table

        if (paginatedActivities.length === 0 && activities.length > 0) {
            currentPage = Math.max(1, currentPage - 1);
            renderActivityTable();
            return;
        }
        if (paginatedActivities.length === 0) {
            activityTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-400">ยังไม่มีกิจกรรมที่บันทึกไว้</td></tr>`;
            renderPaginationControls();
            return;
        }

        paginatedActivities.forEach(activity => {
            const row = activityTableBody.insertRow();
            row.className = 'bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600';
            row.innerHTML = `
                <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">${activity.name}</td>
                <td class="px-4 py-3">${new Date(activity.startDate).toLocaleDateString('th-TH', {day:'2-digit', month:'short', year:'numeric'})}</td>
                <td class="px-4 py-3">${new Date(activity.endDate).toLocaleDateString('th-TH', {day:'2-digit', month:'short', year:'numeric'})}</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 text-xs font-medium rounded-full department-color-${activity.department.replace(/[^ก-๙a-zA-Z0-9]/g, '')}">
                        ${activity.department}
                    </span>
                </td>
                <td class="px-4 py-3 text-xs max-w-[150px] md:max-w-xs truncate" title="${activity.remarks || ''}">${activity.remarks || '-'}</td>
                <td class="px-4 py-3 flex items-center space-x-2">
                    <button class="edit-btn text-blue-500 hover:text-blue-700 p-1" data-id="${activity.id}" title="แก้ไข">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg>
                    </button>
                    <button class="delete-btn text-red-500 hover:text-red-700 p-1" data-id="${activity.id}" title="ลบ">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                    </button>
                </td>
            `;
        });
        addTableEventListeners();
        renderPaginationControls();
    }
    
    function addTableEventListeners() {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', function() {
                const activityId = this.dataset.id;
                const activityToEdit = activities.find(act => act.id === activityId);
                if (activityToEdit) {
                    activityIdInput.value = activityToEdit.id;
                    document.getElementById('activityName').value = activityToEdit.name;
                    flatpickr("#startDate").setDate(activityToEdit.startDate, true);
                    flatpickr("#endDate").setDate(activityToEdit.endDate, true);
                    document.getElementById('department').value = activityToEdit.department;
                    document.getElementById('remarks').value = activityToEdit.remarks || '';
                    saveButtonText.textContent = 'อัปเดตข้อมูล';
                    // Open the form modal
                    openActivityFormModal();
                }
            });
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                const activityId = this.dataset.id;
                const activityToDelete = activities.find(act => act.id === activityId);
                Swal.fire({
                    title: `ต้องการลบกิจกรรม "${activityToDelete ? activityToDelete.name : ''}"?`,
                    text: "การดำเนินการนี้ไม่สามารถย้อนกลับได้!",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'ใช่, ลบเลย!',
                    cancelButtonText: 'ยกเลิก'
                }).then((result) => {
                    if (result.isConfirmed) {
                        deleteActivityFromLocalStorage(activityId);
                         if (GOOGLE_APPS_SCRIPT_URL !== 'YOUR_DEPLOYED_WEB_APP_URL_HERE' && GOOGLE_APPS_SCRIPT_URL !== '') {
                            sendDataToGoogleAppsScript({ id: activityId, action: 'delete' }, true); // Send delete action
                        }
                        activities = loadActivitiesFromLocalStorage();
                        renderActivityTable();
                        if (document.getElementById('calendarDashboard').classList.contains('active') || !document.getElementById('calendarDashboard').classList.contains('hidden')) {
                            renderCalendar(currentMonth, currentYear);
                            renderActivityList();
                            renderPieChart();
                            renderGanttChart();
                        }
                        Swal.fire('ลบแล้ว!', 'กิจกรรมถูกลบเรียบร้อยแล้ว', 'success');
                    }
                });
            });
        });
    }

    itemsPerPageSelect.addEventListener('change', (e) => {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        renderActivityTable();
    });

    function renderPaginationControls() {
        paginationControlsEl.innerHTML = '';
        const totalPages = Math.ceil(activities.length / itemsPerPage);
        if (totalPages <= 1) return;

        const createButton = (text, page, isDisabled = false, isCurrent = false) => {
            const button = document.createElement('button');
            button.innerHTML = text;
            button.className = `px-3 py-1 rounded-lg text-sm ${isCurrent ? 'bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`;
            button.disabled = isDisabled;
            if (!isDisabled && !isCurrent) {
                button.addEventListener('click', () => {
                    currentPage = page;
                    renderActivityTable();
                });
            }
            return button;
        };

        paginationControlsEl.appendChild(createButton('<< แรก', 1, currentPage === 1));
        paginationControlsEl.appendChild(createButton('< ก่อน', currentPage - 1, currentPage === 1));

        // Simplified page numbers: current, and +/- 1 or 2
        let startPage = Math.max(1, currentPage - 1);
        let endPage = Math.min(totalPages, currentPage + 1);
        if (currentPage === 1) endPage = Math.min(totalPages, 3);
        if (currentPage === totalPages) startPage = Math.max(1, totalPages - 2);


        for (let i = startPage; i <= endPage; i++) {
            paginationControlsEl.appendChild(createButton(i, i, false, i === currentPage));
        }

        paginationControlsEl.appendChild(createButton('ถัด >', currentPage + 1, currentPage === totalPages));
        paginationControlsEl.appendChild(createButton('สุด >>', totalPages, currentPage === totalPages));
    }

    function getActivitiesForDate(date) {
        const localDate = getLocalDate(date);
        const dateString = localDate.toISOString().split('T')[0];
        return activities.filter(activity => {
            const startDate = activity.startDate.split('T')[0];
            const endDate = activity.endDate.split('T')[0];
            return dateString >= startDate && dateString <= endDate;
        });
    }

    function filterActivitiesForList() {
        let filtered = [...activities];
        const timeRange = filterTimeRangeSelect.value;
        const departmentFilter = filterDepartmentDashboardSelect.value;
        const now = getLocalDate(new Date());
        const today = getLocalDate(new Date(now.getFullYear(), now.getMonth(), now.getDate())); // Normalize today to start of day

        if (timeRange === 'week') {
            const dayOfWeek = today.getDay(); // Sunday = 0, Monday = 1, ...
            const startOfWeek = getLocalDate(new Date(today));
            startOfWeek.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Monday

            const endOfWeek = getLocalDate(new Date(startOfWeek));
            endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

            filtered = filtered.filter(act => {
                const actStart = getLocalDate(new Date(act.startDate));
                const actEnd = getLocalDate(new Date(act.endDate));
                return actStart <= endOfWeek && actEnd >= startOfWeek;
            });
        } else if (timeRange === 'month') {
            const firstDayOfMonth = getLocalDate(new Date(today.getFullYear(), today.getMonth(), 1));
            const lastDayOfMonth = getLocalDate(new Date(today.getFullYear(), today.getMonth() + 1, 0));
            filtered = filtered.filter(act => {
                const actStart = getLocalDate(new Date(act.startDate));
                const actEnd = getLocalDate(new Date(act.endDate));
                return actStart <= lastDayOfMonth && actEnd >= firstDayOfMonth;
            });
        } else if (timeRange === 'year') {
            const firstDayOfYear = getLocalDate(new Date(today.getFullYear(), 0, 1));
            const lastDayOfYear = getLocalDate(new Date(today.getFullYear(), 11, 31));
            filtered = filtered.filter(act => {
                const actStart = getLocalDate(new Date(act.startDate));
                const actEnd = getLocalDate(new Date(act.endDate));
                return actStart <= lastDayOfYear && actEnd >= firstDayOfYear;
            });
        }

        if (departmentFilter !== 'all') {
            filtered = filtered.filter(act => act.department === departmentFilter);
        }
        return filtered.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    }

    function renderActivityList() {
        activityListEl.innerHTML = '';
        const filteredActivities = filterActivitiesForList();

        if (filteredActivities.length === 0) {
            activityListEl.innerHTML = '<p class="text-gray-300 p-3 text-center">ไม่มีกิจกรรมตามเงื่อนไขที่เลือก</p>';
            return;
        }

        filteredActivities.forEach(activity => {
            const item = document.createElement('div');
            item.className = 'p-3 bg-white bg-opacity-30 rounded-lg shadow-md backdrop-blur-sm text-gray-100';
            item.innerHTML = `
                <h4 class="font-semibold text-white">${activity.name}</h4>
                <p class="text-xs text-gray-200">
                    ${new Date(activity.startDate).toLocaleDateString('th-TH', {day:'2-digit', month:'short'})} - ${new Date(activity.endDate).toLocaleDateString('th-TH', {day:'2-digit', month:'short', year:'numeric'})}
                </p>
                <p class="text-xs text-gray-200">สำนัก: ${activity.department}</p>
                ${activity.remarks ? `<p class="text-xs text-gray-300 mt-1">หมายเหตุ: ${activity.remarks}</p>` : ''}
            `;
            activityListEl.appendChild(item);
        });
    }

    filterTimeRangeSelect.addEventListener('change', renderActivityList);
    filterDepartmentDashboardSelect.addEventListener('change', renderActivityList);

    function renderPieChart() {
        const ctx = document.getElementById('departmentPieChart').getContext('2d');
        const departmentCounts = {};
        departments.forEach(dept => departmentCounts[dept] = 0);

        activities.forEach(activity => {
            if (departmentCounts.hasOwnProperty(activity.department)) {
                departmentCounts[activity.department]++;
            }
        });

        if (pieChartInstance) pieChartInstance.destroy();
        pieChartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(departmentCounts),
                datasets: [{
                    label: 'จำนวนกิจกรรม',
                    data: Object.values(departmentCounts),
                    backgroundColor: Object.keys(departmentCounts).map(dept => departmentColors[dept] || '#cccccc'),
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: 'white', font: { family: "'Prompt', sans-serif" } } },
                    tooltip: { titleFont: { family: "'Prompt', sans-serif"}, bodyFont: { family: "'Prompt', sans-serif"} }
                }
            }
        });
    }

    function renderGanttChart() {
        console.log("renderGanttChart: Function called");
        const ganttCanvas = document.getElementById('activityGanttChart');
        if (!ganttCanvas) {
            console.error("renderGanttChart: Canvas element 'activityGanttChart' not found!");
            return;
        }
        const ctx = ganttCanvas.getContext('2d');
        if (!ctx) {
            console.error("renderGanttChart: Failed to get 2D context from canvas.");
            return;
        }
        console.log("renderGanttChart: Canvas and context obtained.");

        const chartActivities = filterActivitiesForList();
        console.log("renderGanttChart: chartActivities from filterActivitiesForList():", JSON.parse(JSON.stringify(chartActivities)));

        const validChartActivities = chartActivities.filter(activity => {
            const sDate = new Date(activity.startDate);
            const eDate = new Date(activity.endDate);
            return !isNaN(sDate.getTime()) && !isNaN(eDate.getTime());
        });

        if (validChartActivities.length !== chartActivities.length) {
            console.warn("renderGanttChart: Some activities were filtered out due to invalid dates.");
        }

        const ganttData = validChartActivities.map(activity => {
             const start = getLocalDate(new Date(activity.startDate));
             const end = getLocalDate(new Date(activity.endDate));
             // Ensure end date is at least one day for visibility if start and end are same
             if (start.getTime() === end.getTime()) {
                end.setDate(end.getDate() + 1);
             }
            return {
                x: [start.getTime(), end.getTime()],
                y: activity.name,
                department: activity.department,
                originalStartDate: activity.startDate, // For debugging
                originalEndDate: activity.endDate     // For debugging
            };
        }).sort((a,b) => a.x[0] - b.x[0]);
        console.log("renderGanttChart: Mapped ganttData:", JSON.parse(JSON.stringify(ganttData)));

        if (ganttChartInstance) {
            console.log("renderGanttChart: Destroying existing Gantt chart instance.");
            ganttChartInstance.destroy();
        }

        const chartDataConfig = {
            labels: ganttData.map(d => d.y),
            datasets: [{
                label: 'ระยะเวลากิจกรรม',
                data: ganttData.map(d => ({ x: d.x, y: d.y })),
                backgroundColor: (context) => {
                    // Ensure chartActivities here refers to the filtered validChartActivities
                    const activity = validChartActivities.find(act => act.name === context.raw.y);
                    return activity ? (departmentColors[activity.department] || '#cccccc') : '#cccccc';
                },
                borderRadius: 4, borderSkipped: false, barPercentage: 0.7, categoryPercentage: 0.8
            }]
        };
        console.log("renderGanttChart: chartDataConfig:", JSON.parse(JSON.stringify(chartDataConfig)));

        let minDateTimestamp;
        if (validChartActivities.length > 0) {
            const startTimestamps = validChartActivities.map(a => new Date(a.startDate).getTime()).filter(t => !isNaN(t));
            if (startTimestamps.length > 0) {
                minDateTimestamp = new Date(Math.min(...startTimestamps)).setHours(0, 0, 0, 0);
            } else {
                minDateTimestamp = new Date().setHours(0, 0, 0, 0); // Fallback if all dates were invalid
            }
        } else {
            minDateTimestamp = new Date().setHours(0, 0, 0, 0);
        }
        console.log("renderGanttChart: Calculated minDateTimestamp for X-axis:", minDateTimestamp, new Date(minDateTimestamp).toUTCString());

        ganttChartInstance = new Chart(ctx, {
            type: 'bar',
            data: chartDataConfig,
            options: {
                indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'time',
                        time: { unit: 'day', tooltipFormat: 'dd MMM yy', displayFormats: { day: 'dd MMM' } },
                        min: minDateTimestamp, // Use the robustly calculated minDateTimestamp
                        grid: { color: 'rgba(255, 255, 255, 0.2)' },
                        ticks: { color: 'white', font: { family: "'Prompt', sans-serif" } }
                    },
                    y: {
                         grid: { display: false },
                        ticks: { color: 'white', font: { family: "'Prompt', sans-serif", size: 10 } }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (context) => context[0].label,
                            label: (context) => {
                                const startDate = new Date(context.raw.x[0]).toLocaleDateString('th-TH', {day:'numeric', month:'short'});
                                
                                // Use validChartActivities for lookup here as well
                                const originalActivity = validChartActivities.find(act => act.name === context.raw.y);
                                let displayEndDateStr = '';
                                let departmentName = 'N/A';

                                if (originalActivity) {
                                    departmentName = originalActivity.department;
                                    const actualEndDate = new Date(originalActivity.endDate); // Use original endDate from activity
                                    displayEndDateStr = actualEndDate.toLocaleDateString('th-TH', {day:'numeric', month:'short', year:'numeric'});
                                } else {
                                    const fallbackEndDate = new Date(context.raw.x[1]);
                                    // Adjust if it was artificially extended by one day
                                    const startOfFallbackEnd = new Date(fallbackEndDate).setHours(0,0,0,0);
                                    const startOfContextRawX0 = new Date(context.raw.x[0]).setHours(0,0,0,0);
                                    if (context.raw.x[0] === context.raw.x[1] - (24 * 60 * 60 * 1000) && startOfFallbackEnd !== startOfContextRawX0) {
                                         // This implies it might have been a single-day event extended for chart visibility
                                         // So, display the date before the one in context.raw.x[1]
                                         const correctedFallbackEndDate = new Date(fallbackEndDate.getTime() - (24 * 60 * 60 * 1000));
                                         displayEndDateStr = correctedFallbackEndDate.toLocaleDateString('th-TH', {day:'numeric', month:'short', year:'numeric'});
                                    } else {
                                        displayEndDateStr = fallbackEndDate.toLocaleDateString('th-TH', {day:'numeric', month:'short', year:'numeric'});
                                    }
                                }

                                return [`สำนัก: ${departmentName}`, `ระยะเวลา: ${startDate} - ${displayEndDateStr}`];
                            }
                        },
                        backgroundColor: 'rgba(0,0,0,0.8)', titleFont: { family: "'Prompt', sans-serif", size: 14 },
                        bodyFont: { family: "'Prompt', sans-serif", size: 12 }, padding: 10, displayColors: false
                    }
                }
            }
        });
    }
    
    
    function initializeApp() {
        populateDepartmentDropdowns();
        if (activities.length === 0) { // Add example data only if local storage is empty
            const todayForExample = new Date();
            const exampleActivities = [
                { id: 'ex1', name: "ประชุมเตรียมงานกีฬาสี", startDate: new Date(todayForExample.getFullYear(), todayForExample.getMonth(), 15).toISOString().split('T')[0], endDate: new Date(todayForExample.getFullYear(), todayForExample.getMonth(), 15).toISOString().split('T')[0], department: "ปกครอง", remarks: "ที่ห้องประชุม 1" },
                { id: 'ex2', name: "อบรม AI สำหรับครู", startDate: new Date(todayForExample.getFullYear(), todayForExample.getMonth(), 20).toISOString().split('T')[0], endDate: new Date(todayForExample.getFullYear(), todayForExample.getMonth(), 22).toISOString().split('T')[0], department: "นวัตกรรม", remarks: "สำหรับครูผู้สอน" },
                { id: 'ex3', name: "กิจกรรมวันภาษาไทย", startDate: new Date(todayForExample.getFullYear(), 6, 29).toISOString().split('T')[0], endDate: new Date(todayForExample.getFullYear(), 6, 29).toISOString().split('T')[0], department: "วิชาการ", remarks: "ณ ลานกิจกรรม (ถ้าปีปัจจุบัน)" },
            ];
            exampleActivities.forEach(act => addActivityToLocalStorage(act)); // Use addActivity which calls saveAll
            activities = loadActivitiesFromLocalStorage(); // Reload
        }

        renderCalendar(currentMonth, currentYear);
        renderActivityList();
        renderPieChart();
        renderGanttChart();
        console.log('About to call renderActivityTable from initializeApp. activities count:', activities.length, 'currentPage:', currentPage, 'itemsPerPage:', itemsPerPage);
        renderActivityTable();
    }

    initializeApp();
});
