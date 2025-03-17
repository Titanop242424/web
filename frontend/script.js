document.getElementById('setupVPS').addEventListener('click', function () {
    const ip = prompt('Enter VPS IP:');
    const username = prompt('Enter VPS Username:');
    const password = prompt('Enter VPS Password:');

    if (ip && username && password) {
        fetch('https://your-backend.onrender.com/setup-vps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip, username, password }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then((data) => {
                document.getElementById('vpsStatus').textContent = data.message;
                document.getElementById('vpsStatus').style.color = '#00ff00';
            })
            .catch((error) => {
                console.error('Error:', error);
                document.getElementById('vpsStatus').textContent = 'Failed to set up VPS!';
                document.getElementById('vpsStatus').style.color = '#ff0000';
            });
    } else {
        alert('All fields are required!');
    }
});

document.getElementById('attackButton').addEventListener('click', function () {
    const ip = document.getElementById('ip').value;
    const port = document.getElementById('port').value;
    const duration = document.getElementById('duration').value;

    // Input validation
    if (!ip || !port || !duration) {
        alert('All fields are required!');
        return;
    }

    if (isNaN(port) || isNaN(duration)) {
        alert('Port and duration must be numbers!');
        return;
    }

    if (duration > 180) {
        alert('Duration must be 180 seconds or less!');
        return;
    }

    fetch('https://your-backend.onrender.com/start-attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, port: Number(port), duration: Number(duration) }),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then((data) => {
            document.getElementById('attackStatus').textContent = data.message;
        })
        .catch((error) => {
            console.error('Error:', error);
            document.getElementById('attackStatus').textContent = 'Attack failed!';
        });
});
