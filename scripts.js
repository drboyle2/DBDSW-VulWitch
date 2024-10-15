document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Simulate login check (for demonstration purposes)
    if (username === 'admin' && password === 'password') {
        document.getElementById('uploadSection').style.display = 'block';
        alert('Login successful!');
    } else {
        alert('Invalid credentials!');
    }
});

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
    }
});