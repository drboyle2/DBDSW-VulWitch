// Login Form Event Listener
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const username = document.getElementById('regUsername').value;
            let password = ""; // Use let to allow reassignment
            
            // Password validation
            if (document.getElementById("regPassword").value === document.getElementById('regConfirmPassword').value) {
                password = document.getElementById("regPassword").value;
            } else {
                alert("Passwords do not match!");
                return; // Exit the function if passwords do not match
            }
            
            // Gather additional registration data
            const type = "user"; // Assuming you have a user type field

            // Create the user data object
            const userData = {
                name: username,
                password: password,
                type: type
            };
            console.log(userData);
            // Send registration data to the server
            fetch('http://localhost:3000/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json(); // Return the JSON response
            })
            .then(data => {
                alert('User registered successfully! User ID: ' + data.userId);
                registerForm.reset(); // Reset the form after successful registration
            })
            .catch(error => {
                console.error('Error during registration:', error);
                alert('Registration failed: ' + error.message);
            });
        });
    }
});
