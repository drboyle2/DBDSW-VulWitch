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
        document.getElementById('loginError').style.display = 'none';
        alert('Login successful!');
    })
    .catch(error => {
        document.getElementById('loginError').innerText = error.message;
        document.getElementById('loginError').style.display = 'block';
    });
});

//  Add User Form
document.getElementById('addUserForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;
    fetch('/add-user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        if (response.ok) {
            return response.text();
        } else {
            throw new Error('Failed to add user');
        }
    })
    .then(result => {
        document.getElementById('addUserResult').innerText = result;
    })
    .catch(error => {
        document.getElementById('addUserResult').innerText = error.message;
    });
});

// Upload Code Form
document.getElementById('uploadForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const fileInput = document.getElementById('codeFile');
    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const code = e.target.result;
            analyzeCode(code);
        };
        reader.readAsText(file);
    } else {
        alert('Please select a file first.');
    }
});

function analyzeCode(code) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerText = `Analyzed code:\n${code}`;
}
