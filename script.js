// ============================================
// GROCERY LIST MANAGER - COMPLETE SOLUTION
// ============================================

// State Management
let savedLists = [];
let currentList = {
    id: null,
    name: 'Untitled List',
    items: [],
    createdAt: null,
    updatedAt: null
};
let previousItems = new Set();
let previousPreparations = new Set();
let currentEditListId = null;

// DOM Elements
const elements = {
    // Buttons
    createNewListBtn: document.getElementById('createNewListBtn'),
    startNewListBtn: document.getElementById('startNewListBtn'),
    saveCurrentListBtn: document.getElementById('saveCurrentListBtn'),
    clearCurrentListBtn: document.getElementById('clearCurrentListBtn'),
    downloadPdfBtn: document.getElementById('downloadPdfBtn'),
    closeListBtn: document.getElementById('closeListBtn'),
    addItemBtn: document.getElementById('addItemBtn'),
    
    // Modals and Buttons
    confirmCreateBtn: document.getElementById('confirmCreateBtn'),
    cancelCreateBtn: document.getElementById('cancelCreateBtn'),
    confirmEditBtn: document.getElementById('confirmEditBtn'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),
    
    // Inputs
    listNameInput: document.getElementById('listNameInput'),
    editListNameInput: document.getElementById('editListNameInput'),
    itemInput: document.getElementById('itemInput'),
    quantityInput: document.getElementById('quantityInput'),
    unitSelect: document.getElementById('unitSelect'),
    
    // Containers
    savedListsContainer: document.getElementById('savedListsContainer'),
    currentItemsList: document.getElementById('currentItemsList'),
    rightPanel: document.getElementById('rightPanel'),
    listCreationSection: document.getElementById('listCreationSection'),
    welcomeSection: document.getElementById('welcomeSection'),
    suggestionsBox: document.getElementById('suggestionsBox'),
    
    // Modals
    createListModal: document.getElementById('createListModal'),
    editListNameModal: document.getElementById('editListNameModal'),
    
    // Display Elements
    currentListTitle: document.getElementById('currentListTitle'),
    itemCount: document.getElementById('itemCount')
};

// Initialize App
function initApp() {
    loadSavedData();
    setupEventListeners();
    renderSavedLists();
}

// Load saved data from localStorage
function loadSavedData() {
    // Load saved lists
    const savedListsData = localStorage.getItem('grocerySavedLists');
    if (savedListsData) {
        savedLists = JSON.parse(savedListsData);
    }
    
    // Load previous preparations
    const previousPreparationsData = localStorage.getItem('groceryPreviousPreparations');
    if (previousPreparationsData) {
        previousPreparations = new Set(JSON.parse(previousPreparationsData));
    }

    // Load previous items for autocomplete
    const previousItemsData = localStorage.getItem('groceryPreviousItems');
    if (previousItemsData) {
        previousItems = new Set(JSON.parse(previousItemsData));
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('grocerySavedLists', JSON.stringify(savedLists));
    localStorage.setItem('groceryPreviousItems', JSON.stringify([...previousItems]));
    localStorage.setItem('groceryPreviousPreparations', JSON.stringify([...previousPreparations])); 
}

// Setup all event listeners
function setupEventListeners() {
    // Create New List buttons
    elements.createNewListBtn.addEventListener('click', showCreateListModal);
    elements.startNewListBtn.addEventListener('click', showCreateListModal);
    
    // Modal buttons
    elements.confirmCreateBtn.addEventListener('click', createNewList);
    elements.cancelCreateBtn.addEventListener('click', hideCreateListModal);
    elements.confirmEditBtn.addEventListener('click', updateListName);
    elements.cancelEditBtn.addEventListener('click', hideEditListModal);
    
    // List management buttons
    elements.saveCurrentListBtn.addEventListener('click', saveCurrentList);
    elements.clearCurrentListBtn.addEventListener('click', clearCurrentList);
    elements.downloadPdfBtn.addEventListener('click', downloadPdf);
    elements.closeListBtn.addEventListener('click', closeCurrentList);
    
    // Item management
    elements.addItemBtn.addEventListener('click', addItemToList);
    elements.itemInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addItemToList();
    });
    
    // Autocomplete
    elements.itemInput.addEventListener('input', showAutocompleteSuggestions);
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === elements.createListModal) hideCreateListModal();
        if (e.target === elements.editListNameModal) hideEditListModal();
    });
}

