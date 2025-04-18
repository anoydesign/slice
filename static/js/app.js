document.addEventListener('DOMContentLoaded', function() {
    const defaultTimesStart = [
        '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00',
        '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
    ];

    const timeEntriesTable = document.getElementById('time-entries');
    const addRowBtn = document.getElementById('add-row-btn');
    const saveBtn = document.getElementById('save-btn');
    const saveBottomBtn = document.getElementById('save-bottom-btn');
    const importBtn = document.getElementById('import-btn');
    const dateInput = document.getElementById('date');
    const lastUpdated = document.getElementById('last-updated');
    const totalHours = document.getElementById('total-hours');
    const totalSlices = document.getElementById('total-slices');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const yesterdayBtn = document.getElementById('yesterday-btn');
    const lastWeekBtn = document.getElementById('last-week-btn');
    const presetTagsContainer = document.getElementById('preset-tags');
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingMessage = document.getElementById('loading-message');

    // DBタブ関連
    const dbAddBtn = document.getElementById('db-add-btn');
    const dbTypeSelect = document.getElementById('db-type');
    const dbValueInput = document.getElementById('db-value');
    const dbImportBtn = document.getElementById('db-import-btn');
    const dbItemContainers = {
        task: document.getElementById('task-items'),
        function: document.getElementById('function-items'),
        mall: document.getElementById('mall-items'),
        remark: document.getElementById('remark-items')
    };

    let dbItemsCache = [];
    let currentSuggestionBox = null;

    function showLoading(message = "処理中...") {
        loadingMessage.textContent = message;
        loadingOverlay.classList.add('show');
    }

    function hideLoading() {
        loadingOverlay.classList.remove('show');
    }

    function initialize() {
        setTodayDate();
        loadDbItems();
        loadEntriesForSelectedDate(dateInput.value, false);
        setupEventListeners();
    }

    function setupEventListeners() {
        dateInput.addEventListener('change', () => loadEntriesForSelectedDate(dateInput.value, true));
        addRowBtn.addEventListener('click', addEmptyRow);
        saveBtn.addEventListener('click', saveEntries);
        saveBottomBtn.addEventListener('click', saveEntries);
        importBtn.addEventListener('click', () => loadEntriesForSelectedDate(dateInput.value, false));
        yesterdayBtn.addEventListener('click', loadYesterdayEntries);
        lastWeekBtn.addEventListener('click', loadLastWeekEntries);

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(tab.dataset.tab + '-tab').classList.add('active');
            });
        });

        dbAddBtn.addEventListener('click', addDbItem);
        dbImportBtn.addEventListener('click', importDbItems);
        dbValueInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                addDbItem();
            }
        });

        Object.values(dbItemContainers).forEach(container => {
            container.addEventListener('click', function(event) {
                if (event.target.classList.contains('delete-btn')) {
                    const itemType = event.target.dataset.type;
                    const itemValue = event.target.dataset.value;
                    deleteDbItem(itemType, itemValue);
                }
            });
        });

        timeEntriesTable.addEventListener('click', function(event) {
            if (event.target.classList.contains('delete-row-btn')) {
                const row = event.target.closest('tr');
                if (row) {
                    const nextRow = row.nextElementSibling;
                    row.remove();
                    
                    // 削除後の行の時間を更新
                    const rows = timeEntriesTable.querySelectorAll('tbody tr');
                    if (rows.length > 0) {
                        let currentTime = rows[0].querySelector('.time-display').getAttribute('data-start-time');
                        rows.forEach(row => {
                            const timeDisplay = row.querySelector('.time-display');
                            const nextTime = getNextTimeSlot(currentTime);
                            updateTimeDisplay(timeDisplay, currentTime, nextTime);
                            currentTime = nextTime;
                        });
                    }
                    
                    updateStats();
                }
            } else if (event.target.classList.contains('duplicate-row-btn')) {
                duplicateRow(event.target);
            }
        });

        timeEntriesTable.addEventListener('input', function(event) {
            if (event.target.tagName === 'INPUT') {
                updateStats();
            }
        });

        presetTagsContainer.addEventListener('click', function(event) {
            if (event.target.classList.contains('preset-tag')) {
                const content = event.target.dataset.content;
                let focusedInput = document.querySelector('.task-input:focus');
                if (!focusedInput) {
                    const firstRowInput = timeEntriesTable.querySelector('tr .task-input');
                    if(firstRowInput) focusedInput = firstRowInput;
                }
                if (focusedInput) {
                    focusedInput.value = content;
                    updateStats();
                } else {
                    showTemporaryMessage('内容を入力したい行の入力欄をクリックしてから、プリセットタグを押してください。', 'warning');
                }
            }
        });

        // ドラッグ・アンド・ドロップのイベントリスナー
        timeEntriesTable.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const draggingRow = timeEntriesTable.querySelector('.dragging');
            if (!draggingRow) return;
            
            const rows = [...timeEntriesTable.querySelectorAll('tr:not(.dragging)')];
            const closestRow = rows.reduce((closest, row) => {
                const box = row.getBoundingClientRect();
                const offset = e.clientY - box.top - box.height / 2;
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: row };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
            
            if (closestRow) {
                timeEntriesTable.insertBefore(draggingRow, closestRow);
            } else {
                timeEntriesTable.appendChild(draggingRow);
            }
        });
        
        timeEntriesTable.addEventListener('drop', (e) => {
            e.preventDefault();
            const rows = timeEntriesTable.querySelectorAll('tbody tr');
            if (rows.length === 0) return;
            
            // 最初の行の開始時間を取得
            const firstTimeDisplay = rows[0].querySelector('.time-display');
            const firstTime = firstTimeDisplay ? firstTimeDisplay.getAttribute('data-start-time') : '';
            
            // すべての行の時間を更新
            let currentTime = firstTime;
            rows.forEach(row => {
                const timeDisplay = row.querySelector('.time-display');
                const nextTime = getNextTimeSlot(currentTime);
                updateTimeDisplay(timeDisplay, currentTime, nextTime);
                currentTime = nextTime;
            });
            
            updateStats();
        });
    }

    function updateTimeDisplay(timeDisplay, startTime, endTime) {
        if (!timeDisplay) return;
        timeDisplay.setAttribute('data-start-time', startTime || '');
        timeDisplay.setAttribute('data-end-time', endTime || '');
        timeDisplay.textContent = startTime && endTime ? `${startTime} - ${endTime}` : '';
    }

    function updateTimeSlots() {
        const rows = timeEntriesTable.querySelectorAll('tbody tr');
        if (rows.length === 0) return;

        let currentTime = rows[0].querySelector('.time-display')?.getAttribute('data-start-time') || '';
        
        rows.forEach(row => {
            const timeDisplay = row.querySelector('.time-display');
            if (timeDisplay) {
                const nextTime = getNextTimeSlot(currentTime);
                updateTimeDisplay(timeDisplay, currentTime, nextTime);
                currentTime = nextTime;
            }
        });
    }

    function setTodayDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${year}-${month}-${day}`;
    }

    function getOffsetDate(days) {
        const currentDate = new Date(dateInput.value);
        currentDate.setUTCDate(currentDate.getUTCDate() + days);
        const year = currentDate.getUTCFullYear();
        const month = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function loadDefaultTimeTable() {
        timeEntriesTable.innerHTML = '';
        defaultTimesStart.forEach(time => {
            createRow(time);
        });
        updateStats();
        lastUpdated.textContent = '最終更新: 新規入力待ち';
    }

    function loadEntriesForSelectedDate(selectedDate, showErrorIfNotFound = false) {
        if (!selectedDate) return;
        showLoading(`「${selectedDate}」のデータを読み込み中...`);
        fetch(`/api/time-entries/${selectedDate}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('データの読み込みに失敗しました');
                }
                return response.json();
            })
            .then(data => {
                hideLoading();
                if (data && data.length > 0) {
                    populateTable(data);
                    lastUpdated.textContent = `最終更新: ${selectedDate} のデータを読み込みました`;
                } else {
                    if (showErrorIfNotFound) {
                        showTemporaryMessage(`「${selectedDate}」のデータが見つかりませんでした。`, 'warning');
                        timeEntriesTable.innerHTML = '';
                        updateStats();
                        lastUpdated.textContent = `最終更新: ${selectedDate} のデータなし`;
                    } else {
                        loadDefaultTimeTable();
                        lastUpdated.textContent = `最終更新: ${selectedDate} のデータはありません`;
                    }
                }
            })
            .catch(error => {
                hideLoading();
                console.error("Error loading entries:", error);
                showTemporaryMessage(`データの読み込みに失敗しました: ${error.message}`, 'error');
                timeEntriesTable.innerHTML = '';
                updateStats();
                lastUpdated.textContent = '最終更新: 読み込みエラー';
            });
    }

    function loadYesterdayEntries() {
        const currentDate = dateInput.value;
        const yesterday = getOffsetDate(-1);
        loadEntriesForSelectedDate(yesterday, true);
        dateInput.value = currentDate; // 日付を元に戻す
    }

    function loadLastWeekEntries() {
        const lastWeek = getOffsetDate(-7);
        dateInput.value = lastWeek;
        loadEntriesForSelectedDate(lastWeek, true);
    }

    function populateTable(entries) {
        timeEntriesTable.innerHTML = '';
        if (!entries || entries.length === 0) {
            loadDefaultTimeTable();
            return;
        }
        entries.forEach(entry => {
            // 時間文字列を分解して開始時間と終了時間を取得
            const [startTime, endTime] = (entry.time || '').split(' - ');
            if (!startTime || !endTime) {
                console.error('無効な時間形式:', entry.time);
                return;
            }
            createRow(startTime, entry.task, entry.function, entry.mall, entry.remark);
        });
        updateTimeSlots();
        updateStats();
    }

    function getNextTimeSlot(timeStr) {
        if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) {
            console.error("無効な時間形式:", timeStr);
            return "00:00";
        }
        
        const [hours, minutes] = timeStr.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            console.error("無効な時間値:", hours, minutes);
            return "00:00";
        }

        let nextMinutes = minutes + 30;
        let nextHours = hours;
        
        if (nextMinutes >= 60) {
            nextMinutes -= 60;
            nextHours += 1;
        }
        
        if (nextHours >= 24) {
            nextHours -= 24;
        }
        
        return `${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`;
    }

    function createRow(startTime = '', task = '', functionValue = '', mall = '', remark = '') {
        const row = timeEntriesTable.insertRow();
        const endTime = startTime ? getNextTimeSlot(startTime) : '';
        
        // 時間が無効な場合のフォールバック
        if (!startTime || !endTime || startTime === '00:00' || endTime === '00:00') {
            if (defaultTimesStart.length > 0) {
                startTime = defaultTimesStart[0];
                endTime = getNextTimeSlot(startTime);
            }
        }
        
        row.innerHTML = `
            <td class="time-column">
                <div class="drag-handle" draggable="true">⋮⋮</div>
                <span class="time-display" data-start-time="${startTime}" data-end-time="${endTime}">
                    ${startTime && endTime ? `${startTime} - ${endTime}` : ''}
                </span>
            </td>
            <td><input type="text" class="task-input" value="${task}" placeholder="内容を入力"></td>
            <td><input type="text" class="function-input" value="${functionValue}" placeholder="機能を選択"></td>
            <td><input type="text" class="mall-input" value="${mall}" placeholder="モールを選択"></td>
            <td><input type="text" class="remark-input" value="${remark}" placeholder="備考を入力"></td>
            <td class="action-cell">
                <button class="icon-btn duplicate-row-btn" title="この行を複製">📋</button>
                <button class="icon-btn delete-row-btn" title="この行を削除">✖</button>
            </td>
        `;
        
        const dragHandle = row.querySelector('.drag-handle');
        
        dragHandle.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', row.rowIndex);
            row.classList.add('dragging');
        });
        
        dragHandle.addEventListener('dragend', () => {
            row.classList.remove('dragging');
        });
        
        attachSuggestionEvents(row);
    }

    function addEmptyRow() {
        const lastRow = timeEntriesTable.rows[timeEntriesTable.rows.length - 1];
        let nextTime = '';
        
        if (lastRow) {
            const timeDisplay = lastRow.querySelector('.time-display');
            if (timeDisplay) {
                nextTime = timeDisplay.getAttribute('data-end-time');
            }
        }
        
        if (!nextTime && defaultTimesStart.length > 0) {
            nextTime = defaultTimesStart[0];
        }
        
        createRow(nextTime, "", "", "", "");
        const newRow = timeEntriesTable.rows[timeEntriesTable.rows.length - 1];
        if (newRow) {
            const firstInput = newRow.querySelector('input[type="text"]');
            if (firstInput) {
                firstInput.focus();
            }
        }
        updateStats();
    }

    function duplicateRow(button) {
        const row = button.closest('tr');
        const timeDisplay = row.querySelector('.time-display');
        const startTime = timeDisplay.getAttribute('data-start-time');
        const endTime = timeDisplay.getAttribute('data-end-time');
        
        if (!startTime || !endTime) {
            showTemporaryMessage('時間が正しく設定されていません', 'error');
            return;
        }
        
        // 新しい時間を計算
        const newStartTime = endTime;
        const newEndTime = getNextTimeSlot(newStartTime);
        
        // 複製元の内容を取得
        const task = row.querySelector('.task-input').value;
        const functionValue = row.querySelector('.function-input').value;
        const mall = row.querySelector('.mall-input').value;
        const remark = row.querySelector('.remark-input').value;
        
        // 新しい行を作成（直後に挿入）
        const tbody = timeEntriesTable.querySelector('tbody') || timeEntriesTable;
        const newRow = document.createElement('tr');
        
        newRow.innerHTML = `
            <td class="time-column">
                <div class="drag-handle" draggable="true">⋮⋮</div>
                <span class="time-display" data-start-time="${newStartTime}" data-end-time="${newEndTime}">
                    ${newStartTime && newEndTime ? `${newStartTime} - ${newEndTime}` : ''}
                </span>
            </td>
            <td><input type="text" class="task-input" value="${task}" placeholder="内容を入力"></td>
            <td><input type="text" class="function-input" value="${functionValue}" placeholder="機能を選択"></td>
            <td><input type="text" class="mall-input" value="${mall}" placeholder="モールを選択"></td>
            <td><input type="text" class="remark-input" value="${remark}" placeholder="備考を入力"></td>
            <td class="action-cell">
                <button class="icon-btn duplicate-row-btn" title="この行を複製">📋</button>
                <button class="icon-btn delete-row-btn" title="この行を削除">✖</button>
            </td>
        `;
        
        // 行を挿入
        if (row.nextElementSibling) {
            tbody.insertBefore(newRow, row.nextElementSibling);
        } else {
            tbody.appendChild(newRow);
        }
        
        const dragHandle = newRow.querySelector('.drag-handle');
        
        dragHandle.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', newRow.rowIndex);
            newRow.classList.add('dragging');
        });
        
        dragHandle.addEventListener('dragend', () => {
            newRow.classList.remove('dragging');
        });
        
        // 後続の行の時間を更新
        let currentTime = newEndTime;
        let nextRow = newRow.nextElementSibling;
        while (nextRow) {
            const nextTimeDisplay = nextRow.querySelector('.time-display');
            const nextEndTime = getNextTimeSlot(currentTime);
            updateTimeDisplay(nextTimeDisplay, currentTime, nextEndTime);
            currentTime = nextEndTime;
            nextRow = nextRow.nextElementSibling;
        }
        
        // イベントリスナーを再設定
        attachSuggestionEvents(newRow);
        updateStats();
    }

    function saveEntries() {
        const rows = timeEntriesTable.querySelectorAll('tbody tr');
        const entries = [];
        let hasError = false;

        rows.forEach(row => {
            const timeDisplay = row.querySelector('.time-display');
            const startTime = timeDisplay ? timeDisplay.getAttribute('data-start-time') : '';
            const endTime = timeDisplay ? timeDisplay.getAttribute('data-end-time') : '';
            const task = row.querySelector('td:nth-child(2) input').value;
            const functionValue = row.querySelector('td:nth-child(3) input').value;
            const mall = row.querySelector('td:nth-child(4) input').value;
            const remark = row.querySelector('td:nth-child(5) input').value;

            if (!task.trim()) {
                showTemporaryMessage('内容が入力されていません', 'error');
                hasError = true;
                return;
            }

            entries.push({
                time: `${startTime} - ${endTime}`,
                task,
                function: functionValue,
                mall,
                remark
            });
        });

        if (hasError) {
            return;
        }

        showLoading('保存中...');
        fetch(`/api/time-entries/${dateInput.value}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(entries)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('保存に失敗しました');
            }
            return response.json();
        })
        .then(data => {
            showTemporaryMessage('保存しました', 'success');
            lastUpdated.textContent = `最終更新: ${data.updated_at}`;
        })
        .catch(error => {
            showTemporaryMessage(error.message, 'error');
        })
        .finally(() => {
            hideLoading();
        });
    }

    function updateStats() {
        const rows = timeEntriesTable.rows;
        let filledSlices = 0;
        for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].cells;
            if (cells.length < 5 || !cells[0].classList.contains('time-column')) continue;
            const task = cells[1].querySelector('input').value;
            const functionValue = cells[2].querySelector('input').value;
            const mall = cells[3].querySelector('input').value;
            const remarkInput = cells[4].querySelector('input').value;
            if (task || functionValue || mall || remarkInput) {
                filledSlices++;
            }
        }
        const totalHoursValue = filledSlices * 0.5;
        totalHours.textContent = `${totalHoursValue.toFixed(1)} 時間`;
        totalSlices.textContent = filledSlices;
    }

    function loadDbItems() {
        showLoading("業務データベースを読み込み中...");
        fetch('/api/db-items')
            .then(response => {
                if (!response.ok) {
                    throw new Error('業務データベースの読み込みに失敗しました');
                }
                return response.json();
            })
            .then(items => {
                hideLoading();
                if (items && items.error) {
                    console.error("Error loading DB items:", items.error);
                    showTemporaryMessage(`業務データベースの読み込みに失敗しました: ${items.error}`, 'error');
                    dbItemsCache = [];
                } else if (Array.isArray(items)) {
                    dbItemsCache = items;
                } else {
                    dbItemsCache = [];
                }
                renderDbItems();
                updateQuickPresets();
            })
            .catch(error => {
                hideLoading();
                console.error("Error loading DB items:", error);
                showTemporaryMessage(`業務データベースの読み込みに失敗しました: ${error.message}`, 'error');
                dbItemsCache = [];
                renderDbItems();
                updateQuickPresets();
            });
    }

    function renderDbItems() {
        console.log('業務データベースのレンダリングを開始します');
        // 各コンテナをクリア
        Object.values(dbItemContainers).forEach(container => {
            container.innerHTML = '';
        });

        // キャッシュされたアイテムを表示
        dbItemsCache.forEach(item => {
            const container = dbItemContainers[item.Type];
            if (container) {
                const itemElement = document.createElement('div');
                itemElement.className = 'db-item';
                itemElement.innerHTML = `
                    <span>${item.Value}</span>
                    <button class="delete-btn" data-type="${item.Type}" data-value="${item.Value}">×</button>
                `;
                container.appendChild(itemElement);
            }
        });
        console.log('業務データベースのレンダリングが完了しました');
    }

    function addDbItem() {
        const type = dbTypeSelect.value;
        const value = dbValueInput.value.trim();
        if (!value) {
            showTemporaryMessage("項目名を入力してください。", 'warning');
            return;
        }
        if (dbItemsCache.some(item => item.Type === type && item.Value === value)) {
            showTemporaryMessage(`「${type}」に「${value}」は既に存在します。`, 'info');
            return;
        }

        const newItem = { Type: type, Value: value };
        dbItemsCache.push(newItem);
        renderDbItems();
        updateQuickPresets();
        dbValueInput.value = '';
        saveDbItemsToServer();
    }

    function deleteDbItem(type, value) {
        dbItemsCache = dbItemsCache.filter(item => !(item.Type === type && item.Value === value));
        renderDbItems();
        updateQuickPresets();
        saveDbItemsToServer();
    }

    function saveDbItemsToServer() {
        fetch('/api/db-items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dbItemsCache)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('データベースの保存に失敗しました');
            }
            return response.json();
        })
        .then(data => {
            if (data && data.error) {
                console.error("Error saving DB items:", data.error);
                showTemporaryMessage(`データベースの保存に失敗しました: ${data.error}`, 'error');
                loadDbItems();
            } else {
                console.log("DB items saved successfully.");
            }
        })
        .catch(error => {
            console.error("Error saving DB items:", error);
            showTemporaryMessage(`データベースの保存に失敗しました: ${error.message}`, 'error');
            loadDbItems();
        });
    }

    function updateQuickPresets() {
        presetTagsContainer.innerHTML = '';
        const taskItems = dbItemsCache.filter(item => item.Type === 'task');
        if (taskItems.length === 0) {
            presetTagsContainer.innerHTML = '<span>登録済みの「内容」項目がありません。</span>';
            return;
        }
        taskItems.forEach(item => {
            const tag = document.createElement('span');
            tag.className = 'preset-tag';
            tag.dataset.content = item.Value;
            tag.textContent = item.Value;
            presetTagsContainer.appendChild(tag);
        });
    }

    function showTemporaryMessage(message, type = 'info', duration = 3000) {
        const existingMessage = document.querySelector('.temporary-message-popup');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = 'temporary-message-popup';
        messageDiv.textContent = message;

        switch (type) {
            case 'success':
                messageDiv.style.backgroundColor = 'rgba(40, 167, 69, 0.9)';
                break;
            case 'error':
                messageDiv.style.backgroundColor = 'rgba(220, 53, 69, 0.9)';
                break;
            case 'warning':
                messageDiv.style.backgroundColor = 'rgba(255, 193, 7, 0.9)';
                messageDiv.style.color = '#333';
                break;
            case 'info':
            default:
                messageDiv.style.backgroundColor = 'rgba(23, 162, 184, 0.9)';
                break;
        }

        document.body.appendChild(messageDiv);
        setTimeout(() => {
            messageDiv.style.opacity = '1';
        }, 10);

        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    document.body.removeChild(messageDiv);
                }
            }, 500);
        }, duration);
    }

    function attachSuggestionEvents(row) {
        const inputs = row.querySelectorAll('.task-input, .function-input, .mall-input, .remark-input');
        inputs.forEach(input => {
            input.addEventListener('focus', function(e) {
                showSuggestionBox(e.target);
            });
            input.addEventListener('input', function(e) {
                showSuggestionBox(e.target);
            });
            input.addEventListener('blur', function(e) {
                setTimeout(() => {
                    hideSuggestionBox();
                }, 200);
            });
        });
    }

    function showSuggestionBox(inputElement) {
        hideSuggestionBox();

        let type = "";
        if (inputElement.classList.contains("task-input")) {
            type = "task";
        } else if (inputElement.classList.contains("function-input")) {
            type = "function";
        } else if (inputElement.classList.contains("mall-input")) {
            type = "mall";
        } else if (inputElement.classList.contains("remark-input")) {
            type = "remark";
        }
        if (!type) return;

        const candidates = dbItemsCache.filter(item => item.type === type).slice(0, 5);
        if (candidates.length === 0) return;

        const box = document.createElement("div");
        box.className = "suggestion-box";
        box.style.position = "absolute";
        box.style.backgroundColor = "#fff";
        box.style.border = "1px solid #ccc";
        box.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
        box.style.zIndex = "10000";
        box.style.maxWidth = inputElement.offsetWidth + "px";

        candidates.forEach(candidate => {
            const itemDiv = document.createElement("div");
            itemDiv.className = "suggestion-item";
            itemDiv.textContent = candidate.value;
            itemDiv.style.padding = "5px 10px";
            itemDiv.style.cursor = "pointer";
            itemDiv.addEventListener("mousedown", function(e) {
                inputElement.value = candidate.value;
                hideSuggestionBox();
                updateStats();
                e.preventDefault();
            });
            box.appendChild(itemDiv);
        });

        const rect = inputElement.getBoundingClientRect();
        box.style.left = rect.left + window.scrollX + "px";
        box.style.top = rect.bottom + window.scrollY + "px";

        document.body.appendChild(box);
        currentSuggestionBox = box;
    }

    function hideSuggestionBox() {
        if (currentSuggestionBox) {
            currentSuggestionBox.remove();
            currentSuggestionBox = null;
        }
    }

    async function importDbItems() {
        console.log('業務データベースのインポートを開始します');
        showLoading('業務データベースをインポート中...');
        try {
            const response = await fetch('/api/db-items');
            if (!response.ok) {
                throw new Error('業務データベースの取得に失敗しました');
            }
            const items = await response.json();
            console.log('取得したデータ:', items);
            dbItemsCache = items;
            renderDbItems();
            showTemporaryMessage('業務データベースをインポートしました', 'success');
        } catch (error) {
            console.error('Error importing database items:', error);
            showTemporaryMessage('業務データベースのインポートに失敗しました: ' + error.message, 'error');
        } finally {
            hideLoading();
        }
    }

    initialize();
}); 