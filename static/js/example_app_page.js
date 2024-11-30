document.addEventListener('DOMContentLoaded', function() {
    const budgetForm = document.getElementById("budgetForm");
    
    if (budgetForm) {
        budgetForm.addEventListener("submit", (event) => {
            event.preventDefault();
            
            const monthInput = document.getElementById('budgetMonth').value;
            const monthDate = new Date(monthInput + "-01"); // Add day for proper date parsing
            const income = parseFloat(document.getElementById("monthlyIncome").value);
            const expenses = {
                "Rent/Mortgage": parseFloat(document.getElementById("rentMortgage").value) || 0,
                "Car Insurance": parseFloat(document.getElementById("carInsurance").value) || 0,
                "Groceries": parseFloat(document.getElementById("groceries").value) || 0,
                "Eating Out": parseFloat(document.getElementById("eatingOut").value) || 0,
                "Transportation": parseFloat(document.getElementById("transportation").value) || 0,
                "Entertainment": parseFloat(document.getElementById("entertainment").value) || 0,
                "Savings": parseFloat(document.getElementById("savings").value) || 0,
                "Phone Bill": parseFloat(document.getElementById("phoneBill").value) || 0,
                "Electricity": parseFloat(document.getElementById("electricity").value) || 0,
                "WiFi": parseFloat(document.getElementById("wifi").value) || 0,
                "Miscellaneous": parseFloat(document.getElementById("miscellaneous").value) || 0,
            };

            const thresholds = {
                "Rent/Mortgage": 0.30,
                "Car Insurance": 0.10,
                "Groceries": 0.15,
                "Eating Out": 0.10,
                "Transportation": 0.10,
                "Entertainment": 0.10,
                "Savings": 0.20,
                "Phone Bill": 0.05,
                "Electricity": 0.10,
                "WiFi": 0.05,
                "Miscellaneous": 0.05,
            };

            const budgetData = {
                timestamp: new Date().toISOString(),
                month: monthDate.toISOString(),
                monthlyIncome: income,
                expenses: expenses,
                thresholds: thresholds
            };

            storeBudgetData(budgetData);

            const results = [];
            for (const [category, amount] of Object.entries(expenses)) {
                const threshold = thresholds[category];
                const ratio = amount / income;
                const flag = ratio > threshold;
                results.push({ category, amount, threshold, ratio, flag });
            }

            const resultsDiv = document.getElementById("results");
            resultsDiv.innerHTML = `<h3>Budget Analysis Results</h3>`;
            results.forEach(({ category, amount, threshold, ratio, flag }) => {
                const statusClass = flag ? "over-budget" : "within-budget";
                const statusText = flag ? "Over Budget" : "Within Budget";
                resultsDiv.innerHTML += `
                    <div>
                        <strong>${category}:</strong> $${amount.toFixed(2)} 
                        (${(ratio * 100).toFixed(2)}% of income, threshold: ${(threshold * 100).toFixed(2)}%) 
                        - <span class="${statusClass}">${statusText}</span>
                    </div>`;
            });

            // Just close the modal and update dashboard
            const budgetModal = bootstrap.Modal.getInstance(document.getElementById('budgetModal'));
            budgetModal.hide();
        });
        
    }

        // Journal Entry Logic

    const journalForm = document.getElementById('journalForm');
    const journalEntryField = document.getElementById('journalEntry');
    const journalNameField = document.getElementById('journalName'); // New input for entry name

    // Save the journal entry
    journalForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent default form submission

        const entryText = journalEntryField.value.trim(); // Get the input value
        const entryName = journalNameField.value.trim(); // Get the entry name

        if (entryText === "" || entryName === "") {
            alert("Both journal name and entry cannot be empty.");
            return;
        }

        // Retrieve existing entries from localStorage or initialize a new array
        const savedEntries = JSON.parse(localStorage.getItem('journalEntries')) || [];

        // Add the new entry with a name and timestamp
        savedEntries.push({
            name: entryName,
            text: entryText,
            timestamp: new Date().toISOString(),
        });

        // Update localStorage
        localStorage.setItem('journalEntries', JSON.stringify(savedEntries));

        // Clear the form fields
        journalEntryField.value = "";
        journalNameField.value = "";

        // Close the modal
        const journalModal = bootstrap.Modal.getInstance(document.getElementById('journalModal'));
        journalModal.hide();

        alert("Journal entry saved successfully!");

        // Update the journal list on the dashboard
        updateJournalEntriesList();
    });

    // Function to update the journal entries list on the dashboard
    function updateJournalEntriesList() {
        const entriesContainer = document.getElementById('journalEntriesList');
        const savedEntries = JSON.parse(localStorage.getItem('journalEntries')) || [];

        // Clear existing entries
        entriesContainer.innerHTML = '';

        // Display saved entries
        savedEntries.forEach((entry, index) => {
            const entryDiv = document.createElement('div');
            entryDiv.classList.add('journal-entry');

            const entryName = document.createElement('strong');
            entryName.textContent = entry.name;

            const entryTimestamp = document.createElement('small');
            entryTimestamp.textContent = new Date(entry.timestamp).toLocaleString();

            const entryText = document.createElement('p');
            entryText.textContent = entry.text;

            const openEntryButton = document.createElement('button');
            openEntryButton.classList.add('btn', 'btn-link');
            openEntryButton.textContent = 'View Entry';
            openEntryButton.addEventListener('click', () => alert(entry.text));

            entryDiv.appendChild(entryName);
            entryDiv.appendChild(entryTimestamp);
            entryDiv.appendChild(entryText);
            entryDiv.appendChild(openEntryButton);

            entriesContainer.appendChild(entryDiv);
        });
    }

    // Load saved journal entries into the dashboard when page loads
    updateJournalEntriesList();

    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', function(event) {
            event.preventDefault();
            var email = document.getElementById('email').value;
            var password = document.getElementById('password').value;
            var description = document.getElementById('description').value;
            var isAdmin = document.getElementById('isAdmin').checked;
            
            addUser(email, password, description, isAdmin).then(() => {
                document.getElementById('email').value = '';
                document.getElementById('password').value = '';
                document.getElementById('description').value = '';
                document.getElementById('isAdmin').checked = false;
                
                const addUserModalEl = document.getElementById('addUserModal');
                const modalInstance = bootstrap.Modal.getInstance(addUserModalEl);
                modalInstance.hide();
            }).catch((error) => {
                console.error('Error adding user:', error);
                alert('Error adding user. Please try again.');
            });
            loadUsersIntoTable();
        });
    }

    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        editUserForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const email = document.getElementById('editEmail').value;
            const description = document.getElementById('editDescription').value;
            const isAdmin = document.getElementById('editIsAdmin').checked;

            try {
                await DataModel.editSelectedUser(email, description, isAdmin);
                document.getElementById('editEmail').value = '';
                document.getElementById('editDescription').value = '';
                document.getElementById('editIsAdmin').checked = false;
                
                const editUserModalEl = document.getElementById('editUserModal');
                const modalInstance = bootstrap.Modal.getInstance(editUserModalEl);
                modalInstance.hide();
                alert('User successfully edited!');
                loadUsersIntoTable();
            } catch (error) {
                console.error('Error editing user:', error);
                alert('Error editing user. Please try again.');
            }
        });
    }

    const budgetSelector = document.getElementById('budgetSelector');
    if (budgetSelector) {
        budgetSelector.addEventListener('change', function() {
            const selectedIndex = this.value;
            if (selectedIndex !== "") {
                const budgetHistory = JSON.parse(localStorage.getItem('budgetHistory')) || [];
                const selectedBudget = budgetHistory[selectedIndex];
                if (selectedBudget) {
                    updateDashboard(selectedBudget);
                    // Analyze and display budget results
                    const results = [];
                    for (const [category, amount] of Object.entries(selectedBudget.expenses)) {
                        const threshold = selectedBudget.thresholds[category];
                        const ratio = amount / selectedBudget.monthlyIncome;
                        const flag = ratio > threshold;
                        results.push({ category, amount, threshold, ratio, flag });
                    }
    
                    const resultsDiv = document.getElementById("results");
                    resultsDiv.innerHTML = `<h3>Budget Analysis Results</h3>`;
                    results.forEach(({ category, amount, threshold, ratio, flag }) => {
                        const statusClass = flag ? "over-budget" : "within-budget";
                        const statusText = flag ? "Over Budget" : "Within Budget";
                        resultsDiv.innerHTML += `
                            <div>
                                <strong>${category}:</strong> $${amount.toFixed(2)} 
                                (${(ratio * 100).toFixed(2)}% of income, threshold: ${(threshold * 100).toFixed(2)}%) 
                                - <span class="${statusClass}">${statusText}</span>
                            </div>`;
                    });
                }
            }
        });
    }

        adminStatus = localStorage.getItem('admin');
    DataModel.admin = adminStatus;

    // Load the most recent budget entry if it exists
    const budgetHistory = JSON.parse(localStorage.getItem('budgetHistory')) || [];
    if (budgetHistory.length > 0) {
        const mostRecentBudget = budgetHistory[budgetHistory.length - 1];
        updateDashboard(mostRecentBudget);
    }

    // Populate budget selector with existing entries
    updateBudgetSelector();

    if (adminStatus == 'true') {
        loadUsersIntoTable();
    } else {
        const accountManagementTab = document.getElementById('account-management-tab');
        if (accountManagementTab) {
            accountManagementTab.classList.add('disabled');
            accountManagementTab.setAttribute('disabled', 'true');
        }
    }

    // Add this within the DOMContentLoaded or equivalent initialization section
    document.addEventListener('DOMContentLoaded', () => {
    const journalForm = document.getElementById('journalForm');
    const journalEntryField = document.getElementById('journalEntry');

    // Save the journal entry
    journalForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent default form submission

        const entryText = journalEntryField.value.trim(); // Get the input value
        if (entryText === "") {
            alert("Journal entry cannot be empty.");
            return;
        }

        // Retrieve existing entries from localStorage or initialize a new array
        const savedEntries = JSON.parse(localStorage.getItem('journalEntries')) || [];

        // Add the new entry with a timestamp
        savedEntries.push({
            text: entryText,
            timestamp: new Date().toISOString(),
        });

        // Update localStorage
        localStorage.setItem('journalEntries', JSON.stringify(savedEntries));

        // Clear the textarea
        journalEntryField.value = "";

        // Close the modal
        const journalModal = bootstrap.Modal.getInstance(document.getElementById('journalModal'));
        journalModal.hide();

        alert("Journal entry saved successfully!");
    });
});

    // Initialize budget selector change event
    
    
    // Check admin status

});