// ============================================
// LIST MANAGEMENT FUNCTIONS
// ============================================

// Show create list modal
function showCreateListModal() {
    elements.listNameInput.value = '';
    elements.createListModal.style.display = 'flex';
    elements.listNameInput.focus();
}

// Hide create list modal
function hideCreateListModal() {
    elements.createListModal.style.display = 'none';
}

// Create new list
function createNewList() {
    const listName = elements.listNameInput.value.trim();
    
    if (!listName) {
        alert('Please enter a name for your list');
        return;
    }
    
    // Create new list
    currentList = {
        id: Date.now(),
        name: listName,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Show list creation interface
    showListCreationInterface();
    hideCreateListModal();
    
    // Clear inputs
    elements.itemInput.value = '';
    elements.quantityInput.value = 1;
    elements.unitSelect.value = 'kg';
}

// Show list creation interface
function showListCreationInterface() {
    elements.currentListTitle.textContent = currentList.name;
    elements.welcomeSection.style.display = 'none';
    elements.listCreationSection.style.display = 'block';
    elements.itemInput.focus();
    renderCurrentItems();
}

// Add rename button to current list header
function updateListHeader() {
    const header = document.querySelector('.current-list-header');
    if (!header) return;
    
    // Check if rename button already exists
    if (!document.getElementById('renameListBtn')) {
        const renameBtn = document.createElement('button');
        renameBtn.id = 'renameListBtn';
        renameBtn.className = 'btn-small';
        renameBtn.innerHTML = '<i class="fas fa-edit"></i> Rename';
        renameBtn.onclick = renameCurrentList;
        
        // Add to header actions
        const actionsDiv = header.querySelector('.list-actions-top');
        if (actionsDiv) {
            actionsDiv.appendChild(renameBtn);
        }
    }
}

// Rename current list
function renameCurrentList() {
    const newName = prompt('Enter new name for this list:', currentList.name);
    
    if (newName && newName.trim() && newName !== currentList.name) {
        currentList.name = newName.trim();
        currentList.updatedAt = new Date().toISOString();
        elements.currentListTitle.textContent = currentList.name;
        
        // Update in saved lists if saved
        const existingIndex = savedLists.findIndex(list => list.id === currentList.id);
        if (existingIndex !== -1) {
            savedLists[existingIndex].name = currentList.name;
            savedLists[existingIndex].updatedAt = currentList.updatedAt;
            saveData();
            renderSavedLists();
        }
        
        alert('List name updated!');
    }
}

// Close current list
function closeCurrentList() {
    if (currentList.items.length > 0) {
        const shouldSave = confirm('You have unsaved items. Do you want to save before closing?');
        if (shouldSave) {
            saveCurrentList();
        }
    }
    
    // Reset current list
    currentList = {
        id: null,
        name: 'Untitled List',
        items: [],
        createdAt: null,
        updatedAt: null
    };
    
    // Show welcome screen
    elements.listCreationSection.style.display = 'none';
    elements.welcomeSection.style.display = 'flex';
}

// Save current list
function saveCurrentList() {
    if (currentList.items.length === 0) {
        alert('Cannot save an empty list');
        return;
    }
    
    currentList.updatedAt = new Date().toISOString();
    
    // Check if this is an existing list
    const existingIndex = savedLists.findIndex(list => list.id === currentList.id);
    
    if (existingIndex !== -1) {
        // Update existing list
        savedLists[existingIndex] = { ...currentList };
        alert('List updated successfully!');
    } else {
        // Add new list
        savedLists.unshift({ ...currentList });
        alert('List saved successfully!');
    }
    
    saveData();
    renderSavedLists();
    updateListHeader(); // Ensure rename button is added
}

// Clear current list
function clearCurrentList() {
    if (currentList.items.length === 0) return;
    
    const confirmClear = confirm('Are you sure you want to clear all items from this list?');
    if (confirmClear) {
        currentList.items = [];
        renderCurrentItems();
    }
}

// ============================================
// ITEM MANAGEMENT FUNCTIONS
// ============================================

// Add item to current list
function addItemToList() {
    const itemName = elements.itemInput.value.trim();
    const quantity = parseInt(elements.quantityInput.value) || 1;
    const unit = elements.unitSelect.value;
    const preparation = document.getElementById('preparationInput').value.trim();
    
    if (!itemName) {
        alert('Please enter an ingredient name');
        return;
    }
    
    // Add item to current list
    currentList.items.push({
        id: Date.now(),
        name: itemName,
        quantity: quantity,
        unit: unit,
        preparation: preparation
    });
    
    // Add to previous items for autocomplete
    previousItems.add(itemName);
    
    // Add to previous preparations for autocomplete
    if (preparation) {
        previousPreparations.add(preparation);
    }
    
    saveData();
    
    // Clear inputs
    elements.itemInput.value = '';
    elements.quantityInput.value = 1;
    elements.unitSelect.value = 'kg';
    document.getElementById('preparationInput').value = '';
    elements.suggestionsBox.style.display = 'none';
    document.getElementById('preparationSuggestions').style.display = 'none';
    
    // Refresh display
    renderCurrentItems();
    elements.itemInput.focus();
}

// Remove item from list
function removeItemFromList(itemId) {
    const itemIndex = currentList.items.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
        currentList.items.splice(itemIndex, 1);
        renderCurrentItems();
    }
}

