// Login Form Event Listener
document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('loginForm')){
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
                console.log(data.userType);
                if (data.userType == 'admin') {
                    console.log(data.userType);
                    document.getElementById('systemReportSection').style.display = 'block';
                    document.getElementById('uploadSection').style.display = 'none';
                } else {
                    console.log(data.userType);
                    document.getElementById('uploadSection').style.display = 'block';
                    document.getElementById('systemReportSection').style.display = 'none';
                }
                alert('Login successful!');
            })
            .catch(error => {
                if (error.message=='Invalid username or password' || error.message == 'An error occurred during login') {
                    alert(error.message);
                }
            });
        });
    }
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
    };

    // Registration Form Event Listener
    if(document.getElementById('uploadForm')){
        document.getElementById('uploadForm').addEventListener('submit', function(event) {
            event.preventDefault();
            const fileInput = document.getElementById('codeFile');
            const file = fileInput.files[0];
        
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const code = e.target.result;
                    analyzeCode(code,file.name);
                };
                reader.readAsText(file);
            } else {
                alert('Please select a file first.');
            }
        });
    }
    if(document.getElementById('systemReportSection')){
        document.getElementById('systemReportSection').addEventListener('click', function(event) {
            event.preventDefault();
            fetch('/report', {
                method: 'GET'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error analyzing code');
                }
                return response.blob(); // Assuming the server responds with a PDF
            })
            .then(blob => {
                // Create a URL for the blob and trigger a download
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'report.pdf'; // Name of the downloaded file
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url); // Clean up
                resultDiv.innerText = 'Analysis complete! PDF downloaded.';
            })
            .catch(error => {
                
            });
            
        });
    }
    
    function analyzeCode(code,name) {
        const resultDiv = document.getElementById('result');
        // Send the code to the server for analysis
        fetch('/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,  // Include the token if needed
                'Name': name
            },
            body: JSON.stringify({ code })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error analyzing code');
            }
            return response.blob(); // Assuming the server responds with a PDF
        })
        .then(blob => {
            // Create a URL for the blob and trigger a download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'analysis_report.pdf'; // Name of the downloaded file
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url); // Clean up
            resultDiv.innerText = 'Analysis complete! PDF downloaded.';
        })
        .catch(error => {
            
        });
    }
});