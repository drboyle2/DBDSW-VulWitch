// Login Form Event Listener
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else if (response.status === 401) {
                throw new Error('Invalid username or password');
            } else {
                throw new Error('An error occurred during login');
            }
        })
        .then(data => {
            const token = data.token;
            localStorage.setItem('jwtToken', token);
            document.getElementById('uploadSection').style.display = 'block';
            document.getElementById('addUserSection').style.display = 'block';
            alert('Login successful!');
        })
        .catch(error => {
            if (error.message=='Invalid username or password' || error.message == 'An error occurred during login') {
                alert(error.message);
            }
        });
    });

    // Registration Form Event Listener
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
    const fileupload = document.getElementById('uploadForm');
    fileupload.addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = new FormData();
        const file = document.getElementById("codeFile").files[0];
        console.log(file);
        formData.append('file', file);
        fetch('/analyze', {
            method: 'POST',
            body: formData,
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to upload file');
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('result').innerText = data.message + ' Filename: ' + data.filename;
        })
        .catch(error => {
            console.error('Error during file upload:', error);
            document.getElementById('result').innerText = 'Upload failed: ' + error.message;
        });
    });
});