// Edit item in list
function editItemInList(itemId) {
    const item = currentList.items.find(item => item.id === itemId);
    if (!item) return;
    
    // For simplicity, we'll remove and re-add
    removeItemFromList(itemId);
    elements.itemInput.value = item.name;
    elements.quantityInput.value = item.quantity;
    elements.unitSelect.value = item.unit;
    document.getElementById('preparationInput').value = item.preparation || '';
    elements.itemInput.focus();
}

// Render current items
function renderCurrentItems() {
    const container = elements.currentItemsList;
    
    if (currentList.items.length === 0) {
        container.innerHTML = `
            <div class="empty-list-message">
                <i class="fas fa-shopping-basket"></i>
                <p>No items added yet. Start adding items above!</p>
            </div>
        `;
        elements.itemCount.textContent = 'Total Items: 0';
        return;
    }
    
    // Create items HTML with preparation column
    const itemsHtml = currentList.items.map((item, index) => `
        <div class="current-item" data-item-id="${item.id}">
            <span class="item-name">${item.name}</span>
            <span class="item-quantity">${item.quantity}</span>
            <span class="item-unit">${item.unit}</span>
            <span class="item-preparation">${item.preparation || '-'}</span>
            <div class="item-actions-inline">
                <button class="inline-action-btn inline-edit-btn" onclick="editItemInList(${item.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="inline-action-btn inline-delete-btn" onclick="removeItemFromList(${item.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = itemsHtml;
    elements.itemCount.textContent = `Total Items: ${currentList.items.length}`;
}

// ============================================
// AUTOCOMPLETE FUNCTIONS
// ============================================

// Update the showAutocompleteSuggestions function to handle Marathi better
function showAutocompleteSuggestions() {
    const input = elements.itemInput.value;
    const suggestionsBox = elements.suggestionsBox;
    
    if (!input) {
        suggestionsBox.style.display = 'none';
        return;
    }
    
    // Convert input to lowercase for case-insensitive matching
    const inputLower = input.toLowerCase();
    
    // Filter previous items (case-insensitive for English, direct for Marathi)
    const filtered = [...previousItems].filter(item => {
        if (containsMarathi(item)) {
            return item.includes(input);
        }
        return item.toLowerCase().includes(inputLower);
    }).slice(0, 8);
    
    if (filtered.length === 0) {
        suggestionsBox.style.display = 'none';
        return;
    }
    
    // Create suggestions HTML
    suggestionsBox.innerHTML = filtered.map(item => `
        <div class="suggestion-item" data-item="${item}">
            ${item}
        </div>
    `).join('');
    
    suggestionsBox.style.display = 'block';
    
    // Add click handlers to suggestions
    document.querySelectorAll('.suggestion-item').forEach(suggestion => {
        suggestion.addEventListener('click', () => {
            elements.itemInput.value = suggestion.getAttribute('data-item');
            suggestionsBox.style.display = 'none';
            elements.quantityInput.focus();
        });
    });
}

// Add autocomplete for preparation input
document.getElementById('preparationInput').addEventListener('input', showPreparationSuggestions);

function showPreparationSuggestions() {
    const input = document.getElementById('preparationInput').value;
    const suggestionsBox = document.getElementById('preparationSuggestions');
    
    if (!input) {
        suggestionsBox.style.display = 'none';
        return;
    }
    
    const inputLower = input.toLowerCase();
    
    // Filter previous preparations
    const filtered = [...previousPreparations].filter(prep => 
        prep.toLowerCase().includes(inputLower)
    ).slice(0, 8);
    
    if (filtered.length === 0) {
        suggestionsBox.style.display = 'none';
        return;
    }
    
    suggestionsBox.innerHTML = filtered.map(prep => `
        <div class="suggestion-item" data-prep="${prep}">
            ${prep}
        </div>
    `).join('');
    
    suggestionsBox.style.display = 'block';
    
    // Add click handlers to suggestions
    document.querySelectorAll('#preparationSuggestions .suggestion-item').forEach(suggestion => {
        suggestion.addEventListener('click', () => {
            document.getElementById('preparationInput').value = suggestion.getAttribute('data-prep');
            suggestionsBox.style.display = 'none';
        });
    });
}

// ============================================
// SAVED LISTS FUNCTIONS
// ============================================

// Render saved lists
function renderSavedLists() {
    const container = elements.savedListsContainer;
    
    if (savedLists.length === 0) {
        container.innerHTML = `
            <div class="no-lists-message">
                <i class="fas fa-clipboard-list"></i>
                <p>No saved lists yet. Create your first list!</p>
            </div>
        `;
        return;
    }
    
    // Create saved lists HTML
    const listsHtml = savedLists.map(list => `
        <div class="saved-list-item">
            <div class="list-name">${list.name}</div>
            <div class="list-meta">
                ${new Date(list.updatedAt).toLocaleDateString()} • 
                ${list.items.length} items
            </div>
            <div class="list-actions">
                <button class="action-btn-small btn-edit" onclick="editSavedList(${list.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="action-btn-small btn-duplicate" onclick="duplicateSavedList(${list.id})">
                    <i class="fas fa-copy"></i> Duplicate
                </button>
                <button class="action-btn-small btn-delete" onclick="deleteSavedList(${list.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
                <button class="action-btn-small btn-rename" onclick="renameSavedList(${list.id})">
                    <i class="fas fa-i-cursor"></i> Rename
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = listsHtml;
}

// Edit saved list
function editSavedList(listId) {
    const list = savedLists.find(l => l.id === listId);
    if (!list) return;
    
    // Load list into current list
    currentList = JSON.parse(JSON.stringify(list)); // Deep copy
    showListCreationInterface();
    updateListHeader(); // Add rename button
}

// Duplicate saved list
function duplicateSavedList(listId) {
    const list = savedLists.find(l => l.id === listId);
    if (!list) return;
    
    // Ask for new name
    const newName = prompt('Enter name for the duplicated list:', `${list.name} (Copy)`);
    
    if (!newName || !newName.trim()) {
        alert('Duplication cancelled');
        return;
    }
    
    // Create a copy with new ID
    const duplicatedList = {
        ...JSON.parse(JSON.stringify(list)),
        id: Date.now(),
        name: newName.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Add to saved lists
    savedLists.unshift(duplicatedList);
    saveData();
    renderSavedLists();
    
    alert('List duplicated successfully!');
}

// Rename saved list
function renameSavedList(listId) {
    const list = savedLists.find(l => l.id === listId);
    if (!list) return;
    
    const newName = prompt('Enter new name for this list:', list.name);
    
    if (newName && newName.trim() && newName !== list.name) {
        list.name = newName.trim();
        list.updatedAt = new Date().toISOString();
        
        // Update current list if it's the same
        if (currentList.id === listId) {
            currentList.name = newName.trim();
            elements.currentListTitle.textContent = newName.trim();
        }
        
        saveData();
        renderSavedLists();
        alert('List renamed successfully!');
    }
}

// Delete saved list
function deleteSavedList(listId) {
    if (!confirm('Are you sure you want to delete this list?')) return;
    
    savedLists = savedLists.filter(list => list.id !== listId);
    saveData();
    renderSavedLists();
    
    // If we're currently editing this list, close it
    if (currentList.id === listId) {
        closeCurrentList();
    }
}

// Show edit list name modal
function showEditListNameModal(listId) {
    const list = savedLists.find(l => l.id === listId);
    if (!list) return;
    
    currentEditListId = listId;
    elements.editListNameInput.value = list.name;
    elements.editListNameModal.style.display = 'flex';
    elements.editListNameInput.focus();
}

// Hide edit list modal
function hideEditListModal() {
    elements.editListNameModal.style.display = 'none';
    currentEditListId = null;
}

// Update list name
function updateListName() {
    const newName = elements.editListNameInput.value.trim();
    
    if (!newName) {
        alert('Please enter a name for the list');
        return;
    }
    
    const listIndex = savedLists.findIndex(list => list.id === currentEditListId);
    if (listIndex !== -1) {
        savedLists[listIndex].name = newName;
        savedLists[listIndex].updatedAt = new Date().toISOString();
        saveData();
        renderSavedLists();
        
        // If this is the current list, update the title
        if (currentList.id === currentEditListId) {
            currentList.name = newName;
            elements.currentListTitle.textContent = newName;
        }
    }
    
    hideEditListModal();
}

// ============================================
// PDF GENERATION FUNCTIONS - UPDATED FOR 5 COLUMNS
// ============================================

// Download PDF with proper Marathi support
async function downloadPdf() {
    if (currentList.items.length === 0) {
        alert('Cannot download PDF: List is empty');
        return;
    }
    
    if (!window.jspdf) {
        alert('PDF library not loaded. Please try again.');
        return;
    }
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Check if list contains Marathi text
        const hasMarathiText = currentList.items.some(item => 
            containsMarathi(item.name) || containsMarathi(item.unit) || containsMarathi(item.preparation)
        ) || containsMarathi(currentList.name);
        
        // Method 1: Try to use html2canvas for perfect rendering
        if (hasMarathiText && window.html2canvas) {
            try {
                await generatePdfWithCanvas();
                return;
            } catch (canvasError) {
                console.log('Canvas method failed, falling back...', canvasError);
            }
        }
        
        // Method 2: Use jsPDF with unicode support
        try {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(20);
            doc.setTextColor(40, 40, 40);
            
            if (hasMarathiText) {
                // Simple layout for Marathi text
                let y = 20;
                
                doc.setFontSize(18);
                doc.text("GROCERY LIST", 105, y, { align: 'center' });
                y += 10;
                
                doc.setFontSize(14);
                doc.text(`List: ${currentList.name}`, 20, y);
                y += 10;
                
                doc.setFontSize(12);
                doc.text(`Created: ${new Date().toLocaleDateString()}`, 20, y);
                doc.text(`Total Items: ${currentList.items.length}`, 180, y, { align: 'right' });
                y += 15;
                
                // Table header with 5 columns
                doc.setFillColor(240, 240, 240);
                doc.rect(15, y, 180, 10, 'F');
                y += 7;
                
                // 5 COLUMN HEADERS
                doc.text('#', 20, y);
                doc.text('Item', 35, y);
                doc.text('Qty', 90, y);
                doc.text('Unit', 110, y);
                doc.text('Prep', 140, y); // NEW PREPARATION COLUMN
                y += 10;
                
                doc.line(15, y, 195, y);
                y += 10;
                
                // Items with 5 columns
                currentList.items.forEach((item, index) => {
                    if (y > 270) {
                        doc.addPage();
                        y = 20;
                    }
                    
                    doc.text((index + 1).toString(), 20, y);
                    doc.text(item.name, 35, y);
                    doc.text(item.quantity.toString(), 90, y);
                    doc.text(item.unit, 110, y);
                    doc.text(item.preparation || '-', 140, y); // NEW PREPARATION DATA
                    
                    y += 10;
                });
                
                y = 280;
                doc.setFontSize(10);
                doc.setTextColor(128, 0, 0);
                doc.text('Note: Marathi text may not display correctly in this PDF viewer.', 105, y, { align: 'center' });
                y += 5;
                doc.text('For proper Marathi display, please use the HTML print option.', 105, y, { align: 'center' });
                
            } else {
                // For English text with 5 columns
                // Title
                doc.text(currentList.name, 105, 20, { align: 'center' });
                
                // Date and info
                doc.setFontSize(12);
                doc.text(`Created: ${new Date().toLocaleDateString()}`, 15, 35);
                doc.text(`Total Items: ${currentList.items.length}`, 180, 35, { align: 'right' });
                
                // Table header with 5 columns
                doc.setFillColor(240, 240, 240);
                doc.rect(15, 45, 180, 10, 'F');
                
                doc.setFontSize(12);
                doc.setTextColor(0, 0, 0);
                
                // 5 COLUMN HEADERS (ADJUSTED FOR SPACING)
                doc.text('#', 20, 52);
                doc.text('Item', 40, 52);
                doc.text('Qty', 100, 52);
                doc.text('Unit', 120, 52);
                doc.text('Preparation', 160, 52); // NEW COLUMN
                
                // Items with 5 columns
                let yPos = 65;
                currentList.items.forEach((item, index) => {
                    if (yPos > 270) {
                        doc.addPage();
                        yPos = 20;
                    }
                    
                    if (index % 2 === 0) {
                        doc.setFillColor(250, 250, 250);
                        doc.rect(15, yPos - 6, 180, 8, 'F');
                    }
                    
                    doc.setFontSize(11);
                    doc.text((index + 1).toString(), 20, yPos);
                    doc.text(item.name, 40, yPos);
                    doc.text(item.quantity.toString(), 100, yPos);
                    doc.text(item.unit, 120, yPos);
                    doc.text(item.preparation || '-', 160, yPos); // NEW PREPARATION DATA
                    
                    yPos += 10;
                });
            }
            
            // Footer
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text('Generated by Grocery List Manager', 105, 285, { align: 'center' });
            
            // Save PDF
            const fileName = `Grocery_List_${currentList.name.replace(/[^a-z0-9]/gi, '_')}.pdf`;
            doc.save(fileName);
            
            if (hasMarathiText) {
                setTimeout(() => {
                    const useAlternative = confirm(
                        'Marathi text may not display perfectly in PDF.\n\n' +
                        'Click OK to also download an HTML version (better for Marathi).\n' +
                        'Click Cancel to keep the PDF only.'
                    );
                    
                    if (useAlternative) {
                        downloadHtmlVersion();
                    }
                }, 1000);
            }
            
        } catch (error) {
            console.error('PDF generation error:', error);
            downloadHtmlVersion();
        }
        
    } catch (error) {
        console.error('PDF Generation Error:', error);
        alert('Error generating PDF. Downloading HTML version instead.');
        downloadHtmlVersion();
    }
}

// Generate PDF using canvas (perfect Marathi support)
async function generatePdfWithCanvas() {
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = `
        position: fixed;
        left: -10000px; 
        top: -10000px;
        width: 800px;
        padding: 40px;
        background: white;
        font-family: 'Arial', 'Noto Sans Devanagari', sans-serif;
        color: black;
    `;
    
    // Create HTML content with 5 columns
    tempDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="font-size: 28px; margin: 0; color: #333;">${escapeHtml(currentList.name)}</h1>
            <p style="color: #666; margin: 10px 0;">
                Created: ${new Date().toLocaleDateString()} | 
                Total Items: ${currentList.items.length}
            </p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
                <tr style="background: #f5f5f5;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">#</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Item Name</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Quantity</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Unit</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Preparation</th> <!-- NEW COLUMN -->
                </tr>
            </thead>
            <tbody>
                ${currentList.items.map((item, index) => `
                    <tr style="${index % 2 === 0 ? 'background: #fafafa;' : ''}">
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${index + 1}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; font-family: 'Noto Sans Devanagari', Arial, sans-serif;">${escapeHtml(item.name)}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(item.unit)}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(item.preparation || '-')}</td> <!-- NEW PREPARATION DATA -->
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div style="margin-top: 40px; text-align: center; color: #888; font-size: 12px;">
            Generated by Grocery List Manager
        </div>
    `;
    
    document.body.appendChild(tempDiv);
    
    try {
        const canvas = await html2canvas(tempDiv, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        });
        
        document.body.removeChild(tempDiv);
        
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, imgWidth, imgHeight);
        
        const fileName = `Grocery_List_${currentList.name.replace(/[^a-z0-9]/gi, '_')}.pdf`;
        pdf.save(fileName);
        
        alert('PDF downloaded with perfect Marathi text support!');
        
    } catch (error) {
        document.body.removeChild(tempDiv);
        throw error;
    }
}

// Download HTML version (always works with Marathi)
function downloadHtmlVersion() {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Grocery List: ${escapeHtml(currentList.name)}</title>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700&display=swap" rel="stylesheet">
        <style>
            body {
                font-family: 'Noto Sans Devanagari', Arial, sans-serif;
                margin: 40px;
                color: #333;
            }
            .header {
                text-align: center;
                margin-bottom: 40px;
                padding-bottom: 20px;
                border-bottom: 2px solid #4CAF50;
            }
            h1 {
                color: #2c3e50;
                margin-bottom: 10px;
            }
            .info {
                color: #7f8c8d;
                margin: 10px 0;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }
            th {
                background: #4CAF50;
                color: white;
                padding: 15px;
                text-align: left;
                font-weight: bold;
            }
            td {
                padding: 12px 15px;
                border-bottom: 1px solid #ddd;
            }
            tr:nth-child(even) {
                background: #f9f9f9;
            }
            .footer {
                margin-top: 40px;
                text-align: center;
                color: #95a5a6;
                font-size: 12px;
                padding-top: 20px;
                border-top: 1px solid #ecf0f1;
            }
            @media print {
                body { margin: 0; }
                .no-print { display: none; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>${escapeHtml(currentList.name)}</h1>
            <div class="info">
                Created: ${new Date().toLocaleDateString()} | 
                Total Items: ${currentList.items.length}
            </div>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Item Name</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                    <th>Preparation</th> <!-- NEW COLUMN -->
                </tr>
            </thead>
            <tbody>
                ${currentList.items.map((item, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td style="font-family: 'Noto Sans Devanagari', Arial, sans-serif;">${escapeHtml(item.name)}</td>
                        <td>${item.quantity}</td>
                        <td>${escapeHtml(item.unit)}</td>
                        <td>${escapeHtml(item.preparation || '-')}</td> <!-- NEW PREPARATION DATA -->
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div class="footer">
            Generated by Grocery List Manager • ${new Date().toLocaleString()}
            <div class="no-print" style="margin-top: 20px;">
                <button onclick="window.print()" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; cursor: pointer; border-radius: 5px;">
                    Print this list
                </button>
            </div>
        </div>
        
        <script>
            setTimeout(() => {
                if (confirm('Do you want to print this list?')) {
                    window.print();
                }
            }, 500);
        </script>
    </body>
    </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Grocery_List_${currentList.name.replace(/[^a-z0-9]/gi, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('HTML file downloaded with perfect Marathi support!\nYou can print it or save as PDF from your browser.');
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Helper function to check if text contains Marathi
function containsMarathi(text) {
    if (!text || typeof text !== 'string') return false;
    const marathiRegex = /[\u0900-\u097F]/;
    return marathiRegex.test(text);
}

// ============================================
// INITIALIZE APP
// ============================================

// Make functions available globally for inline onclick handlers
window.editItemInList = editItemInList;
window.removeItemFromList = removeItemFromList;
window.editSavedList = editSavedList;
window.duplicateSavedList = duplicateSavedList;
window.deleteSavedList = deleteSavedList;
window.renameSavedList = renameSavedList;

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);