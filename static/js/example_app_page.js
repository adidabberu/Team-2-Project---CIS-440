document.addEventListener('DOMContentLoaded', function() {

    // NOTE: IF YOUR APP USES WEBSOCKETS THEN UNCOMMENT THIS LINE
    //       TO ESTABLISH A CONNECTION TO THE WEBSOCKET SERVER

    // ChatSocket.connect();  // Establish the WebSocket connection

    // NOTE: SET CALLBACKS FOR SOCKET EVENTS HERE (MAPPED TO FUNCTIONS BELOW)

    // ChatSocket.setMessageCallback(sendChat);

    // Example usage: set up event listeners for adding and deleting users (if buttons exist)
    // Assuming you have addUserButton and deleteUserButton in your HTML
    /*
    document.getElementById('addUserButton').addEventListener('click', () => {
        const email = document.getElementById('userEmail').value;
        const password = document.getElementById('userPassword').value;
        const description = document.getElementById('userDescription').value;
        addUser(email, password, description);
    });
    */

    document.getElementById("budgetForm").addEventListener("submit", (event) => {
        event.preventDefault();
    
        // Get inputs
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
    
        // Thresholds for budget categories
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
    
        // Analyze the budget
        const results = [];
        for (const [category, amount] of Object.entries(expenses)) {
            const threshold = thresholds[category];
            const ratio = amount / income;
            const flag = ratio > threshold;
            results.push({ category, amount, threshold, ratio, flag });
        }
    
        // Display results
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
    });

    // Listen for the form submission
    document.getElementById('addUserForm').addEventListener('submit', function(event) {
        // Prevent the default form submission behavior
        event.preventDefault();
    
        // Collect data from the form inputs
        var email = document.getElementById('email').value;
        var password = document.getElementById('password').value;
        var description = document.getElementById('description').value;
        // Get the checkbox value and convert it to a boolean
        var isAdmin = document.getElementById('isAdmin').checked;
    
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('Description:', description);
        console.log('Is Admin:', isAdmin); // Log the admin status
    
        // Call the addUser function with the form data, including the admin status
        addUser(email, password, description, isAdmin).then(() => {
            // Clear the input fields after user is added
            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
            document.getElementById('description').value = '';
            document.getElementById('isAdmin').checked = false; // Reset the checkbox
    
            // Hide the modal using Bootstrap's modal instance
            const addUserModalEl = document.getElementById('addUserModal');
            const modalInstance = bootstrap.Modal.getInstance(addUserModalEl); // Get existing modal instance
            modalInstance.hide();
        }).catch((error) => {
            console.error('Error adding user:', error);
            alert('Error adding user. Please try again.');
        });
    
        loadUsersIntoTable();
    });

    // Add a listener for the Edit User form submission
document.getElementById('editUserForm').addEventListener('submit', async function(event) {
    // Prevent the default form submission behavior
    event.preventDefault();

    // Collect data from the form inputs
    const email = document.getElementById('editEmail').value;
    const description = document.getElementById('editDescription').value;
    const isAdmin = document.getElementById('editIsAdmin').checked;  // Grab the value of the isAdmin checkbox

    try {
        // Call the DataModel's editSelectedUser function to update the user
        await DataModel.editSelectedUser(email, description, isAdmin);  // Pass isAdmin as the third parameter

        // If the update was successful, clear the modal inputs
        document.getElementById('editEmail').value = '';
        document.getElementById('editDescription').value = '';
        document.getElementById('editIsAdmin').checked = false; // Reset the checkbox

        // Hide the modal
        const editUserModalEl = document.getElementById('editUserModal');
        const modalInstance = bootstrap.Modal.getInstance(editUserModalEl);
        modalInstance.hide();

        // Alert that the user was successfully edited
        alert('User successfully edited!');

        // Refresh the user list in the table
        loadUsersIntoTable();
    } catch (error) {
        console.error('Error editing user:', error);
        alert('Error editing user. Please try again.');
    }
});


    adminStatus = localStorage.getItem('admin');
    //alert('adminStatus: ' + adminStatus);
    DataModel.admin = adminStatus;
    if (adminStatus == 'true') {
        // Load users into the table after adding a new user
        loadUsersIntoTable();
    } else {
        // Disable the account management tab
        //alert('You are not an admin');
        document.getElementById('account-management-tab').classList.add('disabled');  // Add the 'disabled' class to the tab
        document.getElementById('account-management-tab').setAttribute('disabled', 'true');  // Set the disabled attribute
    }
});