// Toggle Chat Modal
const chatHead = document.getElementById('chatHead');
const chatModal = document.getElementById('chatModal');
chatHead.addEventListener('click', () => {
    chatModal.style.display = chatModal.style.display === 'flex' ? 'none' : 'flex';
});

// Chat Functionality
const chatBody = document.getElementById('chatBody');
const chatInput = document.getElementById('chatInput');
const sendChat = document.getElementById('sendChat');

async function sendMessageToAI(message) {
    const maxRetries = 5;
    const initialDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Uncomment the Authorization header if you have an API key
                    // 'Authorization': 'Bearer YOUR_HUGGING_FACE_API_KEY'
                },
                body: JSON.stringify({
                    inputs: message, // Message content
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (!data || !data.generated_text) {
                throw new Error('No response returned from API');
            }

            return data.generated_text; // AI-generated response

        } catch (error) {
            if (error.message.includes('429') || error.message.includes('503')) {
                if (attempt < maxRetries) {
                    const delay = initialDelay * (2 ** (attempt - 1)); // Exponential backoff
                    console.log(`Attempt ${attempt} failed. Retrying in ${delay} ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                } else {
                    console.error('Max retries reached. Unable to get a response from the API.');
                }
            } else {
                console.error('Error communicating with AI:', error.message);
            }
            return 'Sorry, there was an error processing your request. Please try again.';
        }
    }
}

sendChat.addEventListener('click', async () => {
    const userMessage = chatInput.value.trim();
    if (userMessage === '') return;

    // Display user's message
    const userBubble = document.createElement('div');
    userBubble.textContent = userMessage;
    userBubble.style.textAlign = 'right';
    chatBody.appendChild(userBubble);

    // Clear input
    chatInput.value = '';

    // Get AI response
    const aiResponse = await sendMessageToAI(userMessage);

    // Display AI's response
    const aiBubble = document.createElement('div');
    aiBubble.textContent = aiResponse;
    aiBubble.style.textAlign = 'left';
    chatBody.appendChild(aiBubble);

    // Scroll to the bottom
    chatBody.scrollTop = chatBody.scrollHeight;
});

// function sendChat(text) {
//     if (text.trim() === "") {
//         console.error("Cannot send an empty message.");
//         return;
//     }
//     ChatSocket.sendMessage(text);
// }

async function addUser(email, password, description, isAdmin) {
    if (!email || !password || !description) {
        console.error("Email, password, and description are required.");
        return;
    }
    try {
        const result = await DataModel.addUser(email, password, description, isAdmin);
        console.log('User created:', result);
        alert('User successfully added!');
        await loadUsersIntoTable();
    } catch (error) {
        console.error('Error adding user:', error);
        alert('Error adding user. Please try again.');
    }
}

async function deleteUser(userId) {
    if (!userId) {
        console.error("User ID is required for deletion.");
        return;
    }
    const isConfirmed = confirm(`Are you sure you want to delete this user? This action cannot be undone.`);
    if (!isConfirmed) {
        return;
    }
    try {
        DataModel.setSelectedUser(userId);
        await DataModel.deleteUser();
        console.log(`User with ID ${userId} deleted.`);
        alert('User successfully deleted!');
        await loadUsersIntoTable();
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user. Please try again.');
    }
}

async function loadUsersIntoTable() {
    try {
        const users = await DataModel.getAllUsers();
        const tableBody = document.querySelector('#account-management tbody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        users.forEach(user => {
            const row = document.createElement('tr');
            
            const emailCell = document.createElement('td');
            emailCell.textContent = user.email;
            row.appendChild(emailCell);
            
            const adminCell = document.createElement('td');
            adminCell.textContent = user.admin ? 'Admin' : 'User';
            row.appendChild(adminCell);
            
            const descriptionCell = document.createElement('td');
            descriptionCell.textContent = user.description;
            row.appendChild(descriptionCell);
            
            const actionsCell = document.createElement('td');
            
            const editButton = document.createElement('button');
            editButton.className = 'btn btn-primary btn-sm me-2';
            editButton.innerHTML = '<i class="fas fa-edit"></i> Edit';
            editButton.addEventListener('click', () => showEditModal(user.id));
            actionsCell.appendChild(editButton);
            
            const deleteButton = document.createElement('button');
            deleteButton.className = 'btn btn-danger btn-sm';
            deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
            deleteButton.addEventListener('click', () => deleteUser(user.id));
            actionsCell.appendChild(deleteButton);
            
            row.appendChild(actionsCell);
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading users into table:', error);
        alert('Error loading users. Please try again.');
    }
}

function openAddUserModal() {
    const addUserModal = new bootstrap.Modal(document.getElementById('addUserModal'));
    if (addUserModal) {
        addUserModal.show();
    }
}

function showEditModal(userId) {
    DataModel.setSelectedUser(userId);
    const user = DataModel.getCurrentUser();
    if (user) {
        document.getElementById('editEmail').value = user.email;
        document.getElementById('editDescription').value = user.description;
        document.getElementById('editIsAdmin').checked = user.admin;
        const editUserModal = new bootstrap.Modal(document.getElementById('editUserModal'));
        editUserModal.show();
    } else {
        console.error('User not found');
    }
}

function updateBudgetSelector() {
    const selector = document.getElementById('budgetSelector');
    if (!selector) return;
    
    const budgetHistory = JSON.parse(localStorage.getItem('budgetHistory')) || [];
    
    // Clear existing options
    selector.innerHTML = '<option value="">Select a budget entry...</option>';
    
    // Add unique entries only
    const uniqueEntries = new Map();
    budgetHistory.forEach((entry, index) => {
        const date = new Date(entry.month);
        const monthYear = date.toLocaleString('en-US', { 
            year: 'numeric', 
            month: 'long' 
        });
        uniqueEntries.set(monthYear, { entry, index });
    });
    
    // Create options from unique entries
    uniqueEntries.forEach(({entry, index}, monthYear) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = monthYear;
        selector.appendChild(option);
    });
}

function updateMonthlySummary(budgetData) {
    const summaryDiv = document.getElementById('monthlySummary');
    if (summaryDiv) {
        const totalExpenses = Object.values(budgetData.expenses).reduce((a, b) => a + b, 0);
        const income = budgetData.monthlyIncome;
        summaryDiv.innerHTML = `
            <h3>Monthly Summary</h3>
            <p>Income: $${income.toFixed(2)}</p>
            <p>Expenses: $${totalExpenses.toFixed(2)}</p>
            <p>Remaining: $${(income - totalExpenses).toFixed(2)}</p>
        `;
    }
}

function updateSavingsProgress(budgetData) {
    const savingsDiv = document.getElementById('savingsProgress');
    if (savingsDiv) {
        const savings = budgetData.expenses["Savings"] || 0;
        const income = budgetData.monthlyIncome;
        const savingsRatio = (savings / income) * 100;
        savingsDiv.innerHTML = `
            <h3>Savings Progress</h3>
            <p>Current Savings: $${savings.toFixed(2)} (${savingsRatio.toFixed(1)}% of income)</p>
        `;
    }
}

function updateExpenseChart(budgetData) {
    const ctx = document.getElementById('expenseChart');
    if (!ctx) return;
    
    const labels = Object.keys(budgetData.expenses);
    const data = Object.values(budgetData.expenses);
    
    if (window.expenseChart instanceof Chart) {
        window.expenseChart.destroy();
    }
    
    window.expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#FF6384', '#36A2EB',
                    '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function updateDashboard(budgetData) {
    updateExpenseChart(budgetData);
    updateMonthlySummary(budgetData);
    updateSavingsProgress(budgetData);
}

function storeBudgetData(budgetData) {
    const budgetHistory = JSON.parse(localStorage.getItem('budgetHistory')) || [];
    budgetHistory.push(budgetData);
    localStorage.setItem('budgetHistory', JSON.stringify(budgetHistory));
    updateBudgetSelector();
    updateDashboard(budgetData);
}