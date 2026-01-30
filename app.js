// Configuration
const BACKEND_URL = 'https://car-management-2-n35v.onrender.com';
const HOURLY_RATE = 50;
const TOTAL_SLOTS = 12;

// Application State
let parkingSlots = [];
let parkingTransactions = [];
let registeredVehicles = [];
let isBackendOnline = false;

// Initialize Application
function initApp() {
    updateTime();
    setInterval(updateTime, 1000);
    initializeSlots();
    checkBackendStatus();
    loadInitialData();
    updateUI();
    
    // Auto-refresh every 30 seconds
    setInterval(() => {
        checkBackendStatus();
        updateUI();
    }, 30000);
}

// Update Current Time
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    document.getElementById('currentTime').textContent = timeString;
}

// Initialize Parking Slots
function initializeSlots() {
    parkingSlots = [];
    for (let i = 1; i <= TOTAL_SLOTS; i++) {
        parkingSlots.push({
            slotNumber: i,
            occupied: false,
            vehiclePlate: null,
            entryTime: null,
            isReserved: Math.random() > 0.85 // 15% reserved
        });
    }
    updateSlotDropdown();
}

// Update Slot Dropdown
function updateSlotDropdown() {
    const select = document.getElementById('slotToPark');
    select.innerHTML = '<option value="">Select slot</option>';
    
    parkingSlots
        .filter(slot => !slot.occupied && !slot.isReserved)
        .forEach(slot => {
            const option = document.createElement('option');
            option.value = slot.slotNumber;
            option.textContent = `Slot ${slot.slotNumber}`;
            select.appendChild(option);
        });
}