// NOTE: PLACE ALL OF YOUR FUNCTIONS BELOW

// Example function that sends a websocket message via the ChatSocket object
function sendChat(text) {
    // Checks to make sure string is not empty
    if (text.trim() === "") {
        console.error("Cannot send an empty message.");  // Log error if message is empty
        return;
    }

    ChatSocket.sendMessage(text);  // Send the message using ChatSocket
}

// Function to add a new user
async function addUser(email, password, description, isAdmin) {
    if (!email || !password || !description) {
        console.error("Email, password, and description are required.");
        return;
    }

    try {
        // Use DataModel's addUser function to add the user, including the isAdmin parameter
        const result = await DataModel.addUser(email, password, description, isAdmin);
        console.log('User created:', result);
        alert('User successfully added!');  // Show a success message

        await loadUsersIntoTable();  // Refresh user list in the table after addition

    } catch (error) {
        console.error('Error adding user:', error);
        alert('Error adding user. Please try again.');
    }
}

// Function to delete a user by ID
async function deleteUser(userId) {
    if (!userId) {
        console.error("User ID is required for deletion.");
        return;
    }

    // Ask for user confirmation before proceeding with deletion
    const isConfirmed = confirm(`Are you sure you want to delete this user? This action cannot be undone.`);

    // If the user confirms the deletion, proceed
    if (!isConfirmed) {
        return;  // Exit the function if the user doesn't confirm
    }

    try {
        // Call DataModel's deleteUser function to delete the user by their ID
        DataModel.setSelectedUser(userId);
        await DataModel.deleteUser();
        console.log(`User with ID ${userId} deleted.`);
        alert('User successfully deleted!');  // Show a success message
        await loadUsersIntoTable();  // Refresh user list in the table after deletion
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user. Please try again.');
    }
}

// Function to load users into the HTML table
// Function to load users into the table
async function loadUsersIntoTable() {
    try {
        const users = await DataModel.getAllUsers();  // Get all users from DataModel
        const tableBody = document.querySelector('#account-management tbody');  // Select the table body
        tableBody.innerHTML = '';  // Clear existing table rows

        users.forEach(user => {
            // Create a new row for each user
            const row = document.createElement('tr');

            // Email column
            const emailCell = document.createElement('td');
            emailCell.textContent = user.email;
            row.appendChild(emailCell);

            // Admin status column (added next to the email)
            const adminCell = document.createElement('td');
            adminCell.textContent = user.admin ? 'Admin' : 'User';  // Display 'Admin' if user is an admin, otherwise 'User'
            row.appendChild(adminCell);

            // Description column
            const descriptionCell = document.createElement('td');
            descriptionCell.textContent = user.description;
            row.appendChild(descriptionCell);

            // Actions column
            const actionsCell = document.createElement('td');

            // Edit button
            const editButton = document.createElement('button');
            editButton.className = 'btn btn-primary btn-sm me-2';
            editButton.innerHTML = '<i class="fas fa-edit"></i> Edit';
            editButton.addEventListener('click', () => showEditModal(user.id));
            actionsCell.appendChild(editButton);

            // Delete button
            const deleteButton = document.createElement('button');
            deleteButton.className = 'btn btn-danger btn-sm';
            deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
            deleteButton.addEventListener('click', () => deleteUser(user.id));
            actionsCell.appendChild(deleteButton);

            row.appendChild(actionsCell);

            // Add the row to the table
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading users into table:', error);
        alert('Error loading users. Please try again.');
    }
}

function openAddUserModal() {
    var addUserModal = new bootstrap.Modal(document.getElementById('addUserModal'));
    addUserModal.show();
  }

// Function to show the edit modal with user details
// Function to show the edit modal with user details
function showEditModal(userId) {
    // Set the selected user in DataModel
    DataModel.setSelectedUser(userId);  

    // Get the selected user object from DataModel
    const user = DataModel.getCurrentUser();  

    // Check if the user exists
    if (user) {
        // Populate the email and description inputs in the modal with the user's data
        document.getElementById('editEmail').value = user.email;
        document.getElementById('editDescription').value = user.description;

        // Set the checkbox value based on the user's admin status
        document.getElementById('editIsAdmin').checked = user.admin;  // Update: Set checkbox for admin status

        // Show the edit modal
        const editUserModal = new bootstrap.Modal(document.getElementById('editUserModal'));
        editUserModal.show();
    } else {
        console.error('User not found');
    }
}

