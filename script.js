document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Simulate login check (for demonstration purposes)
    if (username === 'admin' && password === 'Vulwitch') {
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

//This should take the file and send it to the python backend as post and then get the response of using flawfinder and display on screen.
function analyzeCode(uploaded_code) {
    const formData = new FormData();
    formData.append('file',uploaded_code);  //This just makees the key value pairs for post

    fetch('/file_upload',{
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error){  //doesnt exist or the wrong data gives an error
            alert(`Error: ${data.error}`);
        } else{
            document.getElementById('result').innerText = data.result;   //displays result of flawfinder on screen
        }
    })
    .catch(error => { //if file doesnt exist or didnt get uploaded
        console.error("Error:", error);
    });
}