// Check Backend Status
async function checkBackendStatus() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/vehicles/health`, {
            timeout: 3000
        });
        
        isBackendOnline = response.ok;
        const statusIndicator = document.getElementById('apiStatusIndicator');
        const statusText = document.getElementById('apiStatusText');
        const apiStatus = document.getElementById('apiStatus');
        
        if (isBackendOnline) {
            statusIndicator.style.background = '#27ae60';
            statusText.textContent = 'Backend Connected';
            apiStatus.textContent = 'Online';
            apiStatus.style.color = '#27ae60';
        } else {
            statusIndicator.style.background = '#e74c3c';
            statusText.textContent = 'Backend Offline';
            apiStatus.textContent = 'Offline';
            apiStatus.style.color = '#e74c3c';
        }
    } catch {
        isBackendOnline = false;
        const statusIndicator = document.getElementById('apiStatusIndicator');
        const statusText = document.getElementById('apiStatusText');
        const apiStatus = document.getElementById('apiStatus');
        
        statusIndicator.style.background = '#e74c3c';
        statusText.textContent = 'Backend Offline';
        apiStatus.textContent = 'Offline';
        apiStatus.style.color = '#e74c3c';
    }
}

// Load Initial Data
async function loadInitialData() {
    // Try to load from backend
    if (isBackendOnline) {
        try {
            const response = await fetch(`${BACKEND_URL}/api/vehicles`);
            if (response.ok) {
                registeredVehicles = await response.json();
                showAlert(`Loaded ${registeredVehicles.length} vehicles`, 'success');
            }
        } catch {
            // Fallback to demo data
            loadDemoData();
        }
    } else {
        // Load demo data
        loadDemoData();
    }
}

// Load Demo Data
function loadDemoData() {
    registeredVehicles = [
        { licensePlate: 'DL01AB1234' },
        { licensePlate: 'MH12CD5678' },
        { licensePlate: 'KA05EF9012' }
    ];
    
    // Demo parked vehicle
    if (parkingSlots.length > 0) {
        parkingSlots[0].occupied = true;
        parkingSlots[0].vehiclePlate = 'DL01AB1234';
        parkingSlots[0].entryTime = new Date(Date.now() - 2 * 60 * 60 * 1000);
        
        parkingTransactions.unshift({
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            vehicle: 'DL01AB1234',
            action: 'PARK',
            slot: 1,
            amount: '₹100'
        });
    }
}

// Update UI
function updateUI() {
    renderParkingSlots();
    renderVehicleTable();
    renderTransactionTable();
    updateStatistics();
    updateSlotDropdown();
}

// Render Parking Slots
function renderParkingSlots() {
    const container = document.getElementById('slotGrid');
    container.innerHTML = '';
    
    parkingSlots.forEach(slot => {
        const slotClass = slot.occupied ? 'occupied' : 
                         slot.isReserved ? 'reserved' : 'free';
        const status = slot.occupied ? 'BUSY' : 
                      slot.isReserved ? 'RES' : 'FREE';
        
        const slotElement = document.createElement('div');
        slotElement.className = `slot ${slotClass}`;
        slotElement.innerHTML = `
            <div class="slot-number">${slot.slotNumber}</div>
            <div class="slot-status">${status}</div>
            ${slot.occupied ? `<div class="slot-plate">${slot.vehiclePlate}</div>` : ''}
        `;
        
        slotElement.onclick = () => showSlotDetails(slot);
        container.appendChild(slotElement);
    });
}

// Render Vehicle Table
function renderVehicleTable() {
    const tbody = document.getElementById('vehicleTableBody');
    
    if (registeredVehicles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty">No vehicles registered</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    registeredVehicles.slice(0, 8).forEach(vehicle => {
        const parkedSlot = parkingSlots.find(s => s.vehiclePlate === vehicle.licensePlate);
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td style="font-weight: 600; font-family: 'Courier New', monospace;">
                ${vehicle.licensePlate}
            </td>
            <td>
                <span class="status-badge ${parkedSlot ? 'status-parked' : 'status-active'}">
                    ${parkedSlot ? 'Parked' : 'Active'}
                </span>
            </td>
            <td>
                ${parkedSlot ? `S${parkedSlot.slotNumber}` : '--'}
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Render Transaction Table
function renderTransactionTable() {
    const tbody = document.getElementById('transactionTableBody');
    
    if (parkingTransactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty">No transactions yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    parkingTransactions.slice(0, 6).forEach(transaction => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${transaction.time}</td>
            <td style="font-weight: 600;">${transaction.vehicle}</td>
            <td>
                <span class="action-badge ${transaction.action === 'PARK' ? 'badge-park' : 'badge-unpark'}">
                    ${transaction.action || 'PARK'}
                </span>
            </td>
            <td>${transaction.slot || '--'}</td>
            <td style="color: #27ae60; font-weight: 600;">${transaction.amount || '--'}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// Update Statistics
function updateStatistics() {
    const occupiedSlots = parkingSlots.filter(s => s.occupied).length;
    const freeSlots = TOTAL_SLOTS - occupiedSlots;
    const revenue = parkingTransactions
        .filter(t => t.amount)
        .reduce((sum, t) => sum + parseInt(t.amount.replace('₹', '')) || 0, 0);
    
    // Update header stats
    document.getElementById('totalVehicles').textContent = registeredVehicles.length;
    document.getElementById('freeSlots').textContent = freeSlots;
    
    // Update statistics card
    document.getElementById('statsTotalVehicles').textContent = registeredVehicles.length;
    document.getElementById('statsFreeSlots').textContent = freeSlots;
    document.getElementById('statsOccupiedSlots').textContent = occupiedSlots;
    document.getElementById('statsRevenue').textContent = `₹${revenue}`;
}

// Show Alert
function showAlert(message, type = 'success') {
    const alertBox = document.getElementById('alertBox');
    alertBox.textContent = message;
    alertBox.className = `alert-box alert-${type}`;
    
    setTimeout(() => {
        alertBox.className = 'alert-box';
        alertBox.textContent = '';
    }, 3000);
}

// Add Vehicle
async function addVehicle() {
    const input = document.getElementById('licensePlate');
    const plate = input.value.trim().toUpperCase();
    
    if (!plate) {
        showAlert('Please enter a license plate', 'error');
        return;
    }
    
    if (plate.length < 3) {
        showAlert('License plate must be at least 3 characters', 'error');
        return;
    }
    
    // Check if vehicle already exists
    if (registeredVehicles.some(v => v.licensePlate === plate)) {
        showAlert(`Vehicle ${plate} is already registered`, 'error');
        return;
    }
    
    // Add to local list
    registeredVehicles.push({ licensePlate: plate });
    
    // Try to save to backend
    if (isBackendOnline) {
        try {
            await fetch(`${BACKEND_URL}/api/vehicles?licensePlate=${encodeURIComponent(plate)}`, {
                method: 'POST'
            });
        } catch {
            // Silently fail if backend is down
        }
    }
    
    showAlert(`Vehicle ${plate} registered successfully`, 'success');
    input.value = '';
    updateUI();
}

// Park Vehicle
function parkVehicle() {
    const plate = document.getElementById('plateToPark').value.trim().toUpperCase();
    const slotNum = parseInt(document.getElementById('slotToPark').value);
    
    if (!plate) {
        showAlert('Please enter license plate', 'error');
        return;
    }
    
    if (!slotNum) {
        showAlert('Please select a parking slot', 'error');
        return;
    }
    
    // Check if vehicle is already registered
    if (!registeredVehicles.some(v => v.licensePlate === plate)) {
        showAlert('Vehicle not registered. Please register first.', 'error');
        return;
    }
    
    // Check if vehicle is already parked
    const alreadyParked = parkingSlots.some(s => s.vehiclePlate === plate);
    if (alreadyParked) {
        showAlert(`Vehicle ${plate} is already parked! Please unpark first.`, 'error');
        return;
    }
    
    const slot = parkingSlots.find(s => s.slotNumber === slotNum);
    if (!slot || slot.occupied || slot.isReserved) {
        showAlert('Invalid slot selected', 'error');
        return;
    }
    
    // Park vehicle
    slot.occupied = true;
    slot.vehiclePlate = plate;
    slot.entryTime = new Date();
    
    // Add transaction
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    parkingTransactions.unshift({
        time: time,
        vehicle: plate,
        action: 'PARK',
        slot: slotNum,
        amount: null
    });
    
    showAlert(`Vehicle ${plate} parked in Slot ${slotNum}`, 'success');
    document.getElementById('plateToPark').value = '';
    document.getElementById('slotToPark').value = '';
    updateUI();
}

// Unpark Vehicle
function unparkVehicle() {
    const plate = document.getElementById('plateToUnpark').value.trim().toUpperCase();
    
    if (!plate) {
        showAlert('Please enter license plate', 'error');
        return;
    }
    
    const slot = parkingSlots.find(s => s.vehiclePlate === plate);
    if (!slot) {
        showAlert('Vehicle not found in parking', 'error');
        return;
    }
    
    // Calculate charges
    const entryTime = slot.entryTime;
    const exitTime = new Date();
    const hoursParked = Math.ceil((exitTime - entryTime) / (1000 * 60 * 60));
    const charges = Math.max(HOURLY_RATE, hoursParked * HOURLY_RATE);
    
    // Update slot
    slot.occupied = false;
    slot.vehiclePlate = null;
    slot.entryTime = null;
    
    // Update transaction
    const txn = parkingTransactions.find(t => 
        t.vehicle === plate && !t.amount
    );
    if (txn) {
        txn.action = 'UNPARK';
        txn.amount = `₹${charges}`;
    }
    
    showAlert(`Vehicle ${plate} unparked. Charges: ₹${charges}`, 'success');
    document.getElementById('plateToUnpark').value = '';
    updateUI();
}

// Show Slot Details
function showSlotDetails(slot) {
    if (slot.occupied) {
        showAlert(`Slot ${slot.slotNumber}: Occupied by ${slot.vehiclePlate}`, 'info');
    } else if (slot.isReserved) {
        showAlert(`Slot ${slot.slotNumber}: Reserved`, 'info');
    } else {
        showAlert(`Slot ${slot.slotNumber}: Available for parking`, 'info');
    }
}

// Refresh Vehicles
function refreshVehicles() {
    showAlert('Refreshing data...', 'info');
    updateUI();
}

// Initialize when page loads
window.onload = initApp;